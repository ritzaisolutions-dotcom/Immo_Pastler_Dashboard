import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isMitarbeiter } from "@/lib/auth-roles";
import { TABLES } from "@/lib/supabase/tables";

function parseOptionalId(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value === "string") return value;
  return undefined;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isMitarbeiter(user)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await request.json();
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const mieterId = parseOptionalId((body as { mieter_id?: unknown }).mieter_id);
  const inseratId = parseOptionalId((body as { inserat_id?: unknown }).inserat_id);
  const vermieterId = parseOptionalId((body as { vermieter_id?: unknown }).vermieter_id);

  if (mieterId === undefined || inseratId === undefined || vermieterId === undefined) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: existing, error: selectError } = await supabase
    .from(TABLES.emails)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (selectError || !existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const hasAssignment = Boolean(mieterId || inseratId || vermieterId);

  const { error: emailError } = await supabase
    .from(TABLES.emails)
    .update({
      mieter_id: mieterId,
      inserat_id: inseratId,
      vermieter_id: vermieterId,
      zuordnung_quelle: hasAssignment ? "manuell" : "unbekannt",
      zuordnung_konfidenz: hasAssignment ? "hoch" : "niedrig",
    })
    .eq("id", id);

  if (emailError) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  const { data: linkedTodo } = await supabase
    .from(TABLES.todos)
    .select("id")
    .eq("email_id", id)
    .maybeSingle();

  if (linkedTodo) {
    const { error: todoError } = await supabase
      .from(TABLES.todos)
      .update({
        mieter_id: mieterId,
        inserat_id: inseratId,
        vermieter_id: vermieterId,
        zuordnung_quelle: hasAssignment ? "manuell" : "unbekannt",
        zuordnung_konfidenz: hasAssignment ? "hoch" : "niedrig",
      })
      .eq("id", linkedTodo.id);

    if (todoError) {
      return NextResponse.json({ error: "Todo sync failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}
