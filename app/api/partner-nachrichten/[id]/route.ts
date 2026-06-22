import { NextResponse } from "next/server";
import { requireMitarbeiter } from "@/lib/api-auth";
import { TABLES } from "@/lib/supabase/tables";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMitarbeiter();
  if ("error" in auth && auth.error) return auth.error;

  const { id } = await params;
  const body: unknown = await request.json();

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { betreff, inhalt, status } = body as {
    betreff?: unknown;
    inhalt?: unknown;
    status?: unknown;
  };

  const { data: existing } = await auth.supabase
    .from(TABLES.partnerNachrichten)
    .select("id, status")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.status !== "entwurf") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const update: Record<string, string> = {};

  if (typeof betreff === "string" && betreff.trim()) {
    update.betreff = betreff.trim();
  }
  if (typeof inhalt === "string" && inhalt.trim()) {
    update.inhalt = inhalt.trim();
  }
  if (status === "abgelehnt") {
    update.status = "abgelehnt";
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from(TABLES.partnerNachrichten)
    .update(update)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
