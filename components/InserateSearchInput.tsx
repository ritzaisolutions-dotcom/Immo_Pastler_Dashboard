"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Search } from "lucide-react";

export default function InserateSearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  const handleChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("q", value);
      } else {
        params.delete("q");
      }
      router.push(`/inserate?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="relative max-w-xs">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-hint" />
      <input
        type="search"
        placeholder="Adresse suchen…"
        defaultValue={q}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded-[4px] border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
      />
    </div>
  );
}
