"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/Badge";
import {
  TODO_STATUSES,
  formatDate,
  statusLabel,
  type Todo,
  type TodoWithMieter,
} from "@/lib/types";

interface TodoCardProps {
  todo: Todo | TodoWithMieter;
  showStatusToggle?: boolean;
}

export default function TodoCard({
  todo,
  showStatusToggle = true,
}: TodoCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState(todo.status);
  const [updating, setUpdating] = useState(false);

  const mieterName =
    "mieter" in todo && todo.mieter ? todo.mieter.name : null;

  async function handleStatusChange(newStatus: string) {
    if (newStatus === status) return;
    setUpdating(true);

    const res = await fetch(`/api/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      setStatus(newStatus as typeof status);
      router.refresh();
    }

    setUpdating(false);
  }

  return (
    <article className="border border-border bg-white p-4 rounded-[4px]">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-display text-lg text-text-primary">{todo.titel}</h3>
        <div className="flex flex-wrap gap-1.5">
          {todo.kategorie && (
            <Badge variant={{ type: "kategorie", value: todo.kategorie }} />
          )}
          <Badge variant={{ type: "prioritaet", value: todo.prioritaet }} />
          <Badge variant={{ type: "status", value: status }} />
        </div>
      </div>

      {todo.beschreibung && (
        <p className="mb-3 text-sm text-text-secondary">{todo.beschreibung}</p>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs text-text-hint">
        <span>Fällig: {formatDate(todo.faellig_at)}</span>
        {mieterName && <span>Mieter: {mieterName}</span>}
      </div>

      {showStatusToggle && (
        <div className="mt-3 border-t border-border pt-3">
          <label className="mr-2 text-xs text-text-hint">Status:</label>
          <select
            value={status}
            disabled={updating}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="border border-border bg-white px-2 py-1 text-xs rounded-[4px]"
          >
            {TODO_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>
      )}
    </article>
  );
}
