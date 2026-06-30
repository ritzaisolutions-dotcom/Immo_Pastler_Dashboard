"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FormErrorBanner from "@/components/FormErrorBanner";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import {
  kategorieLabel,
  prioritaetLabel,
  statusLabel,
  TODO_KATEGORIEN,
  TODO_PRIORITAETEN,
  TODO_STATUSES,
  type TodoKategorie,
  type TodoPrioritaet,
  type TodoStatus,
} from "@/lib/types";

export type TodoFormOption = {
  id: string;
  label: string;
  inseratId?: string | null;
  vermieterId?: string | null;
};

type TodoFormProps = {
  mieterOptions: TodoFormOption[];
  inseratOptions: TodoFormOption[];
  vermieterOptions: TodoFormOption[];
};

export default function TodoForm({
  mieterOptions,
  inseratOptions,
  vermieterOptions,
}: TodoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [titel, setTitel] = useState("");
  const [beschreibung, setBeschreibung] = useState("");
  const [kategorie, setKategorie] = useState<TodoKategorie>("intern");
  const [prioritaet, setPrioritaet] = useState<TodoPrioritaet>("mittel");
  const [status, setStatus] = useState<TodoStatus>("offen");
  const [faelligAt, setFaelligAt] = useState("");
  const [mieterId, setMieterId] = useState("");
  const [inseratId, setInseratId] = useState("");
  const [vermieterId, setVermieterId] = useState("");

  function handleMieterChange(value: string) {
    setMieterId(value);
    if (!value) return;
    const mieter = mieterOptions.find((m) => m.id === value);
    if (mieter?.inseratId) setInseratId(mieter.inseratId);
    if (mieter?.vermieterId) setVermieterId(mieter.vermieterId);
  }

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titel,
        beschreibung,
        kategorie,
        prioritaet,
        status,
        faellig_at: faelligAt || null,
        mieter_id: mieterId || null,
        inserat_id: inseratId || null,
        vermieter_id: vermieterId || null,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      try {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Anlegen fehlgeschlagen");
      } catch {
        setError("Anlegen fehlgeschlagen");
      }
      return;
    }

    toast.success("Todo angelegt");
    router.push("/todos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <Input
        label="Titel *"
        required
        value={titel}
        onChange={(e) => setTitel(e.target.value)}
      />

      <Textarea
        label="Beschreibung"
        rows={4}
        value={beschreibung}
        onChange={(e) => setBeschreibung(e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="Kategorie"
          value={kategorie}
          onChange={(e) => setKategorie(e.target.value as TodoKategorie)}
        >
          {TODO_KATEGORIEN.map((k) => (
            <option key={k} value={k}>
              {kategorieLabel(k)}
            </option>
          ))}
        </Select>

        <Select
          label="Priorität"
          value={prioritaet}
          onChange={(e) => setPrioritaet(e.target.value as TodoPrioritaet)}
        >
          {TODO_PRIORITAETEN.map((p) => (
            <option key={p} value={p}>
              {prioritaetLabel(p)}
            </option>
          ))}
        </Select>

        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as TodoStatus)}
        >
          {TODO_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </Select>
      </div>

      <Input
        label="Fällig am"
        type="date"
        value={faelligAt}
        onChange={(e) => setFaelligAt(e.target.value)}
      />

      <p className="text-xs text-text-hint">Optionale Zuordnung</p>
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
          label="Inserat"
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

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || !titel.trim()}>
          {loading ? "Speichern…" : "Anlegen"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/todos")}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
