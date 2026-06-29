"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import GewerkSelect from "@/components/GewerkSelect";
import Select from "@/components/ui/Select";
import {
  gewerkLabel,
  type Gewerk,
  type Partner,
} from "@/lib/types";

type Assignment = {
  gewerk: string;
  partner_id: string | null;
};

type ObjektPartnerGewerkPanelProps = {
  objektId: string;
  assignments: Assignment[];
  partners: Pick<Partner, "id" | "firma" | "gewerk" | "aktiv">[];
  gewerke: Gewerk[];
};

export default function ObjektPartnerGewerkPanel({
  objektId,
  assignments,
  partners,
  gewerke: initialGewerke,
}: ObjektPartnerGewerkPanelProps) {
  const router = useRouter();
  const [gewerke, setGewerke] = useState(initialGewerke);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const a of assignments) {
      init[a.gewerk] = a.partner_id ?? "";
    }
    return init;
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [showAddGewerk, setShowAddGewerk] = useState(false);
  const [newGewerkKey, setNewGewerkKey] = useState("");

  const displayedGewerke = useMemo(() => {
    const keys = new Set([
      ...gewerke.filter((g) => g.objekt_relevant).map((g) => g.key),
      ...assignments.map((a) => a.gewerk),
    ]);
    return gewerke
      .filter((g) => keys.has(g.key))
      .sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
  }, [gewerke, assignments]);

  async function saveGewerk(gewerk: string) {
    setSaving(gewerk);
    try {
      const res = await fetch(`/api/objekte/${objektId}/partner-gewerk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gewerk,
          partner_id: values[gewerk] || null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Speichern fehlgeschlagen");
      }
      toast.success(`${gewerkLabel(gewerk, gewerke)} gespeichert`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {displayedGewerke.map((gewerk) => {
          const options = partners.filter(
            (p) =>
              p.aktiv &&
              (p.gewerk === gewerk.key || p.gewerk === "allgemein"),
          );
          return (
            <div key={gewerk.key}>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-text-hint">
                {gewerk.label}
              </label>
              <div className="flex gap-2">
                <Select
                  value={values[gewerk.key] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [gewerk.key]: e.target.value,
                    }))
                  }
                  className="flex-1"
                >
                  <option value="">— Kein Partner —</option>
                  {options.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firma}
                    </option>
                  ))}
                </Select>
                <button
                  type="button"
                  disabled={saving === gewerk.key}
                  onClick={() => void saveGewerk(gewerk.key)}
                  className="shrink-0 rounded-[4px] bg-navy px-3 py-2 text-xs text-white hover:bg-navy-mid disabled:opacity-50"
                >
                  {saving === gewerk.key ? "…" : "OK"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showAddGewerk ? (
        <div className="rounded-[4px] border border-border p-4">
          <GewerkSelect
            label="Neue Gewerk-Kategorie"
            value={newGewerkKey}
            onChange={setNewGewerkKey}
            gewerke={gewerke}
            onGewerkeChange={(next) => {
              setGewerke(next);
              setShowAddGewerk(false);
              router.refresh();
            }}
            defaultObjektRelevant
          />
          <button
            type="button"
            className="mt-2 text-sm text-text-secondary hover:text-navy"
            onClick={() => setShowAddGewerk(false)}
          >
            Schließen
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddGewerk(true)}
          className="text-sm text-navy hover:text-gold"
        >
          + Gewerk-Kategorie hinzufügen
        </button>
      )}
    </div>
  );
}
