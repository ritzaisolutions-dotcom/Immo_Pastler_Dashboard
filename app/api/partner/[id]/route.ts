import { NextResponse } from "next/server";
import { requireMitarbeiter } from "@/lib/api-auth";
import { TABLES } from "@/lib/supabase/tables";
import { isPartnerGewerk, type PartnerGewerk } from "@/lib/types";

type PartnerBody = {
  firma?: unknown;
  ansprechpartner?: unknown;
  adresse?: unknown;
  plz?: unknown;
  stadt?: unknown;
  email?: unknown;
  telefon?: unknown;
  gewerk?: unknown;
  beschreibung?: unknown;
  notizen?: unknown;
  aktiv?: unknown;
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMitarbeiter();
  if ("error" in auth && auth.error) return auth.error;

  const { id } = await params;
  const body: PartnerBody = await request.json();

  const update: Record<string, string | boolean | null> = {};

  if ("firma" in body) {
    if (typeof body.firma !== "string" || !body.firma.trim()) {
      return NextResponse.json({ error: "firma cannot be empty" }, { status: 400 });
    }
    update.firma = body.firma.trim();
  }
  if (body.ansprechpartner !== undefined) {
    update.ansprechpartner =
      typeof body.ansprechpartner === "string" ? body.ansprechpartner.trim() || null : null;
  }
  if (body.adresse !== undefined) {
    update.adresse = typeof body.adresse === "string" ? body.adresse.trim() || null : null;
  }
  if (body.plz !== undefined) {
    update.plz = typeof body.plz === "string" ? body.plz.trim() || null : null;
  }
  if (body.stadt !== undefined) {
    update.stadt = typeof body.stadt === "string" ? body.stadt.trim() || null : null;
  }
  if ("email" in body) {
    if (typeof body.email !== "string" || !body.email.trim()) {
      return NextResponse.json({ error: "email cannot be empty" }, { status: 400 });
    }
    update.email = body.email.trim();
  }
  if (body.telefon !== undefined) {
    update.telefon = typeof body.telefon === "string" ? body.telefon.trim() || null : null;
  }
  if (typeof body.gewerk === "string" && isPartnerGewerk(body.gewerk)) {
    update.gewerk = body.gewerk as PartnerGewerk;
  }
  if (body.beschreibung !== undefined) {
    update.beschreibung =
      typeof body.beschreibung === "string" ? body.beschreibung.trim() || null : null;
  }
  if (body.notizen !== undefined) {
    update.notizen = typeof body.notizen === "string" ? body.notizen.trim() || null : null;
  }
  if (typeof body.aktiv === "boolean") {
    update.aktiv = body.aktiv;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: updated, error } = await auth.supabase
    .from(TABLES.partner)
    .update(update)
    .eq("id", id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
