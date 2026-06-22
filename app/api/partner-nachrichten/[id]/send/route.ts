import { NextResponse } from "next/server";
import { requireMitarbeiter } from "@/lib/api-auth";
import { sendPartnerEmail } from "@/lib/smtp";
import { TABLES } from "@/lib/supabase/tables";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMitarbeiter();
  if ("error" in auth && auth.error) return auth.error;

  const { id } = await params;

  const { data: nachricht } = await auth.supabase
    .from(TABLES.partnerNachrichten)
    .select(
      `id, betreff, inhalt, status, partner:${TABLES.partner}(email, firma)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!nachricht || nachricht.status !== "entwurf") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const partnerRaw = nachricht.partner as unknown;
  const partner = (
    Array.isArray(partnerRaw) ? partnerRaw[0] : partnerRaw
  ) as { email: string; firma: string } | null | undefined;
  if (!partner?.email) {
    return NextResponse.json({ error: "Partner email missing" }, { status: 400 });
  }

  const sent = await sendPartnerEmail({
    to: partner.email,
    subject: nachricht.betreff,
    text: nachricht.inhalt,
  });

  if (!sent.ok) {
    return NextResponse.json({ error: sent.error }, { status: 500 });
  }

  const { error } = await auth.supabase
    .from(TABLES.partnerNachrichten)
    .update({
      status: "gesendet",
      gesendet_at: new Date().toISOString(),
      gesendet_von: auth.user.email ?? null,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Status update failed" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
