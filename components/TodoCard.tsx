"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Badge from "@/components/Badge";
import ZuordnungBadge from "@/components/ZuordnungBadge";
import PartnerNachrichtPanel from "@/components/PartnerNachrichtPanel";
import Select from "@/components/ui/Select";
import { Card, CardBody } from "@/components/ui/Card";
import {
  TODO_STATUSES,
  formatDate,
  statusLabel,
  type PartnerNachrichtWithPartner,
  type Todo,
  type TodoWithMieter,
  type TodoWithMieterInserat,
  type TodoWithNachricht,
} from "@/lib/types";

interface TodoCardProps {
  todo: Todo | TodoWithMieter | TodoWithMieterInserat | TodoWithNachricht;
  showStatusToggle?: boolean;
  showDescription?: boolean;
  showPartnerNachricht?: boolean;
  showEmailLink?: boolean;
  showZuordnung?: boolean;
}

export default function TodoCard({
  todo,
  showStatusToggle = true,
  showDescription = true,
  showPartnerNachricht = false,
  showEmailLink = false,
  showZuordnung = false,
}: TodoCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState(todo.status);
  const [updating, setUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const mieter =
    "mieter" in todo && todo.mieter ? todo.mieter : null;
  const inserat =
    "inserat" in todo && todo.inserat ? todo.inserat : null;
  const vermieter =
    "vermieter" in todo && todo.vermieter ? todo.vermieter : null;

  const mieterId = mieter?.id ?? todo.mieter_id;
  const inseratId = inserat?.id ?? todo.inserat_id;
  const vermieterId = vermieter?.id ?? todo.vermieter_id;

  const partnerNachricht =
    "partner_nachricht" in todo ? todo.partner_nachricht : null;

  async function handleStatusChange(newStatus: string) {
    if (newStatus === status) return;
    setUpdating(true);
    setStatusError(null);

    const res = await fetch(`/api/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      setStatus(newStatus as typeof status);
      toast.success("Status aktualisiert");
      router.refresh();
    } else {
      setStatusError("Status konnte nicht gespeichert werden");
    }

    setUpdating(false);
  }

  return (
    <Card>
      <CardBody className="p-4">
        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-display text-lg text-text-primary">{todo.titel}</h3>
          <div className="flex flex-wrap gap-1.5">
            {todo.kategorie && (
              <Badge variant={{ type: "kategorie", value: todo.kategorie }} />
            )}
            <Badge variant={{ type: "prioritaet", value: todo.prioritaet }} />
            <Badge variant={{ type: "status", value: status }} />
            {showZuordnung && todo.zuordnung_quelle && (
              <ZuordnungBadge
                quelle={todo.zuordnung_quelle}
                konfidenz={todo.zuordnung_konfidenz}
              />
            )}
          </div>
        </div>

        {showDescription && todo.beschreibung && (
          <p className="mb-3 text-sm text-text-secondary">{todo.beschreibung}</p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-text-hint">
          <span>Fällig: {formatDate(todo.faellig_at)}</span>
          {mieterId && mieter?.name && (
            <span>
              Mieter:{" "}
              <Link href={`/mieter/${mieterId}`} className="text-navy hover:text-gold">
                {mieter.name}
              </Link>
            </span>
          )}
          {inseratId && inserat?.adresse && (
            <span>
              Inserat:{" "}
              <Link
                href={`/objekte/${inseratId}`}
                className="text-navy hover:text-gold"
              >
                {inserat.adresse}
                {inserat.stadt ? `, ${inserat.stadt}` : ""}
              </Link>
            </span>
          )}
          {vermieterId && (vermieter?.name || todo.vermieter_id) && (
            <span>
              Vermieter:{" "}
              <Link
                href={`/vermieter/${vermieterId}`}
                className="text-navy hover:text-gold"
              >
                {vermieter?.name ?? "Profil"}
              </Link>
            </span>
          )}
          {showEmailLink && todo.email_id && (
            <Link href={`/emails/${todo.email_id}`} className="text-navy hover:text-gold">
              E-Mail anzeigen
            </Link>
          )}
        </div>

        {todo.use_case && (
          <p className="mb-2 text-xs text-text-hint">Use-Case: {todo.use_case}</p>
        )}

        {showPartnerNachricht && partnerNachricht && (
          <PartnerNachrichtPanel
            nachricht={partnerNachricht as PartnerNachrichtWithPartner}
          />
        )}

        {showStatusToggle && (
          <div className="mt-3 border-t border-border pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <Select
                label="Status"
                value={status}
                disabled={updating}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-auto min-w-[160px] text-xs"
              >
                {TODO_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </Select>
            </div>
            {statusError && (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {statusError}
              </p>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
