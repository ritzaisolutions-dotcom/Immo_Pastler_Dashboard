"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import FormErrorBanner from "@/components/FormErrorBanner";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
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
  const hasInserate = inserate.length > 0;

  const [name, setName] = useState(mieter?.name ?? "");
  const [email, setEmail] = useState(mieter?.email ?? "");
  const [telefon, setTelefon] = useState(mieter?.telefon ?? "");
  const [einheitNr, setEinheitNr] = useState(mieter?.einheit_nr ?? "");
  const [adresse, setAdresse] = useState(mieter?.adresse ?? "");
  const [plz, setPlz] = useState(mieter?.plz ?? "");
  const [stadt, setStadt] = useState(mieter?.stadt ?? "");
  const [notizen, setNotizen] = useState(mieter?.notizen ?? "");
  const [inseratId, setInseratId] = useState(
    mieter?.inserat_id ?? defaultInseratId ?? "",
  );
  const [einzugDatum, setEinzugDatum] = useState(mieter?.einzug_datum ?? "");
  const [auszugDatum, setAuszugDatum] = useState(mieter?.auszug_datum ?? "");
  const [status, setStatus] = useState<MieterStatus>(mieter?.status ?? "aktiv");

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      name,
      email,
      telefon,
      adresse,
      plz,
      stadt,
      einheit_nr: einheitNr,
      inserat_id: inseratId,
      einzug_datum: einzugDatum || null,
      auszug_datum: auszugDatum || null,
      status,
      notizen,
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

    toast.success(isEdit ? "Mieter aktualisiert" : "Mieter angelegt");
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

      {!hasInserate && (
        <p className="rounded-[4px] border border-border bg-warm-white px-3 py-2 text-sm text-text-secondary">
          Noch kein Inserat angelegt.{" "}
          <Link href="/objekte/neu" className="text-navy hover:text-gold">
            Zuerst Inserat anlegen
          </Link>
        </p>
      )}

      <Select
        label="Inserat *"
        required
        value={inseratId}
        onChange={(e) => setInseratId(e.target.value)}
        disabled={!hasInserate}
      >
        <option value="">— Inserat wählen —</option>
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

      <p className="text-xs text-text-hint">
        Korrespondenzadresse (optional — leer = Objektadresse des Inserats)
      </p>
      <Input
        label="Adresse"
        value={adresse}
        onChange={(e) => setAdresse(e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="PLZ" value={plz} onChange={(e) => setPlz(e.target.value)} />
        <div className="sm:col-span-2">
          <Input label="Stadt" value={stadt} onChange={(e) => setStadt(e.target.value)} />
        </div>
      </div>

      <Textarea
        label="Notizen (intern)"
        rows={3}
        value={notizen}
        onChange={(e) => setNotizen(e.target.value)}
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
        <FormErrorBanner message={error} onRetry={() => void handleSubmit()} />
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || !hasInserate}>
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
