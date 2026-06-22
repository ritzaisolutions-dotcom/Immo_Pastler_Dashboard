"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { type Vermieter } from "@/lib/types";

interface VermieterFormProps {
  vermieter?: Vermieter;
}

export default function VermieterForm({ vermieter }: VermieterFormProps) {
  const router = useRouter();
  const isEdit = Boolean(vermieter);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(vermieter?.name ?? "");
  const [firma, setFirma] = useState(vermieter?.firma ?? "");
  const [email, setEmail] = useState(vermieter?.email ?? "");
  const [telefon, setTelefon] = useState(vermieter?.telefon ?? "");
  const [adresse, setAdresse] = useState(vermieter?.adresse ?? "");
  const [plz, setPlz] = useState(vermieter?.plz ?? "");
  const [stadt, setStadt] = useState(vermieter?.stadt ?? "");
  const [beschreibung, setBeschreibung] = useState(vermieter?.beschreibung ?? "");
  const [notizen, setNotizen] = useState(vermieter?.notizen ?? "");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      name,
      firma,
      email,
      telefon,
      adresse,
      plz,
      stadt,
      beschreibung,
      notizen,
    };

    try {
      const url = isEdit ? `/api/vermieter/${vermieter!.id}` : "/api/vermieter";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Speichern fehlgeschlagen");
      }
      if (isEdit) {
        router.push(`/vermieter/${vermieter!.id}`);
      } else {
        const { id } = (await res.json()) as { id: string };
        router.push(`/vermieter/${id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <Input label="Name *" required value={name} onChange={(e) => setName(e.target.value)} />
      <Input label="Firma (optional)" value={firma} onChange={(e) => setFirma(e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="E-Mail *"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input label="Telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
      </div>

      <Input
        label="Kontaktadresse"
        value={adresse}
        onChange={(e) => setAdresse(e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input label="PLZ" value={plz} onChange={(e) => setPlz(e.target.value)} />
        <div className="sm:col-span-2">
          <Input label="Stadt" value={stadt} onChange={(e) => setStadt(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-text-hint">Beschreibung</label>
        <textarea
          rows={3}
          value={beschreibung}
          onChange={(e) => setBeschreibung(e.target.value)}
          className="w-full rounded-[4px] border border-border bg-white px-3 py-2 text-sm outline-none focus:border-navy"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-text-hint">Notizen (intern)</label>
        <textarea
          rows={3}
          value={notizen}
          onChange={(e) => setNotizen(e.target.value)}
          className="w-full rounded-[4px] border border-border bg-white px-3 py-2 text-sm outline-none focus:border-navy"
        />
      </div>

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
            router.push(isEdit ? `/vermieter/${vermieter!.id}` : "/vermieter")
          }
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
