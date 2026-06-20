"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function MieterSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) {
      params.set("q", query.trim());
    }
    router.push(`/mieter?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Nach Name suchen…"
        className="w-full max-w-sm border border-border bg-white px-3 py-2 text-sm rounded-[4px]"
      />
      <button
        type="submit"
        className="bg-navy px-4 py-2 text-sm text-white rounded-[4px] hover:bg-navy-mid"
      >
        Suchen
      </button>
    </form>
  );
}
