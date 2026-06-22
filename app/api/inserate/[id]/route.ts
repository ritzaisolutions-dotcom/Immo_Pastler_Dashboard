import { NextResponse } from "next/server";
import { requireMitarbeiter } from "@/lib/api-auth";
import { parseInseratBody } from "@/lib/parse-inserat";
import { TABLES } from "@/lib/supabase/tables";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireMitarbeiter();
  if ("error" in auth && auth.error) return auth.error;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = parseInseratBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from(TABLES.inserate)
    .update(parsed.data)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
