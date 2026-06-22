import type { User } from "@supabase/supabase-js";

export function isMitarbeiter(user: User | null): boolean {
  if (!user) return false;
  const role = user.app_metadata?.role;
  return role === "mitarbeiter";
}
