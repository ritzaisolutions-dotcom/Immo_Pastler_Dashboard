"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/ui/Button";

interface TopBarProps {
  userEmail?: string | null;
}

export default function TopBar({ userEmail }: TopBarProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="fixed top-0 right-0 z-10 flex h-[var(--topbar-height)] w-full items-center justify-between border-b border-border bg-white pl-14 pr-8 shadow-[0_1px_0_rgba(13,24,40,0.04)] md:w-[calc(100%-var(--sidebar-width))] md:pl-8">
      <Breadcrumbs />
      <div className="flex shrink-0 items-center gap-4">
        {userEmail && (
          <span className="hidden max-w-[200px] truncate text-[13px] text-text-secondary sm:inline">
            {userEmail}
          </span>
        )}
        <Button
          variant="secondary"
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 text-[13px]"
        >
          <LogOut className="h-3.5 w-3.5" />
          Abmelden
        </Button>
      </div>
    </header>
  );
}
