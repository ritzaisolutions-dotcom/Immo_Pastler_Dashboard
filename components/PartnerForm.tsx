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
  PARTNER_GEWERKE,
  gewerkLabel,
  type Partner,
  type PartnerGewerk,
} from "@/lib/types";

interface PartnerFormProps {
  partner?: Partner;
}

export default function PartnerForm({ partner }: PartnerFormProps) {
  const router = useRouter();
  const isEdit = Boolean(partner);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firma, setFirma] = useState(partner?.firma ?? "");
  const [ansprechpartner, setAnsprechpartner] = useState(partner?.ansprechpartner ?? "");
  const [adresse, setAdresse] = useState(partner?.adresse ?? "");
  const [plz, setPlz] = useState(partner?.plz ?? "");
  const [stadt, setStadt] = useState(partner?.stadt ?? "");
  const [email, setEmail] = useState(partner?.email ?? "");
  const [telefon, setTelefon] = useState(partner?.telefon ?? "");
  const [gewerk, setGewerk] = useState<PartnerGewerk>(partner?.gewerk ?? "allgemein");
  const [beschreibung, setBeschreibung] = useState(partner?.beschreibung ?? "");
  const [notizen, setNotizen] = useState(partner?.notizen ?? "");
  const [aktiv, setAktiv] = useState(partner?.aktiv ?? true);

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      firma,
      ansprechpartner,
      adresse,
      plz,
      stadt,
      email,
      telefon,
      gewerk,
      beschreibung,
      notizen,
      aktiv,
    };

    const url = isEdit ? `/api/partner/${partner!.id}` : "/api/partner";
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

    toast.success(isEdit ? "Partner aktualisiert" : "Partner angelegt");
    if (isEdit) {
      router.push(`/partner/${partner!.id}`);
    } else {
      router.push("/partner");
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <Input
        label="Firma *"
        required
        value={firma}
        onChange={(e) => setFirma(e.target.value)}
      />

      <Input
        label="Ansprechpartner"
        value={ansprechpartner}
        onChange={(e) => setAnsprechpartner(e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Input
            label="Adresse"
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
          />
        </div>
        <Input
          label="PLZ"
          value={plz}
          onChange={(e) => setPlz(e.target.value)}
        />
      </div>

      <Input
        label="Stadt"
        value={stadt}
        onChange={(e) => setStadt(e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="E-Mail *"
          type="email"
          required
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
        label="Gewerk *"
        value={gewerk}
        onChange={(e) => setGewerk(e.target.value as PartnerGewerk)}
      >
        {PARTNER_GEWERKE.map((g) => (
          <option key={g} value={g}>
            {gewerkLabel(g)}
          </option>
        ))}
      </Select>

      <Textarea
        label="Beschreibung"
        rows={3}
        value={beschreibung}
        onChange={(e) => setBeschreibung(e.target.value)}
      />

      <Textarea
        label="Notizen (intern)"
        rows={3}
        value={notizen}
        onChange={(e) => setNotizen(e.target.value)}
      />

      {isEdit && (
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={aktiv}
            onChange={(e) => setAktiv(e.target.checked)}
          />
          Partner aktiv — E-Mails werden automatisch zugestellt
        </label>
      )}

      {error && (
        <FormErrorBanner message={error} onRetry={() => void handleSubmit()} />
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Speichern…" : isEdit ? "Aktualisieren" : "Anlegen"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            router.push(isEdit ? `/partner/${partner!.id}` : "/partner")
          }
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
