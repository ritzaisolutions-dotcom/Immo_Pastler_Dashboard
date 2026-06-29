import { NextResponse } from "next/server";
import { requireMitarbeiter } from "@/lib/api-auth";
import { parseChatMessages } from "@/lib/chat-limits";
import { rateLimit } from "@/lib/rate-limit";
import { CHAT_API_RATE_LIMIT } from "@/lib/rate-limit-paths";

const SYSTEM_PROMPT = `Du bist ein KI-Assistent für die Hausverwaltung Pastler Immobilienberatung in Koblenz.
Du hilfst Mitarbeitern bei Fragen zu Mieterverwaltung, Objekten, Partnern, E-Mails und Todos.
Antworte auf Deutsch, präzise und professionell. Halte Antworten kurz, es sei denn, mehr Detail wird verlangt.
Gib keine personenbezogenen Daten aus E-Mails oder Mieterstammdaten wieder, wenn sie nicht nötig sind.`;

const MISTRAL_CHAT_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_MODEL = "mistral-small-latest";

export async function POST(request: Request) {
  const auth = await requireMitarbeiter();
  if ("error" in auth && auth.error) return auth.error;

  const limited = rateLimit(
    `chat:user:${auth.user.id}`,
    CHAT_API_RATE_LIMIT.limit,
    CHAT_API_RATE_LIMIT.windowMs,
  );
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Zu viele Chat-Anfragen. Bitte kurz warten." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "KI-Assistent ist nicht konfiguriert (MISTRAL_API_KEY fehlt)" },
      { status: 503 },
    );
  }

  const body = (await request.json()) as { messages?: unknown };
  const parsed = parseChatMessages(body.messages);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const response = await fetch(MISTRAL_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        max_tokens: 1024,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...parsed.messages,
        ],
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "KI-Anfrage fehlgeschlagen" },
        { status: 502 },
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: "KI-Anfrage fehlgeschlagen" },
        { status: 502 },
      );
    }

    return NextResponse.json({ content });
  } catch {
    return NextResponse.json(
      { error: "KI-Anfrage fehlgeschlagen" },
      { status: 502 },
    );
  }
}
