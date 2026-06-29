"use client";

import Link from "next/link";
import PastlerLogo from "@/components/PastlerLogo";
import { usePathname } from "next/navigation";
import {
  Building2,
  CheckSquare,
  Handshake,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Shield,
  UserCircle,
  Users,
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

interface SidebarProps {
  showMitarbeiterNav?: boolean;
}

export default function Sidebar({ showMitarbeiterNav = false }: SidebarProps) {
  const pathname = usePathname();

  const primaryItems = showMitarbeiterNav
    ? mitarbeiterNavItems
    : eigentuemerNavItems;
  const secondaryItems = showMitarbeiterNav ? mitarbeiterSecondaryNav : [];

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[var(--sidebar-width)] flex-col bg-navy shadow-sidebar md:flex">
      <div className="border-b border-white/10 px-6 py-6">
        <Link href="/dashboard" className="block">
          <PastlerLogo variant="dark" className="items-start" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {primaryItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
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
          })}
        </ul>

        {secondaryItems.length > 0 && (
          <>
            <div className="my-4 border-t border-white/10" />
            <ul className="space-y-1">
              {secondaryItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
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
              })}
            </ul>
          </>
        )}
      </nav>
    </aside>
  );
}
