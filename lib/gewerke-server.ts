import type { SupabaseClient } from "@supabase/supabase-js";
import { isValidGewerkKey } from "@/lib/gewerk";
import { TABLES } from "@/lib/supabase/tables";
import { type Gewerk } from "@/lib/types";

export async function loadGewerke(supabase: SupabaseClient): Promise<Gewerk[]> {
  const { data } = await supabase
    .from(TABLES.gewerke)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("label", { ascending: true });

  return (data ?? []) as Gewerk[];
}

export async function gewerkExists(
  supabase: SupabaseClient,
  key: string,
): Promise<boolean> {
  if (!isValidGewerkKey(key)) return false;
  const { data } = await supabase
    .from(TABLES.gewerke)
    .select("key")
    .eq("key", key)
    .maybeSingle();
  return Boolean(data);
}

export async function isObjektRelevantGewerk(
  supabase: SupabaseClient,
  key: string,
): Promise<boolean> {
  const { data } = await supabase
    .from(TABLES.gewerke)
    .select("objekt_relevant")
    .eq("key", key)
    .maybeSingle();
  return Boolean(data?.objekt_relevant);
}
