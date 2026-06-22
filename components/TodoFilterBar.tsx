"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { X } from "lucide-react";
import {
  TODO_KATEGORIEN,
  TODO_PRIORITAETEN,
  TODO_STATUSES,
  kategorieLabel,
  prioritaetLabel,
  statusLabel,
} from "@/lib/types";

const FILTER_KEYS = ["kategorie", "status", "prioritaet"] as const;
const SORT_OPTIONS = [
  { value: "", label: "Neueste zuerst" },
  { value: "faellig_at", label: "Fälligkeit" },
  { value: "titel", label: "Alphabetisch" },
];

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

  const hasActiveFilters = FILTER_KEYS.some((k) => searchParams.get(k));

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());
    FILTER_KEYS.forEach((k) => params.delete(k));
    router.push(`/todos?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
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
      <FilterSelect
        label="Sortierung"
        value={searchParams.get("sort") ?? ""}
        onChange={(v) => updateParam("sort", v)}
        options={SORT_OPTIONS}
      />
      {hasActiveFilters && (
        <Button
          variant="secondary"
          onClick={clearFilters}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs"
        >
          <X className="h-3.5 w-3.5" />
          Filter löschen
        </Button>
      )}
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
    <Select
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="min-w-[140px]"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  );
}
