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
  INSERAT_TYPEN,
  inseratTypLabel,
  type Inserat,
  type InseratTyp,
  type Vermieter,
} from "@/lib/types";

interface InseratFormProps {
  inserat?: Inserat;
  vermieter: Pick<Vermieter, "id" | "name" | "firma">[];
}

export default function InseratForm({ inserat, vermieter }: InseratFormProps) {
  const router = useRouter();
  const isEdit = Boolean(inserat);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const hasVermieter = vermieter.length > 0;

  const [adresse, setAdresse] = useState(inserat?.adresse ?? "");
  const [plz, setPlz] = useState(inserat?.plz ?? "");
  const [stadt, setStadt] = useState(inserat?.stadt ?? "");
  const [typ, setTyp] = useState<InseratTyp | "">(inserat?.typ ?? "");
  const [vermieterId, setVermieterId] = useState(inserat?.vermieter_id ?? "");
  const [einheiten, setEinheiten] = useState(
    inserat?.einheiten != null ? String(inserat.einheiten) : "1",
  );
  const [beschreibung, setBeschreibung] = useState(inserat?.beschreibung ?? "");
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
      const data = (await res.json()) as { error?: string };
      throw new Error(data.error ?? "Bild-Upload fehlgeschlagen");
    }
  }

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault();
    if (!vermieterId) {
      setError("Bitte einen Vermieter auswählen");
      return;
    }
    setError(null);
    setLoading(true);

    const payload = {
      adresse,
      plz,
      stadt,
      typ: typ || null,
      vermieter_id: vermieterId || null,
      einheiten,
      beschreibung,
      notizen,
    };

    try {
      let targetId: string;

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
        targetId = inserat!.id;
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
        targetId = id;
      }

      if (imageFile) {
        try {
          await uploadImage(targetId);
        } catch {
          toast.warning(
            "Inserat gespeichert, aber Bild-Upload fehlgeschlagen. Sie können das Bild auf der Bearbeiten-Seite erneut hochladen.",
          );
          router.push(`/inserate/${targetId}/bearbeiten`);
          router.refresh();
          return;
        }
      }

      toast.success(isEdit ? "Inserat aktualisiert" : "Inserat angelegt");
      router.push(`/inserate/${targetId}`);
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

      {!hasVermieter && (
        <p className="rounded-[4px] border border-border bg-warm-white px-3 py-2 text-sm text-text-secondary">
          Noch kein Vermieter angelegt.{" "}
          <Link href="/vermieter/neu" className="text-navy hover:text-gold">
            Zuerst Vermieter anlegen
          </Link>
        </p>
      )}

      <Select
        label="Vermieter *"
        required
        value={vermieterId}
        onChange={(e) => setVermieterId(e.target.value)}
        disabled={!hasVermieter}
      >
        <option value="">— Vermieter wählen —</option>
        {vermieter.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
            {v.firma ? ` (${v.firma})` : ""}
          </option>
        ))}
      </Select>

      <Input
        label="Einheiten"
        type="number"
        min={1}
        value={einheiten}
        onChange={(e) => setEinheiten(e.target.value)}
      />

      <Textarea
        label="Objektbeschreibung"
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

      <div>
        <label className="mb-1 block text-xs text-text-hint">
          Profilbild (max. 2 MB, JPEG/PNG/WebP)
        </label>
        <div className="rounded-[4px] border border-border bg-white p-2 focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/10">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-text-secondary outline-none"
          />
        </div>
      </div>

      {error && (
        <FormErrorBanner message={error} onRetry={() => void handleSubmit()} />
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || !hasVermieter}>
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
