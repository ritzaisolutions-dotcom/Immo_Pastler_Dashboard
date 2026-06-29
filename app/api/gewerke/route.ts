import { NextResponse } from "next/server";
import { requireMitarbeiter } from "@/lib/api-auth";
import { mapDbError } from "@/lib/api-errors";
import { isValidGewerkKey, slugifyGewerkLabel } from "@/lib/gewerk";
import { TABLES } from "@/lib/supabase/tables";
import { type Gewerk } from "@/lib/types";

type GewerkBody = {
  label?: unknown;
  key?: unknown;
  objekt_relevant?: unknown;
};

export async function GET() {
  const auth = await requireMitarbeiter();
  if ("error" in auth && auth.error) return auth.error;

  const { data, error } = await auth.supabase
    .from(TABLES.gewerke)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  if (error) {
    return NextResponse.json({ error: mapDbError(error) }, { status: 400 });
  }

  return NextResponse.json({ gewerke: (data ?? []) as Gewerk[] });
}

export async function POST(request: Request) {
  const auth = await requireMitarbeiter();
  if ("error" in auth && auth.error) return auth.error;

  const body = (await request.json()) as GewerkBody;

  if (typeof body.label !== "string" || !body.label.trim()) {
    return NextResponse.json({ error: "Bezeichnung ist erforderlich" }, { status: 400 });
  }

  const label = body.label.trim();
  let key =
    typeof body.key === "string" && body.key.trim()
      ? body.key.trim().toLowerCase()
      : slugifyGewerkLabel(label);

  if (!isValidGewerkKey(key)) {
    return NextResponse.json({ error: "Ungültiger Gewerk-Schlüssel" }, { status: 400 });
  }

  const objekt_relevant = body.objekt_relevant === true;

  const { data: existing } = await auth.supabase
    .from(TABLES.gewerke)
    .select("key")
    .eq("key", key)
    .maybeSingle();

  if (existing) {
    const baseKey = key;
    let suffix = 2;
    while (suffix < 100) {
      const candidate = `${baseKey}_${suffix}`;
      const { data: clash } = await auth.supabase
        .from(TABLES.gewerke)
        .select("key")
        .eq("key", candidate)
        .maybeSingle();
      if (!clash) {
        key = candidate;
        break;
      }
      suffix += 1;
    }
  }

  const { data: maxRow } = await auth.supabase
    .from(TABLES.gewerke)
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sort_order = (maxRow?.sort_order ?? 0) + 10;

  const { data, error } = await auth.supabase
    .from(TABLES.gewerke)
    .insert({ key, label, objekt_relevant, sort_order })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: mapDbError(error) }, { status: 400 });
  }

  return NextResponse.json(data as Gewerk, { status: 201 });
}
