import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { isMitarbeiter } from "@/lib/auth-roles";

export async function requireMitarbeiterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isMitarbeiter(user)) {
    redirect("/dashboard");
  }

  return { supabase, user };
}
