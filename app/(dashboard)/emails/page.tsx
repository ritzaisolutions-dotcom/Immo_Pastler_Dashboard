import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import { TABLES } from "@/lib/supabase/tables";
import EmailMasterTable, {
  type EmailMasterRow,
} from "@/components/EmailMasterTable";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { type Email, type TodoStatus } from "@/lib/types";

export default async function EmailsPage() {
  const { supabase } = await requireMitarbeiterPage();

  const { data: emails } = await supabase
    .from(TABLES.emails)
    .select("*")
    .order("empfangen_at", { ascending: false })
    .limit(100);

  const emailList = (emails ?? []) as Email[];

  const { data: mieterList } = await supabase
    .from(TABLES.mieter)
    .select("id, name, email");

  type MieterLookup = { id: string; name: string; email: string | null };
  const mieterRows = (mieterList ?? []) as MieterLookup[];

  const mieterByEmail = new Map<string, MieterLookup>();
  for (const m of mieterRows) {
    if (m.email) mieterByEmail.set(m.email.toLowerCase(), m);
  }

  const todoStatusByEmail = new Map<string, TodoStatus>();

  if (emailList.length > 0) {
    const emailIds = emailList.map((e) => e.id);
    const { data: todos } = await supabase
      .from(TABLES.todos)
      .select("email_id, status, mieter_id")
      .in("email_id", emailIds);

    for (const t of todos ?? []) {
      if (t.email_id && !todoStatusByEmail.has(t.email_id)) {
        todoStatusByEmail.set(t.email_id, t.status as TodoStatus);
      }
    }
  }

  const rows: EmailMasterRow[] = emailList.map((email) => {
    let mieterName: string | null = null;
    if (email.mieter_id) {
      const m = mieterRows.find((x) => x.id === email.mieter_id);
      mieterName = m?.name ?? null;
    } else {
      const m = mieterByEmail.get(email.von_email.toLowerCase());
      mieterName = m?.name ?? null;
    }
    return {
      ...email,
      todo_status: todoStatusByEmail.get(email.id) ?? null,
      mieter_name: mieterName,
    };
  });

  return (
    <div>
      <PageHeader
        title="E-Mails"
        subtitle="Klicken Sie auf eine Zeile, um den vollständigen Inhalt anzuzeigen"
      />

      {rows.length === 0 ? (
        <EmptyState>Keine E-Mails vorhanden</EmptyState>
      ) : (
        <EmailMasterTable emails={rows} />
      )}
    </div>
  );
}
