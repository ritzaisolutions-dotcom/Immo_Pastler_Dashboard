"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FormErrorBanner from "@/components/FormErrorBanner";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";

export type ZuordnungOption = {
  id: string;
  label: string;
  inseratId?: string | null;
  vermieterId?: string | null;
};

type ZuordnungFormProps = {
  emailId: string;
  initialMieterId: string | null;
  initialInseratId: string | null;
  initialVermieterId: string | null;
  mieterOptions: ZuordnungOption[];
  inseratOptions: ZuordnungOption[];
  vermieterOptions: ZuordnungOption[];
};

export default function ZuordnungForm({
  emailId,
  initialMieterId,
  initialInseratId,
  initialVermieterId,
  mieterOptions,
  inseratOptions,
  vermieterOptions,
}: ZuordnungFormProps) {
  const router = useRouter();
  const [mieterId, setMieterId] = useState(initialMieterId ?? "");
  const [inseratId, setInseratId] = useState(initialInseratId ?? "");
  const [vermieterId, setVermieterId] = useState(initialVermieterId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleMieterChange(value: string) {
    setMieterId(value);
    if (!value) return;
    const mieter = mieterOptions.find((m) => m.id === value);
    if (mieter?.inseratId) {
      setInseratId(mieter.inseratId);
    }
    if (mieter?.vermieterId) {
      setVermieterId(mieter.vermieterId);
    }
  }

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch(`/api/emails/${emailId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mieter_id: mieterId || null,
        inserat_id: inseratId || null,
        vermieter_id: vermieterId || null,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      setError("Zuordnung konnte nicht gespeichert werden");
      return;
    }

    toast.success("Zuordnung gespeichert");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-text-secondary">
        Mieter, Inserat und Vermieter manuell zuordnen oder korrigieren. Bei
        Mieter-Auswahl werden Objekt und Vermieter automatisch vorgeschlagen.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="Mieter"
          value={mieterId}
          onChange={(e) => handleMieterChange(e.target.value)}
        >
          <option value="">— Kein Mieter —</option>
          {mieterOptions.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </Select>

        <Select
          label="Inserat (Objekt)"
          value={inseratId}
          onChange={(e) => setInseratId(e.target.value)}
        >
          <option value="">— Kein Inserat —</option>
          {inseratOptions.map((i) => (
            <option key={i.id} value={i.id}>
              {i.label}
            </option>
          ))}
        </Select>

        <Select
          label="Vermieter"
          value={vermieterId}
          onChange={(e) => setVermieterId(e.target.value)}
        >
          <option value="">— Kein Vermieter —</option>
          {vermieterOptions.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <FormErrorBanner message={error} onRetry={() => void handleSubmit()} />
      )}

      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? "Speichern…" : "Zuordnung speichern"}
      </Button>
    </form>
  );
}
