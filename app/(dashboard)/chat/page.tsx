"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Guten Tag! Ich bin Ihr KI-Assistent für die Pastler-Verwaltung. Wie kann ich Ihnen helfen?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages }),
    });

    if (!res.ok) {
      let message = "Anfrage fehlgeschlagen";
      try {
        const data = (await res.json()) as { error?: string };
        message = data.error ?? message;
      } catch {
        // ignore
      }
      setError(message);
      setLoading(false);
      return;
    }

    const data = (await res.json()) as { content: string };
    setMessages([
      ...nextMessages,
      { role: "assistant", content: data.content },
    ]);
    setLoading(false);
  }

  return (
    <div
      className="mx-auto flex max-w-3xl flex-col"
      style={{ height: "calc(100vh - 5rem)" }}
    >
      <PageHeader
        title="KI-Assistent"
        subtitle="Fragen zu Objekten, Mietern, Partnern und Todos"
      />

      <div className="flex min-h-0 flex-1 flex-col rounded-[4px] border border-border bg-white">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((msg, index) => (
            <div
              key={`${msg.role}-${index}`}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-[4px] px-4 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-navy text-white"
                    : "bg-warm-white text-text-primary"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-sm text-text-hint">Assistent schreibt…</div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="border-t border-border bg-error/5 px-4 py-2 text-sm text-error">
            {error}
          </div>
        )}

        <form
          onSubmit={sendMessage}
          className="flex gap-2 border-t border-border p-4"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nachricht eingeben…"
            className="flex-1 rounded-[4px] border border-border px-3 py-2 text-sm outline-none focus:border-navy"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
