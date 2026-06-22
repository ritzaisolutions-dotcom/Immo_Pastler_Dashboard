import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { isMitarbeiter } from "@/lib/auth-roles";
import { TABLES } from "@/lib/supabase/tables";
import Badge from "@/components/Badge";
import StammdatenProfil from "@/components/StammdatenProfil";
import TodoKategorieBoard from "@/components/TodoKategorieBoard";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Card, CardBody } from "@/components/ui/Card";
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
    .select(
      `*, inserat:${TABLES.inserate}(id, adresse, stadt, bild_url, vermieter:${TABLES.vermieter}(id, name, firma))`,
    )
    .eq("id", id)
    .maybeSingle();

  if (!mieterData) {
    notFound();
  }

  const mieter = mieterData as MieterWithInserat & {
    inserat:
      | (Pick<Inserat, "id" | "adresse" | "stadt" | "bild_url"> & {
          vermieter: { id: string; name: string; firma: string | null } | null;
        })
      | null;
  };

  let todos = (await supabase
    .from(TABLES.todos)
    .select(
      `*, inserat:${TABLES.inserate}(id, adresse, stadt), vermieter:${TABLES.vermieter}(id, name, firma)`,
    )
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
        <CardBody>
          <StammdatenProfil
            title="Stammdaten"
            rows={[
              { label: "E-Mail", value: mieter.email },
              { label: "Telefon", value: mieter.telefon },
              { label: "Einheit", value: mieter.einheit_nr },
              {
                label: "Status",
                value: <Badge variant={{ type: "mieterStatus", value: mieter.status }} />,
              },
              { label: "Einzug", value: formatDate(mieter.einzug_datum) },
              { label: "Auszug", value: formatDate(mieter.auszug_datum) },
              {
                label: "Inserat (Objekt)",
                value: mieter.inserat ? (
                  <Link
                    href={`/inserate/${mieter.inserat.id}`}
                    className="text-navy hover:text-gold"
                  >
                    {mieter.inserat.adresse}
                    {mieter.inserat.stadt ? `, ${mieter.inserat.stadt}` : ""}
                  </Link>
                ) : null,
              },
              ...(mieter.inserat?.vermieter
                ? [
                    {
                      label: "Vermieter",
                      value: (
                        <Link
                          href={`/vermieter/${mieter.inserat.vermieter.id}`}
                          className="text-navy hover:text-gold"
                        >
                          {mieter.inserat.vermieter.name}
                          {mieter.inserat.vermieter.firma
                            ? ` (${mieter.inserat.vermieter.firma})`
                            : ""}
                        </Link>
                      ),
                    },
                  ]
                : []),
              ...(mieter.adresse || mieter.plz || mieter.stadt
                ? [
                    {
                      label: "Korrespondenzadresse",
                      value: [mieter.adresse, [mieter.plz, mieter.stadt].filter(Boolean).join(" ")]
                        .filter(Boolean)
                        .join(", "),
                    },
                  ]
                : []),
              ...(mieter.notizen ? [{ label: "Notizen", value: mieter.notizen }] : []),
            ]}
          />
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
            showZuordnung={mitarbeiter}
          />
        )}
      </section>
    </div>
  );
}
