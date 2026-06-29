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

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type NavGroup = {
  heading?: string;
  items: NavItem[];
};

const mitarbeiterPrimary: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/emails", label: "E-Mails", icon: Mail },
  { href: "/objekte", label: "Objekte", icon: Building2 },
  { href: "/partner", label: "Partner", icon: Handshake },
  { href: "/mieter", label: "Mieter", icon: Users },
  { href: "/chat", label: "KI-Assistent", icon: MessageSquare },
  { href: "/todos", label: "Todos", icon: CheckSquare },
];

const mitarbeiterSecondary: NavItem[] = [
  { href: "/vermieter", label: "Vermieter", icon: UserCircle },
  { href: "/datenschutz", label: "Datenschutz", icon: Shield },
];

const eigentuemerPrimary: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/objekte", label: "Objekte", icon: Building2 },
  { href: "/mieter", label: "Mieter", icon: Users },
  { href: "/todos", label: "Todos", icon: CheckSquare },
];

const eigentuemerSecondary: NavItem[] = [
  { href: "/datenschutz", label: "Datenschutz", icon: Shield },
];

export function getNavGroups(showMitarbeiterNav: boolean): NavGroup[] {
  if (showMitarbeiterNav) {
    return [
      { items: mitarbeiterPrimary },
      { heading: "Weitere", items: mitarbeiterSecondary },
    ];
  }

  return [
    { items: eigentuemerPrimary },
    { heading: "Weitere", items: eigentuemerSecondary },
  ];
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href !== "/dashboard" && pathname.startsWith(href)) return true;
  return false;
}
