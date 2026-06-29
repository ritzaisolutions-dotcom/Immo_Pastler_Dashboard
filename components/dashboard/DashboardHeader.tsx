"use client";

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { cn } from "@/lib/cn";

type DashboardHeaderProps = {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenMobileMenu: () => void;
  userEmail?: string | null;
  className?: string;
};

export default function DashboardHeader({
  sidebarOpen,
  onToggleSidebar,
  onOpenMobileMenu,
  userEmail,
  className,
}: DashboardHeaderProps) {
  return (
    <header
      className={cn(
        "flex h-[var(--shell-header-height)] shrink-0 items-center justify-between border-b border-border bg-white px-4 md:px-6",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-[4px] p-1.5 text-text-secondary transition-colors hover:bg-warm-white hover:text-text-primary md:hidden"
          aria-label="Navigation öffnen"
        >
          <Menu className="h-[18px] w-[18px]" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden rounded-[4px] p-1.5 text-text-secondary transition-colors hover:bg-warm-white hover:text-text-primary md:inline-flex"
          aria-label={sidebarOpen ? "Sidebar einklappen" : "Sidebar ausklappen"}
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={1.5} />
          ) : (
            <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={1.5} />
          )}
        </button>
        <Breadcrumbs />
      </div>

      {userEmail && (
        <span className="hidden max-w-[220px] truncate text-[13px] text-text-secondary sm:inline">
          {userEmail}
        </span>
      )}
    </header>
  );
}
