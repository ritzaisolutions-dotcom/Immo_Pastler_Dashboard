import { NextResponse } from "next/server";
import { requireMitarbeiter } from "@/lib/api-auth";
import { mapDbError } from "@/lib/api-errors";
import { parseMieterBody } from "@/lib/parse-mieter";
import { validateMieterWohneinheit } from "@/lib/validate-mieter-wohneinheit";
import { TABLES } from "@/lib/supabase/tables";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireMitarbeiter();
  if ("error" in auth && auth.error) return auth.error;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = parseMieterBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const validated = await validateMieterWohneinheit(auth.supabase, parsed.data);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from(TABLES.mieter)
    .update(validated.data)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: mapDbError(error) }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
