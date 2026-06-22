import Link from "next/link";
import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import { TABLES } from "@/lib/supabase/tables";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/DataTable";
import { type Email } from "@/lib/types";

export default async function EmailsPage() {
  const { supabase } = await requireMitarbeiterPage();

  const { data: emails } = await supabase
    .from(TABLES.emails)
    .select("*")
    .order("empfangen_at", { ascending: false })
    .limit(100);

  const emailList = (emails ?? []) as Email[];

  const todoByEmail = new Map<
    string,
    { id: string; titel: string; mieter_id: string | null; inserat_id: string | null }
  >();
  if (emailList.length > 0) {
    const emailIds = emailList.map((e) => e.id);
    const { data: todos } = await supabase
      .from(TABLES.todos)
      .select("id, titel, email_id, mieter_id, inserat_id")
      .in("email_id", emailIds);

    for (const t of todos ?? []) {
      if (t.email_id && !todoByEmail.has(t.email_id)) {
        todoByEmail.set(t.email_id, {
          id: t.id,
          titel: t.titel,
          mieter_id: t.mieter_id,
          inserat_id: t.inserat_id,
        });
      }
    }
  }

  return (
    <div>
      <PageHeader
        title="E-Mails"
        subtitle="Volltext nur für Mitarbeiter (DSGVO)"
      />

      {emailList.length === 0 ? (
        <EmptyState>Keine E-Mails vorhanden</EmptyState>
      ) : (
        <DataTable>
          <TableHead>
            <TableHeaderCell>Empfangen</TableHeaderCell>
            <TableHeaderCell>Von</TableHeaderCell>
            <TableHeaderCell>Betreff</TableHeaderCell>
            <TableHeaderCell>Todo</TableHeaderCell>
          </TableHead>
          <TableBody>
            {emailList.map((email) => {
              const todo = todoByEmail.get(email.id);
              return (
                <TableRow key={email.id}>
                  <TableCell className="text-text-secondary">
                    {new Date(email.empfangen_at).toLocaleString("de-DE")}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/emails/${email.id}`}
                      className="font-medium text-navy hover:text-gold"
                    >
                      {email.von_name ?? email.von_email}
                    </Link>
                    <p className="text-xs text-text-hint">{email.von_email}</p>
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {email.betreff ?? "—"}
                  </TableCell>
                  <TableCell>
                    {todo ? (
                      <Link
                        href={
                          todo.mieter_id
                            ? `/todos?mieter_id=${todo.mieter_id}`
                            : todo.inserat_id
                              ? `/todos?inserat_id=${todo.inserat_id}`
                              : "/todos"
                        }
                        className="text-sm text-navy hover:text-gold"
                      >
                        {todo.titel}
                      </Link>
                    ) : (
                      <span className="text-text-hint">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </DataTable>
      )}
    </div>
  );
}
