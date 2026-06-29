import { NextResponse } from "next/server";
import { requireMitarbeiter } from "@/lib/api-auth";
import { mapDbError } from "@/lib/api-errors";
import { isValidGewerkKey } from "@/lib/gewerk";
import { gewerkExists } from "@/lib/gewerke-server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { TABLES } from "@/lib/supabase/tables";
import { type PartnerAnredeForm, type PartnerGewerk } from "@/lib/types";

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
  anrede_form?: unknown;
  einsatzgebiet?: unknown;
  objekt_ids?: unknown;
};

function isAnredeForm(value: unknown): value is PartnerAnredeForm {
  return value === "sie" || value === "du";
}

function parseObjektIds(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((id): id is string => typeof id === "string");
}

async function syncPartnerObjekte(
  supabase: SupabaseClient,
  partnerId: string,
  objektIds: string[],
) {
  const { error: deleteError } = await supabase
    .from(TABLES.partnerObjekte)
    .delete()
    .eq("partner_id", partnerId);

  if (deleteError) {
    return deleteError;
  }

  if (objektIds.length === 0) {
    return null;
  }

  const { error: insertError } = await supabase
    .from(TABLES.partnerObjekte)
    .insert(
      objektIds.map((inserat_id) => ({
        partner_id: partnerId,
        inserat_id,
      })),
    );

  return insertError;
}

function parsePartnerFields(body: PartnerBody) {
  if (typeof body.firma !== "string" || !body.firma.trim()) {
    return { error: "Firma ist erforderlich" as const };
  }
  if (typeof body.email !== "string" || !body.email.trim()) {
    return { error: "E-Mail ist erforderlich" as const };
  }
  if (typeof body.gewerk !== "string" || !isValidGewerkKey(body.gewerk)) {
    return { error: "Ungültiges Gewerk" as const };
  }

  return {
    data: {
      firma: body.firma.trim(),
      ansprechpartner:
        typeof body.ansprechpartner === "string"
          ? body.ansprechpartner.trim() || null
          : null,
      adresse:
        typeof body.adresse === "string" ? body.adresse.trim() || null : null,
      plz: typeof body.plz === "string" ? body.plz.trim() || null : null,
      stadt: typeof body.stadt === "string" ? body.stadt.trim() || null : null,
      email: body.email.trim(),
      telefon:
        typeof body.telefon === "string" ? body.telefon.trim() || null : null,
      gewerk: body.gewerk as PartnerGewerk,
      beschreibung:
        typeof body.beschreibung === "string"
          ? body.beschreibung.trim() || null
          : null,
      notizen:
        typeof body.notizen === "string" ? body.notizen.trim() || null : null,
      aktiv: typeof body.aktiv === "boolean" ? body.aktiv : true,
      anrede_form: isAnredeForm(body.anrede_form) ? body.anrede_form : "sie",
      einsatzgebiet:
        typeof body.einsatzgebiet === "string"
          ? body.einsatzgebiet.trim() || null
          : null,
    },
    objektIds: parseObjektIds(body.objekt_ids),
  };
}

export async function POST(request: Request) {
  const auth = await requireMitarbeiter();
  if ("error" in auth && auth.error) return auth.error;

  const body: PartnerBody = await request.json();
  const parsed = parsePartnerFields(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (!(await gewerkExists(auth.supabase, parsed.data.gewerk))) {
    return NextResponse.json({ error: "Gewerk existiert nicht" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from(TABLES.partner)
    .insert(parsed.data)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: mapDbError(error) }, { status: 400 });
  }

  if (parsed.objektIds) {
    const syncError = await syncPartnerObjekte(
      auth.supabase,
      data.id,
      parsed.objektIds,
    );
    if (syncError) {
      return NextResponse.json({ error: mapDbError(syncError) }, { status: 400 });
    }
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
