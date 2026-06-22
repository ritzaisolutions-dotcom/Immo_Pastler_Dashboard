import { NextResponse } from "next/server";
import { requireMitarbeiter } from "@/lib/api-auth";
import { mapDbError } from "@/lib/api-errors";
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
  notizen?: unknown;
  beschreibung?: unknown;
  aktiv?: unknown;
};

function parsePartnerBody(body: PartnerBody) {
  if (typeof body.firma !== "string" || !body.firma.trim()) {
    return { error: "Firma ist erforderlich" as const };
  }
  if (typeof body.email !== "string" || !body.email.trim()) {
    return { error: "E-Mail ist erforderlich" as const };
  }
  if (typeof body.gewerk !== "string" || !isPartnerGewerk(body.gewerk)) {
    return { error: "Ungültiges Gewerk" as const };
  }

  return {
    data: {
      firma: body.firma.trim(),
      ansprechpartner:
        typeof body.ansprechpartner === "string" ? body.ansprechpartner.trim() || null : null,
      adresse: typeof body.adresse === "string" ? body.adresse.trim() || null : null,
      plz: typeof body.plz === "string" ? body.plz.trim() || null : null,
      stadt: typeof body.stadt === "string" ? body.stadt.trim() || null : null,
      email: body.email.trim(),
      telefon: typeof body.telefon === "string" ? body.telefon.trim() || null : null,
      gewerk: body.gewerk as PartnerGewerk,
      beschreibung:
        typeof body.beschreibung === "string" ? body.beschreibung.trim() || null : null,
      notizen: typeof body.notizen === "string" ? body.notizen.trim() || null : null,
      aktiv: typeof body.aktiv === "boolean" ? body.aktiv : true,
    },
  };
}

export async function POST(request: Request) {
  const auth = await requireMitarbeiter();
  if ("error" in auth && auth.error) return auth.error;

  const body: PartnerBody = await request.json();
  const parsed = parsePartnerBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from(TABLES.partner)
    .insert(parsed.data)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: mapDbError(error) }, { status: 400 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
