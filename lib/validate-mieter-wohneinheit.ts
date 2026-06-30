import type { SupabaseClient } from "@supabase/supabase-js";
import { TABLES } from "@/lib/supabase/tables";

type MieterInsert = {
  name: string;
  email: string | null;
  telefon: string | null;
  adresse: string | null;
  plz: string | null;
  stadt: string | null;
  einheit_nr: string | null;
  wohneinheit_id: string | null;
  inserat_id: string;
  einzug_datum: string | null;
  auszug_datum: string | null;
  status: string;
  notizen: string | null;
};

export async function validateMieterWohneinheit(
  supabase: SupabaseClient,
  data: MieterInsert,
): Promise<{ data: MieterInsert } | { error: string }> {
  const { data: units, error } = await supabase
    .from(TABLES.wohneinheiten)
    .select("id, nummer")
    .eq("inserat_id", data.inserat_id)
    .order("sort_order", { ascending: true });

  if (error) {
    return { error: "Wohneinheiten konnten nicht geladen werden" };
  }

  const list = units ?? [];
  const next = { ...data };

  if (list.length > 1 && !next.wohneinheit_id) {
    return { error: "Bitte Wohneinheit auswählen" };
  }

  if (next.wohneinheit_id) {
    const unit = list.find((u) => u.id === next.wohneinheit_id);
    if (!unit) {
      return { error: "Wohneinheit gehört nicht zum gewählten Inserat" };
    }
    next.einheit_nr = unit.nummer;
  } else if (list.length === 1) {
    next.einheit_nr = list[0]!.nummer;
    next.wohneinheit_id = list[0]!.id;
  }

  return { data: next };
}
