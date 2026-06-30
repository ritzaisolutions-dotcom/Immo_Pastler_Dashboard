"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import Badge from "@/components/Badge";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/DataTable";
import {
  type Email,
  type TodoStatus,
} from "@/lib/types";

export type EmailMasterRow = Email & {
  todo_status: TodoStatus | null;
  mieter_name: string | null;
};

type EmailMasterTableProps = {
  emails: EmailMasterRow[];
};

function previewText(text: string | null, max = 120): string {
  if (!text) return "—";
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max)}…`;
}

export default function EmailMasterTable({ emails }: EmailMasterTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <DataTable>
      <TableHead>
        <TableHeaderCell>Absender</TableHeaderCell>
        <TableHeaderCell>Betreff</TableHeaderCell>
        <TableHeaderCell>Vorschau</TableHeaderCell>
        <TableHeaderCell>Datum</TableHeaderCell>
        <TableHeaderCell>Status</TableHeaderCell>
        <TableHeaderCell>Mieter</TableHeaderCell>
      </TableHead>
      <TableBody>
        {emails.map((email) => {
          const expanded = expandedId === email.id;
          const status = email.todo_status ?? "offen";
          return (
            <Fragment key={email.id}>
              <TableRow
                key={email.id}
                className="cursor-pointer"
                onClick={() =>
                  setExpandedId(expanded ? null : email.id)
                }
              >
                <TableCell>
                  <div>
                    <div className="font-medium text-text-primary">
                      {email.von_name ?? email.von_email}
                    </div>
                    <div className="text-xs text-text-hint">{email.von_email}</div>
                  </div>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {email.betreff ?? "—"}
                </TableCell>
                <TableCell className="max-w-[280px] text-sm text-text-secondary">
                  {previewText(email.inhalt_text)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-text-secondary">
                  {new Date(email.empfangen_at).toLocaleString("de-DE")}
                </TableCell>
                <TableCell>
                  <Badge variant={{ type: "status", value: status }} />
                </TableCell>
                <TableCell>
                  {email.mieter_name ? (
                    <span className="rounded-[4px] bg-info/10 px-2 py-0.5 text-xs text-info">
                      {email.mieter_name}
                    </span>
                  ) : (
                    <span className="text-text-hint">—</span>
                  )}
                </TableCell>
              </TableRow>
              {expanded && (
                <TableRow key={`${email.id}-expand`}>
                  <TableCell colSpan={6} className="bg-warm-white">
                    <div className="whitespace-pre-wrap text-sm text-text-primary">
                      {email.inhalt_text ?? "Kein Inhalt"}
                    </div>
                    <Link
                      href={`/emails/${email.id}`}
                      className="mt-3 inline-block text-sm text-navy hover:text-gold"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Zuordnung bearbeiten →
                    </Link>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </DataTable>
  );
}
