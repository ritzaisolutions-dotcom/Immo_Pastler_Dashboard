import DashboardShell from "@/components/dashboard/DashboardShell";
import { createClient } from "@/utils/supabase/server";
import { isMitarbeiter } from "@/lib/auth-roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const showMitarbeiterNav = isMitarbeiter(user);

  return (
    <DashboardShell showMitarbeiterNav={showMitarbeiterNav} userEmail={user?.email}>
      {children}
    </DashboardShell>
  );
}
