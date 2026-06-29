"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CheckSquare,
  Handshake,
  LayoutDashboard,
  Mail,
  Menu,
  MessageSquare,
  Shield,
  UserCircle,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

const eigentuemerNavItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/objekte", label: "Objekte", icon: Building2 },
  { href: "/mieter", label: "Mieter", icon: Users },
  { href: "/todos", label: "Todos", icon: CheckSquare },
  { href: "/datenschutz", label: "Datenschutz", icon: Shield },
];

const mitarbeiterNavItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/emails", label: "E-Mails", icon: Mail },
  { href: "/objekte", label: "Objekte", icon: Building2 },
  { href: "/partner", label: "Partner", icon: Handshake },
  { href: "/mieter", label: "Mieter", icon: Users },
  { href: "/chat", label: "KI-Assistent", icon: MessageSquare },
  { href: "/todos", label: "Todos", icon: CheckSquare },
];

const mitarbeiterSecondaryNav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/vermieter", label: "Vermieter", icon: UserCircle },
  { href: "/datenschutz", label: "Datenschutz", icon: Shield },
];

export default function MobileNavDrawer({
  showMitarbeiterNav = false,
}: {
  showMitarbeiterNav?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const primaryItems = showMitarbeiterNav
    ? mitarbeiterNavItems
    : eigentuemerNavItems;
  const secondaryItems = showMitarbeiterNav ? mitarbeiterSecondaryNav : [];

  function renderNavItem(item: { href: string; label: string; icon: LucideIcon }) {
    const isActive =
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href));
    const Icon = item.icon;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 border-l-2 px-4 py-2.5 text-[13px] transition-colors",
            isActive
              ? "border-gold bg-navy-mid/50 text-gold"
              : "border-transparent text-white/65 hover:bg-navy-mid/30 hover:text-white",
          )}
        >
          <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          {item.label}
        </Link>
      </li>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed left-0 top-0 z-30 flex h-[var(--topbar-height)] w-14 items-center justify-center text-text-primary md:hidden"
        aria-label="Navigation öffnen"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-navy shadow-sidebar transition-transform duration-200 md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-6">
          <span className="font-display text-base text-gold">Pastler</span>
          <button
            onClick={() => setOpen(false)}
            className="text-white/60 hover:text-white"
            aria-label="Navigation schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">{primaryItems.map(renderNavItem)}</ul>
          {secondaryItems.length > 0 && (
            <>
              <div className="my-4 border-t border-white/10" />
              <ul className="space-y-1">{secondaryItems.map(renderNavItem)}</ul>
            </>
          )}
        </nav>
      </aside>
    </>
  );
}
