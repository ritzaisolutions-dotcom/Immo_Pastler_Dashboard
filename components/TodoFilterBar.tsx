"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  TODO_KATEGORIEN,
  TODO_PRIORITAETEN,
  TODO_STATUSES,
  kategorieLabel,
  prioritaetLabel,
  statusLabel,
} from "@/lib/types";

export default function TodoFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/todos?${params.toString()}`);
    },
    [router, searchParams],
  );

  return (
    <div className="mb-6 flex flex-wrap gap-4">
      <FilterSelect
        label="Kategorie"
        value={searchParams.get("kategorie") ?? ""}
        onChange={(v) => updateParam("kategorie", v)}
        options={[
          { value: "", label: "Alle" },
          ...TODO_KATEGORIEN.map((k) => ({
            value: k,
            label: kategorieLabel(k),
          })),
        ]}
      />
      <FilterSelect
        label="Status"
        value={searchParams.get("status") ?? ""}
        onChange={(v) => updateParam("status", v)}
        options={[
          { value: "", label: "Alle" },
          ...TODO_STATUSES.map((s) => ({
            value: s,
            label: statusLabel(s),
          })),
        ]}
      />
      <FilterSelect
        label="Priorität"
        value={searchParams.get("prioritaet") ?? ""}
        onChange={(v) => updateParam("prioritaet", v)}
        options={[
          { value: "", label: "Alle" },
          ...TODO_PRIORITAETEN.map((p) => ({
            value: p,
            label: prioritaetLabel(p),
          })),
        ]}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] uppercase tracking-wider text-text-hint">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-border bg-white px-3 py-1.5 text-sm text-text-primary rounded-[4px]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
