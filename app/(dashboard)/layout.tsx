import Sidebar from "@/components/Sidebar";
import MobileNavDrawer from "@/components/MobileNavDrawer";
import TopBar from "@/components/TopBar";
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
    <div className="min-h-full bg-warm-white">
      <Sidebar showMitarbeiterNav={showMitarbeiterNav} />
      <MobileNavDrawer showMitarbeiterNav={showMitarbeiterNav} />
      <TopBar userEmail={user?.email} />
      <main className="min-h-full px-4 pb-10 pt-[calc(var(--topbar-height)+2rem)] md:ml-[var(--sidebar-width)] md:px-8">
        {children}
      </main>
    </div>
  );
}
