import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import { TABLES } from "@/lib/supabase/tables";
import PageHeader from "@/components/ui/PageHeader";
import StammdatenProfil from "@/components/StammdatenProfil";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/DataTable";
import { inseratTypLabel, type Inserat, type Mieter, type Todo, type Vermieter } from "@/lib/types";
import Badge from "@/components/Badge";
import TodoKategorieBoard from "@/components/TodoKategorieBoard";
import { ArrowLeft } from "lucide-react";

interface VermieterDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function VermieterDetailPage({ params }: VermieterDetailPageProps) {
  const { id } = await params;
  const { supabase } = await requireMitarbeiterPage();

  const { data } = await supabase
    .from(TABLES.vermieter)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const vermieter = data as Vermieter;

  const { data: inserate } = await supabase
    .from(TABLES.inserate)
    .select("*")
    .eq("vermieter_id", id)
    .order("adresse", { ascending: true });

  const inseratList = (inserate ?? []) as Inserat[];
  const inseratIds = inseratList.map((i) => i.id);

  const [{ data: mieterData }, { data: todosData }] = await Promise.all([
    inseratIds.length > 0
      ? supabase
          .from(TABLES.mieter)
          .select("*")
          .in("inserat_id", inseratIds)
          .order("name", { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase
      .from(TABLES.todos)
      .select("*")
      .eq("vermieter_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const mieterList = (mieterData ?? []) as Mieter[];
  const todos = (todosData ?? []) as Todo[];

  return (
    <div>
      <Link
        href="/vermieter"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Vermieter
      </Link>

      <PageHeader
        title={vermieter.name}
        subtitle={vermieter.firma}
        actions={
          <Link href={`/vermieter/${id}/bearbeiten`}>
            <Button variant="secondary">Bearbeiten</Button>
          </Link>
        }
      />

      <Card className="mb-8">
        <CardBody>
          <StammdatenProfil
            title="Stammdaten"
            rows={[
              { label: "E-Mail", value: <a href={`mailto:${vermieter.email}`} className="text-navy hover:text-gold">{vermieter.email}</a> },
              { label: "Telefon", value: vermieter.telefon },
              {
                label: "Kontaktadresse",
                value: vermieter.adresse
                  ? `${vermieter.adresse}${vermieter.plz || vermieter.stadt ? `, ${[vermieter.plz, vermieter.stadt].filter(Boolean).join(" ")}` : ""}`
                  : null,
              },
              { label: "Beschreibung", value: vermieter.beschreibung },
              { label: "Notizen", value: vermieter.notizen },
            ]}
          />
        </CardBody>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <h2 className="font-display text-xl text-text-primary">Mieter in Objekten</h2>
        </CardHeader>
        <CardBody>
          {mieterList.length === 0 ? (
            <EmptyState>Keine Mieter in den verwalteten Objekten</EmptyState>
          ) : (
            <DataTable>
              <TableHead>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Objekt</TableHeaderCell>
                <TableHeaderCell>Einheit</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableHead>
              <TableBody>
                {mieterList.map((m) => {
                  const objekt = inseratList.find((i) => i.id === m.inserat_id);
                  return (
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
                        {objekt ? (
                          <Link
                            href={`/objekte/${objekt.id}`}
                            className="text-navy hover:text-gold"
                          >
                            {objekt.adresse}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {m.einheit_nr ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={{ type: "mieterStatus", value: m.status }} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </DataTable>
          )}
        </CardBody>
      </Card>

      <section className="mb-8">
        <h2 className="mb-4 font-display text-xl text-text-primary">Todos</h2>
        {todos.length === 0 ? (
          <EmptyState>Keine Todos für diesen Vermieter</EmptyState>
        ) : (
          <TodoKategorieBoard
            todos={todos}
            showDescription
            showStatusToggle
            showPartnerNachricht
            showEmailLink
            showZuordnung
          />
        )}
      </section>

      <Card>
        <CardHeader>
          <h2 className="font-display text-xl text-text-primary">Verwaltete Inserate</h2>
        </CardHeader>
        <CardBody>
          {inseratList.length === 0 ? (
            <EmptyState>
              Noch keine Inserate mit diesem Vermieter verknüpft
            </EmptyState>
          ) : (
            <DataTable>
              <TableHead>
                <TableHeaderCell>Adresse</TableHeaderCell>
                <TableHeaderCell>Typ</TableHeaderCell>
                <TableHeaderCell>Einheiten</TableHeaderCell>
              </TableHead>
              <TableBody>
                {inseratList.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <Link
                        href={`/objekte/${i.id}`}
                        className="font-medium text-navy hover:text-gold"
                      >
                        {i.adresse}
                      </Link>
                      <p className="text-xs text-text-hint">
                        {[i.plz, i.stadt].filter(Boolean).join(" ")}
                      </p>
                    </TableCell>
                    <TableCell>{inseratTypLabel(i.typ)}</TableCell>
                    <TableCell>{i.einheiten ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
