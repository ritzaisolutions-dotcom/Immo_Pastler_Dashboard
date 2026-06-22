import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { isMitarbeiter } from "@/lib/auth-roles";
import { TABLES } from "@/lib/supabase/tables";
import Badge from "@/components/Badge";
import ProfileHeader from "@/components/ProfileHeader";
import TodoKategorieBoard from "@/components/TodoKategorieBoard";
import EmptyState from "@/components/ui/EmptyState";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/DataTable";
import {
  inseratTypLabel,
  type InseratWithVermieter,
  type Mieter,
  type Todo,
  type TodoWithNachricht,
  type PartnerNachrichtWithPartner,
} from "@/lib/types";

interface InseratDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InseratDetailPage({
  params,
}: InseratDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const mitarbeiter = isMitarbeiter(user);

  const { data: inseratData } = await supabase
    .from(TABLES.inserate)
    .select(`*, vermieter:${TABLES.vermieter}(id, name, firma, email, telefon)`)
    .eq("id", id)
    .maybeSingle();

  if (!inseratData) {
    notFound();
  }

  const inserat = inseratData as InseratWithVermieter;

  const [{ data: mieterList }, { data: todosList }] = await Promise.all([
    supabase
      .from(TABLES.mieter)
      .select("*")
      .eq("inserat_id", id)
      .order("name", { ascending: true }),
    supabase
      .from(TABLES.todos)
      .select("*")
      .eq("inserat_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const mieter = (mieterList ?? []) as Mieter[];
  let todos = (todosList ?? []) as Todo[];

  if (mitarbeiter && todos.length > 0) {
    const todoIds = todos.map((t) => t.id);
    const { data: nachrichten } = await supabase
      .from(TABLES.partnerNachrichten)
      .select(
        `*, partner:${TABLES.partner}(firma, email, ansprechpartner)`,
      )
      .in("todo_id", todoIds)
      .order("created_at", { ascending: false });

    const byTodo = new Map<string, PartnerNachrichtWithPartner>();
    for (const n of nachrichten ?? []) {
      if (!byTodo.has(n.todo_id)) {
        byTodo.set(n.todo_id, n as PartnerNachrichtWithPartner);
      }
    }

    todos = todos.map((todo) => ({
      ...todo,
      partner_nachricht: byTodo.get(todo.id) ?? null,
    })) as TodoWithNachricht[];
  }

  const subtitle = [
    inserat.stadt,
    inserat.typ ? inseratTypLabel(inserat.typ) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      <p className="mb-4">
        <Link href="/inserate" className="text-sm text-text-secondary hover:text-navy">
          ← Zurück zu Inserate
        </Link>
      </p>

      <ProfileHeader
        adresse={inserat.adresse}
        subtitle={subtitle || null}
        bildUrl={inserat.bild_url}
        editHref={mitarbeiter ? `/inserate/${id}/bearbeiten` : undefined}
      />

      <Card className="mb-8">
        <CardHeader>
          <h2 className="font-display text-xl text-text-primary">Stammdaten</h2>
        </CardHeader>
        <CardBody>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-text-hint">PLZ / Stadt</dt>
              <dd className="text-text-primary">
                {[inserat.plz, inserat.stadt].filter(Boolean).join(" ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-text-hint">Typ</dt>
              <dd>
                <Badge variant={{ type: "inseratTyp", value: inserat.typ }} />
              </dd>
            </div>
            <div>
              <dt className="text-text-hint">Einheiten</dt>
              <dd className="text-text-primary">{inserat.einheiten ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-text-hint">Vermieter</dt>
              <dd className="text-text-primary">
                {inserat.vermieter ? (
                  <Link
                    href={`/vermieter/${inserat.vermieter.id}`}
                    className="text-navy hover:text-gold"
                  >
                    {inserat.vermieter.name}
                    {inserat.vermieter.firma ? ` (${inserat.vermieter.firma})` : ""}
                  </Link>
                ) : (
                  inserat.eigentuemer_name ?? "—"
                )}
                {(inserat.vermieter?.email ?? inserat.eigentuemer_email) && (
                  <span className="block text-text-secondary">
                    {inserat.vermieter?.email ?? inserat.eigentuemer_email}
                  </span>
                )}
              </dd>
            </div>
            {inserat.beschreibung && (
              <div className="sm:col-span-2">
                <dt className="text-text-hint">Objektbeschreibung</dt>
                <dd className="whitespace-pre-wrap text-text-primary">
                  {inserat.beschreibung}
                </dd>
              </div>
            )}
            {inserat.notizen && (
              <div className="sm:col-span-2">
                <dt className="text-text-hint">Notizen</dt>
                <dd className="whitespace-pre-wrap text-text-primary">
                  {inserat.notizen}
                </dd>
              </div>
            )}
          </dl>
        </CardBody>
      </Card>

      <section className="mb-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl text-text-primary">Mieter</h2>
          {mitarbeiter && (
            <Link
              href={`/mieter/neu?inserat_id=${id}`}
              className="text-sm text-navy hover:text-gold"
            >
              + Mieter anlegen
            </Link>
          )}
        </div>
        {mieter.length === 0 ? (
          <EmptyState>Keine Mieter</EmptyState>
        ) : (
          <DataTable>
            <TableHead>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell>E-Mail</TableHeaderCell>
              <TableHeaderCell>Einheit</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
            </TableHead>
            <TableBody>
              {mieter.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <Link
                      href={`/mieter/${m.id}`}
                      className="font-medium text-navy hover:text-gold"
                    >
                      {m.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {m.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {m.einheit_nr ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={{ type: "mieterStatus", value: m.status }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl text-text-primary">Statusboard</h2>
        {todos.length === 0 ? (
          <EmptyState>Keine Todos für dieses Inserat</EmptyState>
        ) : (
          <TodoKategorieBoard
            todos={todos}
            showDescription={mitarbeiter}
            showStatusToggle={mitarbeiter}
            showPartnerNachricht={mitarbeiter}
            showEmailLink={mitarbeiter}
          />
        )}
      </section>
    </div>
  );
}
