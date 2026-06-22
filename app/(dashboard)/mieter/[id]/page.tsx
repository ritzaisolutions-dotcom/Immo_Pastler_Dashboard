import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { isMitarbeiter } from "@/lib/auth-roles";
import { TABLES } from "@/lib/supabase/tables";
import Badge from "@/components/Badge";
import TodoKategorieBoard from "@/components/TodoKategorieBoard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  formatDate,
  inseratTypLabel,
  type Inserat,
  type MieterWithInserat,
  type Todo,
  type TodoWithNachricht,
  type PartnerNachrichtWithPartner,
} from "@/lib/types";

interface MieterDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MieterDetailPage({ params }: MieterDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const mitarbeiter = isMitarbeiter(user);

  const { data: mieterData } = await supabase
    .from(TABLES.mieter)
    .select(`*, inserat:${TABLES.inserate}(id, adresse, stadt, bild_url)`)
    .eq("id", id)
    .maybeSingle();

  if (!mieterData) {
    notFound();
  }

  const mieter = mieterData as MieterWithInserat & {
    inserat: Pick<Inserat, "id" | "adresse" | "stadt" | "bild_url"> | null;
  };

  let todos = (await supabase
    .from(TABLES.todos)
    .select(`*, inserat:${TABLES.inserate}(id, adresse, stadt)`)
    .eq("mieter_id", id)
    .order("created_at", { ascending: false })).data as Todo[] | null;

  todos = todos ?? [];

  if (mitarbeiter && todos.length > 0) {
    const todoIds = todos.map((t) => t.id);
    const { data: nachrichten } = await supabase
      .from(TABLES.partnerNachrichten)
      .select(`*, partner:${TABLES.partner}(firma, email, ansprechpartner)`)
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

  return (
    <div>
      <PageHeader
        title={mieter.name}
        subtitle={
          <Link href="/mieter" className="text-sm text-text-secondary hover:text-navy">
            ← Zurück zu Mieter
          </Link>
        }
        actions={
          mitarbeiter ? (
            <Link href={`/mieter/${id}/bearbeiten`}>
              <Button variant="secondary">Bearbeiten</Button>
            </Link>
          ) : undefined
        }
      />

      <Card className="mb-8">
        <CardHeader>
          <h2 className="font-display text-xl text-text-primary">Stammdaten</h2>
        </CardHeader>
        <CardBody>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-text-hint">E-Mail</dt>
              <dd className="text-text-primary">{mieter.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-text-hint">Telefon</dt>
              <dd className="text-text-primary">{mieter.telefon ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-text-hint">Einheit</dt>
              <dd className="text-text-primary">{mieter.einheit_nr ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-text-hint">Status</dt>
              <dd>
                <Badge variant={{ type: "mieterStatus", value: mieter.status }} />
              </dd>
            </div>
            <div>
              <dt className="text-text-hint">Einzug</dt>
              <dd className="text-text-primary">{formatDate(mieter.einzug_datum)}</dd>
            </div>
            <div>
              <dt className="text-text-hint">Auszug</dt>
              <dd className="text-text-primary">{formatDate(mieter.auszug_datum)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-text-hint">Inserat</dt>
              <dd>
                {mieter.inserat ? (
                  <Link
                    href={`/inserate/${mieter.inserat.id}`}
                    className="text-navy hover:text-gold"
                  >
                    {mieter.inserat.adresse}
                    {mieter.inserat.stadt ? `, ${mieter.inserat.stadt}` : ""}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <section>
        <h2 className="mb-4 font-display text-xl text-text-primary">Todos nach Kategorie</h2>
        {todos.length === 0 ? (
          <EmptyState>Keine Todos für diesen Mieter</EmptyState>
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
