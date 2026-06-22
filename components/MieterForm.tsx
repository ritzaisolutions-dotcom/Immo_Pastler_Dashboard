"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import {
  MIETER_STATUSES,
  mieterStatusLabel,
  type Inserat,
  type Mieter,
  type MieterStatus,
} from "@/lib/types";

interface MieterFormProps {
  mieter?: Mieter;
  inserate: Pick<Inserat, "id" | "adresse" | "stadt">[];
  defaultInseratId?: string;
}

export default function MieterForm({
  mieter,
  inserate,
  defaultInseratId,
}: MieterFormProps) {
  const router = useRouter();
  const isEdit = Boolean(mieter);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(mieter?.name ?? "");
  const [email, setEmail] = useState(mieter?.email ?? "");
  const [telefon, setTelefon] = useState(mieter?.telefon ?? "");
  const [einheitNr, setEinheitNr] = useState(mieter?.einheit_nr ?? "");
  const [inseratId, setInseratId] = useState(
    mieter?.inserat_id ?? defaultInseratId ?? "",
  );
  const [einzugDatum, setEinzugDatum] = useState(mieter?.einzug_datum ?? "");
  const [auszugDatum, setAuszugDatum] = useState(mieter?.auszug_datum ?? "");
  const [status, setStatus] = useState<MieterStatus>(mieter?.status ?? "aktiv");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      name,
      email,
      telefon,
      einheit_nr: einheitNr,
      inserat_id: inseratId || null,
      einzug_datum: einzugDatum || null,
      auszug_datum: auszugDatum || null,
      status,
    };

    const url = isEdit ? `/api/mieter/${mieter!.id}` : "/api/mieter";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      try {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Speichern fehlgeschlagen");
      } catch {
        setError("Speichern fehlgeschlagen");
      }
      setLoading(false);
      return;
    }

    if (isEdit) {
      router.push(`/mieter/${mieter!.id}`);
    } else {
      const data = (await res.json()) as { id: string };
      router.push(`/mieter/${data.id}`);
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <Input
        label="Name *"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="E-Mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Telefon"
          value={telefon}
          onChange={(e) => setTelefon(e.target.value)}
        />
      </div>

      <Select
        label="Inserat"
        value={inseratId}
        onChange={(e) => setInseratId(e.target.value)}
      >
        <option value="">— Kein Inserat —</option>
        {inserate.map((i) => (
          <option key={i.id} value={i.id}>
            {i.adresse}
            {i.stadt ? `, ${i.stadt}` : ""}
          </option>
        ))}
      </Select>

      <Input
        label="Einheit Nr."
        value={einheitNr}
        onChange={(e) => setEinheitNr(e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Einzug"
          type="date"
          value={einzugDatum}
          onChange={(e) => setEinzugDatum(e.target.value)}
        />
        <Input
          label="Auszug"
          type="date"
          value={auszugDatum}
          onChange={(e) => setAuszugDatum(e.target.value)}
        />
      </div>

      <Select
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as MieterStatus)}
      >
        {MIETER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {mieterStatusLabel(s)}
          </option>
        ))}
      </Select>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Speichern…" : isEdit ? "Aktualisieren" : "Anlegen"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            router.push(isEdit ? `/mieter/${mieter!.id}` : "/mieter")
          }
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
