import { NextResponse } from "next/server";
import { requireMitarbeiter } from "@/lib/api-auth";
import { mapDbError } from "@/lib/api-errors";
import { parseMieterBody } from "@/lib/parse-mieter";
import { TABLES } from "@/lib/supabase/tables";

export async function POST(request: Request) {
  const auth = await requireMitarbeiter();
  if ("error" in auth && auth.error) return auth.error;

  const body = await request.json();
  const parsed = parseMieterBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from(TABLES.mieter)
    .insert(parsed.data)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: mapDbError(error) }, { status: 400 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
