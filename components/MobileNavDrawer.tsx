"use client";

import { X } from "lucide-react";
import SidebarNav from "@/components/dashboard/SidebarNav";
import { cn } from "@/lib/cn";

type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
  showMitarbeiterNav?: boolean;
};

export default function MobileNavDrawer({
  open,
  onClose,
  showMitarbeiterNav = false,
}: MobileNavDrawerProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width)] transition-transform duration-200 md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!open}
      >
        <div className="relative h-full">
          <SidebarNav
            showMitarbeiterNav={showMitarbeiterNav}
            onNavigate={onClose}
            className="shadow-sidebar"
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-[4px] p-1.5 text-text-hint transition-colors hover:bg-warm-white hover:text-text-primary"
            aria-label="Navigation schließen"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </div>
      </aside>
    </>
  );
}
