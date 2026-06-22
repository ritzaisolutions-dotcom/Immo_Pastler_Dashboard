import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { isMitarbeiter } from "@/lib/auth-roles";
import { TABLES } from "@/lib/supabase/tables";
import { isTodoStatus } from "@/lib/types";

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
  if (
    typeof body !== "object" ||
    body === null ||
    !("status" in body) ||
    typeof (body as { status: unknown }).status !== "string"
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { status } = body as { status: string };

  if (!isTodoStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: existing, error: selectError } = await supabase
    .from(TABLES.todos)
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (selectError || !existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updatePayload: { status: string; erledigt_at: string | null } = {
    status,
    erledigt_at: status === "erledigt" ? new Date().toISOString() : null,
  };

  const { error: updateError } = await supabase
    .from(TABLES.todos)
    .update(updatePayload)
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
