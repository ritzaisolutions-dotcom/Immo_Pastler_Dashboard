"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/todos", label: "Todos" },
  { href: "/mieter", label: "Mieter" },
  { href: "/inserate", label: "Inserate" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-10 flex w-[240px] flex-col bg-navy">
      <div className="border-b border-white/10 px-6 py-6">
        <Image
          src="/JPlogo-png.avif"
          alt="Pastler Immobilienverwaltung"
          width={160}
          height={48}
          className="h-auto w-full max-w-[160px]"
          priority
        />
        <p className="mt-3 font-display text-sm tracking-[3px] text-white">
          PASTLER<span className="text-gold">.</span>
        </p>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block border-l-2 px-4 py-2.5 text-[13px] transition-colors ${
                    isActive
                      ? "border-gold text-gold"
                      : "border-transparent text-white/65 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full border border-white/20 px-4 py-2 text-[13px] text-white/70 transition-colors hover:border-white/40 hover:text-white rounded-[4px]"
        >
          Abmelden
        </button>
      </div>
    </aside>
  );
}
