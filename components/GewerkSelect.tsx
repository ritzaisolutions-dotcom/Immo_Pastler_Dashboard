"use client";

import { useState } from "react";
import { toast } from "sonner";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { type Gewerk } from "@/lib/types";

const NEW_GEWERK_VALUE = "__new__";

type GewerkSelectProps = {
  label?: string;
  required?: boolean;
  value: string;
  onChange: (key: string) => void;
  gewerke: Gewerk[];
  onGewerkeChange: (gewerke: Gewerk[]) => void;
  objektRelevantOnly?: boolean;
  defaultObjektRelevant?: boolean;
};

export default function GewerkSelect({
  label = "Gewerk",
  required = false,
  value,
  onChange,
  gewerke,
  onGewerkeChange,
  objektRelevantOnly = false,
  defaultObjektRelevant = false,
}: GewerkSelectProps) {
  const [mode, setMode] = useState<"select" | "new">(
    value && !gewerke.some((g) => g.key === value) ? "new" : "select",
  );
  const [newLabel, setNewLabel] = useState("");
  const [adding, setAdding] = useState(false);

  const options = objektRelevantOnly
    ? gewerke.filter((g) => g.objekt_relevant)
    : gewerke;

  async function addGewerk() {
    const trimmed = newLabel.trim();
    if (!trimmed) {
      toast.error("Bitte einen Gewerk-Namen eingeben");
      return;
    }

    setAdding(true);
    try {
      const res = await fetch("/api/gewerke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: trimmed,
          objekt_relevant: defaultObjektRelevant,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Gewerk konnte nicht angelegt werden");
      }

      const created = (await res.json()) as Gewerk;
      const next = [...gewerke, created].sort(
        (a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label),
      );
      onGewerkeChange(next);
      onChange(created.key);
      setNewLabel("");
      setMode("select");
      toast.success(`Gewerk „${created.label}“ angelegt`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gewerk konnte nicht angelegt werden",
      );
    } finally {
      setAdding(false);
    }
  }

  if (mode === "new") {
    return (
      <div className="space-y-2">
        <Input
          label={`${label} (neu) *`}
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="z. B. Dachdecker"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void addGewerk();
            }
          }}
        />
        <div className="flex gap-2">
          <Button type="button" disabled={adding} onClick={() => void addGewerk()}>
            {adding ? "Anlegen…" : "Gewerk anlegen"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setMode("select");
              setNewLabel("");
            }}
          >
            Abbrechen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Select
        label={required ? `${label} *` : label}
        required={required}
        value={value}
        onChange={(e) => {
          if (e.target.value === NEW_GEWERK_VALUE) {
            setMode("new");
            return;
          }
          onChange(e.target.value);
        }}
      >
        <option value="">— Bitte wählen —</option>
        {options.map((g) => (
          <option key={g.key} value={g.key}>
            {g.label}
          </option>
        ))}
        <option value={NEW_GEWERK_VALUE}>+ Neues Gewerk…</option>
      </Select>
    </div>
  );
}
