import { NextResponse } from "next/server";
import { requireMitarbeiter } from "@/lib/api-auth";
import { mapDbError } from "@/lib/api-errors";
import { isValidGewerkKey } from "@/lib/gewerk";
import { gewerkExists, isObjektRelevantGewerk } from "@/lib/gewerke-server";
import { TABLES } from "@/lib/supabase/tables";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireMitarbeiter();
  if ("error" in auth && auth.error) return auth.error;

  const { id: inseratId } = await context.params;
  const body = (await request.json()) as {
    gewerk?: unknown;
    partner_id?: unknown;
  };

  if (typeof body.gewerk !== "string" || !isValidGewerkKey(body.gewerk)) {
    return NextResponse.json({ error: "Ungültiges Gewerk" }, { status: 400 });
  }

  const gewerk = body.gewerk;

  if (!(await gewerkExists(auth.supabase, gewerk))) {
    return NextResponse.json({ error: "Gewerk existiert nicht" }, { status: 400 });
  }

  if (!(await isObjektRelevantGewerk(auth.supabase, gewerk))) {
    return NextResponse.json(
      { error: "Dieses Gewerk ist nicht für Objekt-Zuordnungen vorgesehen" },
      { status: 400 },
    );
  }

  const partnerId =
    typeof body.partner_id === "string" && body.partner_id ? body.partner_id : null;

  if (partnerId) {
    const { error } = await auth.supabase.from(TABLES.objektPartnerGewerk).upsert(
      { inserat_id: inseratId, gewerk, partner_id: partnerId },
      { onConflict: "inserat_id,gewerk" },
    );
    if (error) {
      return NextResponse.json({ error: mapDbError(error) }, { status: 400 });
    }
  } else {
    const { error } = await auth.supabase
      .from(TABLES.objektPartnerGewerk)
      .delete()
      .eq("inserat_id", inseratId)
      .eq("gewerk", gewerk);
    if (error) {
      return NextResponse.json({ error: mapDbError(error) }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}
