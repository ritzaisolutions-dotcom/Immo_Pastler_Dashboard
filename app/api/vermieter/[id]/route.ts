import { NextResponse } from "next/server";
import { requireMitarbeiter } from "@/lib/api-auth";
import { API_ERRORS, mapDbError } from "@/lib/api-errors";
import { parseVermieterBody } from "@/lib/parse-vermieter";
import { TABLES } from "@/lib/supabase/tables";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireMitarbeiter();
  if ("error" in auth && auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = parseVermieterBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data: updated, error } = await auth.supabase
    .from(TABLES.vermieter)
    .update(parsed.data)
    .eq("id", id)
    .select("id");

  if (error) {
    return NextResponse.json({ error: mapDbError(error) }, { status: 400 });
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: API_ERRORS.notFound }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
