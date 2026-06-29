import { NextResponse } from "next/server";
import { requireMitarbeiter } from "@/lib/api-auth";
import { API_ERRORS, mapDbError } from "@/lib/api-errors";
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
  beschreibung?: unknown;
  notizen?: unknown;
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMitarbeiter();
  if ("error" in auth && auth.error) return auth.error;

  const { id } = await params;
  const body: PartnerBody = await request.json();

  const update: Record<string, string | boolean | null> = {};
  const objektIds = parseObjektIds(body.objekt_ids);

  if ("firma" in body) {
    if (typeof body.firma !== "string" || !body.firma.trim()) {
      return NextResponse.json(
        { error: "Firma darf nicht leer sein" },
        { status: 400 },
      );
    }
    update.firma = body.firma.trim();
  }
  if (body.ansprechpartner !== undefined) {
    update.ansprechpartner =
      typeof body.ansprechpartner === "string"
        ? body.ansprechpartner.trim() || null
        : null;
  }
  if (body.adresse !== undefined) {
    update.adresse =
      typeof body.adresse === "string" ? body.adresse.trim() || null : null;
  }
  if (body.plz !== undefined) {
    update.plz = typeof body.plz === "string" ? body.plz.trim() || null : null;
  }
  if (body.stadt !== undefined) {
    update.stadt =
      typeof body.stadt === "string" ? body.stadt.trim() || null : null;
  }
  if ("email" in body) {
    if (typeof body.email !== "string" || !body.email.trim()) {
      return NextResponse.json(
        { error: "E-Mail darf nicht leer sein" },
        { status: 400 },
      );
    }
    update.email = body.email.trim();
  }
  if (body.telefon !== undefined) {
    update.telefon =
      typeof body.telefon === "string" ? body.telefon.trim() || null : null;
  }
  if (typeof body.gewerk === "string") {
    if (!isValidGewerkKey(body.gewerk)) {
      return NextResponse.json({ error: "Ungültiges Gewerk" }, { status: 400 });
    }
    if (!(await gewerkExists(auth.supabase, body.gewerk))) {
      return NextResponse.json({ error: "Gewerk existiert nicht" }, { status: 400 });
    }
    update.gewerk = body.gewerk as PartnerGewerk;
  }
  if (body.beschreibung !== undefined) {
    update.beschreibung =
      typeof body.beschreibung === "string"
        ? body.beschreibung.trim() || null
        : null;
  }
  if (body.notizen !== undefined) {
    update.notizen =
      typeof body.notizen === "string" ? body.notizen.trim() || null : null;
  }
  if (typeof body.aktiv === "boolean") {
    update.aktiv = body.aktiv;
  }
  if (body.anrede_form !== undefined) {
    if (!isAnredeForm(body.anrede_form)) {
      return NextResponse.json({ error: "Ungültige Anrede" }, { status: 400 });
    }
    update.anrede_form = body.anrede_form;
  }
  if (body.einsatzgebiet !== undefined) {
    update.einsatzgebiet =
      typeof body.einsatzgebiet === "string"
        ? body.einsatzgebiet.trim() || null
        : null;
  }

  if (Object.keys(update).length === 0 && objektIds === undefined) {
    return NextResponse.json(
      { error: API_ERRORS.noFieldsToUpdate },
      { status: 400 },
    );
  }

  if (Object.keys(update).length > 0) {
    const { data: updated, error } = await auth.supabase
      .from(TABLES.partner)
      .update(update)
      .eq("id", id)
      .select("id");

    if (error) {
      return NextResponse.json({ error: mapDbError(error) }, { status: 400 });
    }

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: API_ERRORS.notFound }, { status: 404 });
    }
  }

  if (objektIds !== undefined) {
    const syncError = await syncPartnerObjekte(auth.supabase, id, objektIds);
    if (syncError) {
      return NextResponse.json({ error: mapDbError(syncError) }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}
