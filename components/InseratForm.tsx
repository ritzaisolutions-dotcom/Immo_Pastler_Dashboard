"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import {
  INSERAT_TYPEN,
  inseratTypLabel,
  type Inserat,
  type InseratTyp,
} from "@/lib/types";

interface InseratFormProps {
  inserat?: Inserat;
}

export default function InseratForm({ inserat }: InseratFormProps) {
  const router = useRouter();
  const isEdit = Boolean(inserat);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [adresse, setAdresse] = useState(inserat?.adresse ?? "");
  const [plz, setPlz] = useState(inserat?.plz ?? "");
  const [stadt, setStadt] = useState(inserat?.stadt ?? "");
  const [typ, setTyp] = useState<InseratTyp | "">(inserat?.typ ?? "");
  const [eigentuemerName, setEigentuemerName] = useState(
    inserat?.eigentuemer_name ?? "",
  );
  const [eigentuemerEmail, setEigentuemerEmail] = useState(
    inserat?.eigentuemer_email ?? "",
  );
  const [einheiten, setEinheiten] = useState(
    inserat?.einheiten != null ? String(inserat.einheiten) : "1",
  );
  const [notizen, setNotizen] = useState(inserat?.notizen ?? "");

  async function uploadImage(inseratId: string) {
    if (!imageFile) return;
    const formData = new FormData();
    formData.append("file", imageFile);
    const res = await fetch(`/api/inserate/${inseratId}/bild`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      throw new Error("Bild-Upload fehlgeschlagen");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      adresse,
      plz,
      stadt,
      typ: typ || null,
      eigentuemer_name: eigentuemerName,
      eigentuemer_email: eigentuemerEmail,
      einheiten,
      notizen,
    };

    try {
      if (isEdit) {
        const res = await fetch(`/api/inserate/${inserat!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "Speichern fehlgeschlagen");
        }
        if (imageFile) {
          await uploadImage(inserat!.id);
        }
        router.push(`/inserate/${inserat!.id}`);
      } else {
        const res = await fetch("/api/inserate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const data = (await res.json()) as { error?: string };
          throw new Error(data.error ?? "Anlegen fehlgeschlagen");
        }
        const { id } = (await res.json()) as { id: string };
        if (imageFile) {
          await uploadImage(id);
        }
        router.push(`/inserate/${id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <Input
        label="Adresse *"
        required
        value={adresse}
        onChange={(e) => setAdresse(e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="PLZ"
          value={plz}
          onChange={(e) => setPlz(e.target.value)}
        />
        <div className="sm:col-span-2">
          <Input
            label="Stadt"
            value={stadt}
            onChange={(e) => setStadt(e.target.value)}
          />
        </div>
      </div>

      <Select
        label="Typ"
        value={typ}
        onChange={(e) => setTyp(e.target.value as InseratTyp | "")}
      >
        <option value="">—</option>
        {INSERAT_TYPEN.map((t) => (
          <option key={t} value={t}>
            {inseratTypLabel(t)}
          </option>
        ))}
      </Select>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Eigentümer Name"
          value={eigentuemerName}
          onChange={(e) => setEigentuemerName(e.target.value)}
        />
        <Input
          label="Eigentümer E-Mail"
          type="email"
          value={eigentuemerEmail}
          onChange={(e) => setEigentuemerEmail(e.target.value)}
        />
      </div>

      <Input
        label="Einheiten"
        type="number"
        min={1}
        value={einheiten}
        onChange={(e) => setEinheiten(e.target.value)}
      />

      <div>
        <label className="mb-1 block text-xs text-text-hint">Notizen</label>
        <textarea
          rows={3}
          value={notizen}
          onChange={(e) => setNotizen(e.target.value)}
          className="w-full rounded-[4px] border border-border bg-white px-3 py-2 text-sm outline-none focus:border-navy"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs text-text-hint">
          Profilbild (max. 2 MB, JPEG/PNG/WebP)
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-text-secondary"
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
            router.push(isEdit ? `/inserate/${inserat!.id}` : "/inserate")
          }
        >
          Abbrechen
        </Button>
      </div>
    </form>
  );
}
