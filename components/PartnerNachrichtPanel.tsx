"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { nachrichtStatusLabel, type PartnerNachrichtWithPartner } from "@/lib/types";

interface PartnerNachrichtPanelProps {
  nachricht: PartnerNachrichtWithPartner;
  editable?: boolean;
}

export default function PartnerNachrichtPanel({
  nachricht,
  editable = true,
}: PartnerNachrichtPanelProps) {
  const router = useRouter();
  const [betreff, setBetreff] = useState(nachricht.betreff);
  const [inhalt, setInhalt] = useState(nachricht.inhalt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [pendingAction, setPendingAction] = useState<"senden" | "ablehnen" | null>(null);

  const partnerName = nachricht.partner?.firma ?? "Partner";
  const partnerEmail = nachricht.partner?.email ?? "";

  async function handleSave() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/partner-nachrichten/${nachricht.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ betreff, inhalt }),
    });
    setLoading(false);
    if (!res.ok) {
      try {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Speichern fehlgeschlagen");
      } catch {
        setError("Speichern fehlgeschlagen");
      }
      return;
    }
    setEditing(false);
    toast.success("Entwurf gespeichert");
    router.refresh();
  }

  async function handleSend() {
    setPendingAction(null);
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/partner-nachrichten/${nachricht.id}/send`, {
      method: "POST",
    });
    setLoading(false);
    if (!res.ok) {
      try {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Senden fehlgeschlagen");
      } catch {
        setError("Senden fehlgeschlagen");
      }
      return;
    }
    toast.success(`E-Mail an ${partnerName} gesendet`);
    router.refresh();
  }

  async function handleReject() {
    setPendingAction(null);
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/partner-nachrichten/${nachricht.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "abgelehnt" }),
    });
    setLoading(false);
    if (!res.ok) {
      try {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Ablehnen fehlgeschlagen");
      } catch {
        setError("Ablehnen fehlgeschlagen");
      }
      return;
    }
    toast.success("Entwurf abgelehnt");
    router.refresh();
  }

  if (nachricht.status !== "entwurf") {
    return (
      <div className="mt-3 rounded-[4px] border border-border bg-gold-pale/40 p-3 text-xs text-text-secondary">
        Partner-E-Mail: {nachrichtStatusLabel(nachricht.status)}
        {nachricht.gesendet_at && (
          <span className="ml-2">
            ({new Date(nachricht.gesendet_at).toLocaleString("de-DE")})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-[4px] border border-gold/40 bg-gold-pale/30 p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-hint">
        Partner-E-Mail Entwurf
      </p>
      <p className="mb-3 text-sm text-text-secondary">
        An: {partnerName} ({partnerEmail})
      </p>

      {editing ? (
        <div className="space-y-2">
          <Input
            value={betreff}
            onChange={(e) => setBetreff(e.target.value)}
          />
          <textarea
            rows={5}
            value={inhalt}
            onChange={(e) => setInhalt(e.target.value)}
            className="w-full rounded-[4px] border border-border bg-white px-2 py-1.5 text-sm outline-none focus:border-navy"
          />
        </div>
      ) : (
        <div className="text-sm">
          <p className="font-medium text-text-primary">{betreff}</p>
          <p className="mt-2 whitespace-pre-wrap text-text-secondary">{inhalt}</p>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}

      {editable && (
        <div className="mt-3">
          {pendingAction && (
            <div className="mb-2 flex items-center gap-2 rounded-[4px] border border-gold/40 bg-gold-pale/60 px-3 py-2 text-xs">
              <span className="text-text-secondary">
                {pendingAction === "senden"
                  ? `E-Mail wirklich an ${partnerName} senden?`
                  : "Entwurf wirklich ablehnen?"}
              </span>
              <Button
                onClick={pendingAction === "senden" ? handleSend : handleReject}
                disabled={loading}
                className="px-2 py-1 text-xs"
              >
                Ja
              </Button>
              <Button
                variant="secondary"
                onClick={() => setPendingAction(null)}
                className="px-2 py-1 text-xs"
              >
                Abbrechen
              </Button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
          {!editing ? (
            <>
              <Button
                variant="gold"
                disabled={loading}
                onClick={() => setPendingAction("senden")}
                className="px-3 py-1.5 text-xs"
              >
                Senden
              </Button>
              <Button
                variant="secondary"
                disabled={loading}
                onClick={() => setEditing(true)}
                className="px-3 py-1.5 text-xs"
              >
                Bearbeiten
              </Button>
              <Button
                variant="secondary"
                disabled={loading}
                onClick={() => setPendingAction("ablehnen")}
                className="px-3 py-1.5 text-xs text-text-secondary"
              >
                Ablehnen
              </Button>
            </>
          ) : (
            <>
              <Button
                disabled={loading}
                onClick={handleSave}
                className="px-3 py-1.5 text-xs"
              >
                Entwurf speichern
              </Button>
              <Button
                variant="secondary"
                disabled={loading}
                onClick={() => {
                  setBetreff(nachricht.betreff);
                  setInhalt(nachricht.inhalt);
                  setEditing(false);
                }}
                className="px-3 py-1.5 text-xs"
              >
                Abbrechen
              </Button>
            </>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
