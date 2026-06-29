"use client";

import { useState } from "react";
import SidebarNav from "@/components/dashboard/SidebarNav";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MobileNavDrawer from "@/components/MobileNavDrawer";
import { cn } from "@/lib/cn";

type DashboardShellProps = {
  children: React.ReactNode;
  showMitarbeiterNav?: boolean;
  userEmail?: string | null;
};

export default function DashboardShell({
  children,
  showMitarbeiterNav = false,
  userEmail,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-warm-white">
      <div
        className={cn(
          "hidden h-screen shrink-0 overflow-hidden bg-white transition-[width] duration-300 ease-in-out md:block",
          sidebarOpen ? "w-[var(--sidebar-width)] opacity-100" : "w-0 opacity-0",
        )}
      >
        <SidebarNav showMitarbeiterNav={showMitarbeiterNav} />
      </div>

      <MobileNavDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        showMitarbeiterNav={showMitarbeiterNav}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onOpenMobileMenu={() => setMobileOpen(true)}
          userEmail={userEmail}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
