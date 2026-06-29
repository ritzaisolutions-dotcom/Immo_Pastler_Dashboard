"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import PastlerLogo from "@/components/PastlerLogo";
import { getNavGroups, isNavItemActive, type NavItem } from "@/lib/nav-config";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/cn";

type SidebarNavProps = {
  showMitarbeiterNav?: boolean;
  className?: string;
  onNavigate?: () => void;
};

function NavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "group flex items-center gap-2.5 rounded-[4px] px-2.5 py-[7px] text-[13px] transition-colors select-none",
        isActive
          ? "bg-gold-pale font-medium text-burgundy"
          : "text-text-secondary hover:bg-warm-white hover:text-text-primary",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          isActive ? "text-burgundy" : "text-text-hint group-hover:text-text-secondary",
        )}
        strokeWidth={1.5}
      />
      <span className="truncate tracking-wide">{item.label}</span>
    </Link>
  );
}

export default function SidebarNav({
  showMitarbeiterNav = false,
  className = "",
  onNavigate,
}: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const groups = getNavGroups(showMitarbeiterNav);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "flex h-full w-[var(--sidebar-width)] flex-col border-r border-border bg-white p-3 font-sans",
        className,
      )}
    >
      <div className="mb-4 px-2 pt-1">
        <Link href="/dashboard" onClick={onNavigate} className="block">
          <PastlerLogo variant="light" className="items-start" />
          <p className="mt-2 text-[11px] text-text-hint">Immobilienverwaltung</p>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-4 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {groups.map((group, index) => (
          <div key={group.heading ?? `group-${index}`} className="flex flex-col gap-0.5">
            {group.heading && (
              <span className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-hint/80">
                {group.heading}
              </span>
            )}
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                isActive={isNavItemActive(pathname, item.href)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-border pt-3">
        <button
          type="button"
          onClick={() => {
            void handleLogout();
            onNavigate?.();
          }}
          className="group flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-[7px] text-[13px] text-text-secondary transition-colors hover:bg-warm-white hover:text-text-primary"
        >
          <LogOut
            className="h-4 w-4 shrink-0 text-text-hint group-hover:text-text-secondary"
            strokeWidth={1.5}
          />
          Abmelden
        </button>
      </div>
    </aside>
  );
}
