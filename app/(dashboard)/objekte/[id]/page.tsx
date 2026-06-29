import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { isMitarbeiter } from "@/lib/auth-roles";
import { loadGewerke } from "@/lib/gewerke-server";
import { TABLES } from "@/lib/supabase/tables";
import Badge from "@/components/Badge";
import ObjektPhotoUpload from "@/components/ObjektPhotoUpload";
import ObjektPartnerGewerkPanel from "@/components/ObjektPartnerGewerkPanel";
import StammdatenProfil from "@/components/StammdatenProfil";
import TodoKategorieBoard from "@/components/TodoKategorieBoard";
import EmptyState from "@/components/ui/EmptyState";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import {
  inseratTypLabel,
  type InseratWithVermieter,
  type Mieter,
  type Gewerk,
  type Partner,
  type Todo,
  type TodoWithNachricht,
  type PartnerNachrichtWithPartner,
  type Wohneinheit,
} from "@/lib/types";

interface ObjektDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ObjektDetailPage({ params }: ObjektDetailPageProps) {
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

  const objekt = inseratData as InseratWithVermieter;

  const [
    { data: wohneinheitenList },
    { data: mieterList },
    { data: todosList },
    { data: partnerGewerkList },
    { data: partnersList },
    gewerke,
  ] = await Promise.all([
    supabase
      .from(TABLES.wohneinheiten)
      .select("*")
      .eq("inserat_id", id)
      .order("sort_order", { ascending: true }),
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
    supabase.from(TABLES.objektPartnerGewerk).select("*").eq("inserat_id", id),
    mitarbeiter
      ? supabase.from(TABLES.partner).select("id, firma, gewerk, aktiv").eq("aktiv", true)
      : Promise.resolve({ data: [] as Partner[] }),
    mitarbeiter ? loadGewerke(supabase) : Promise.resolve([] as Gewerk[]),
  ]);

  const wohneinheiten = (wohneinheitenList ?? []) as Wohneinheit[];
  const mieter = (mieterList ?? []) as Mieter[];
  let todos = (todosList ?? []) as Todo[];

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

  const mieterByWohnung = new Map<string, Mieter>();
  for (const m of mieter) {
    if (m.wohneinheit_id) mieterByWohnung.set(m.wohneinheit_id, m);
  }

  const openTodosByMieter = new Map<string, number>();
  for (const t of todos) {
    if (t.status !== "erledigt" && t.mieter_id) {
      openTodosByMieter.set(
        t.mieter_id,
        (openTodosByMieter.get(t.mieter_id) ?? 0) + 1,
      );
    }
  }

  const subtitle = [
    objekt.stadt,
    objekt.typ ? inseratTypLabel(objekt.typ) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div>
      <p className="mb-4">
        <Link href="/objekte" className="text-sm text-text-secondary hover:text-navy">
          ← Zurück zu Objekte
        </Link>
      </p>

      <div className="mb-6">
        <h1 className="font-display text-3xl text-burgundy">{objekt.adresse}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
        )}
        {mitarbeiter && (
          <Link
            href={`/objekte/${id}/bearbeiten`}
            className="mt-2 inline-block text-sm text-navy hover:text-gold"
          >
            Stammdaten bearbeiten
          </Link>
        )}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {mitarbeiter && (
          <Card>
            <CardHeader>
              <h3 className="font-medium text-text-primary">Objektfoto</h3>
            </CardHeader>
            <CardBody>
              <ObjektPhotoUpload objektId={id} currentUrl={objekt.bild_url} />
            </CardBody>
          </Card>
        )}

        <Card className={mitarbeiter ? "" : "lg:col-span-2"}>
          <CardBody>
            <StammdatenProfil
              title="Stammdaten"
              subtitle={[objekt.adresse, objekt.plz, objekt.stadt]
                .filter(Boolean)
                .join(", ")}
              rows={[
                {
                  label: "Typ",
                  value: (
                    <Badge variant={{ type: "inseratTyp", value: objekt.typ }} />
                  ),
                },
                { label: "Einheiten", value: objekt.einheiten },
                {
                  label: "Vermieter",
                  value: objekt.vermieter ? (
                    <Link
                      href={`/vermieter/${objekt.vermieter.id}`}
                      className="text-navy hover:text-gold"
                    >
                      {objekt.vermieter.name}
                    </Link>
                  ) : (
                    objekt.eigentuemer_name
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
      </div>

      {mitarbeiter && (
        <Card className="mb-8">
          <CardHeader>
            <h3 className="font-medium text-text-primary">Partner pro Kategorie</h3>
          </CardHeader>
          <CardBody>
            <ObjektPartnerGewerkPanel
              objektId={id}
              assignments={(partnerGewerkList ?? []).map((row) => ({
                gewerk: row.gewerk as string,
                partner_id: row.partner_id,
              }))}
              partners={(partnersList ?? []) as Partner[]}
              gewerke={gewerke}
            />
          </CardBody>
        </Card>
      )}

      <section className="mb-8">
        <h2 className="mb-4 font-display text-xl text-text-primary">
          Wohneinheiten
        </h2>
        {wohneinheiten.length === 0 ? (
          <EmptyState>Keine Wohneinheiten hinterlegt</EmptyState>
        ) : (
          <div className="space-y-3">
            {wohneinheiten.map((we) => {
              const m = mieterByWohnung.get(we.id);
              const openCount = m ? (openTodosByMieter.get(m.id) ?? 0) : 0;
              return (
                <Card key={we.id}>
                  <CardBody className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-text-primary">
                        {we.nummer}
                        {we.bezeichnung ? ` — ${we.bezeichnung}` : ""}
                      </p>
                      {m ? (
                        <p className="text-sm text-text-secondary">
                          Mieter:{" "}
                          <Link
                            href={`/mieter/${m.id}`}
                            className="text-navy hover:text-gold"
                          >
                            {m.name}
                          </Link>
                        </p>
                      ) : (
                        <p className="text-sm text-text-hint">Kein Mieter</p>
                      )}
                    </div>
                    {openCount > 0 && (
                      <span className="rounded-[4px] bg-gold-pale px-2 py-0.5 text-xs font-medium text-warning">
                        {openCount} offene Todos
                      </span>
                    )}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl text-text-primary">Statusboard</h2>
        {todos.length === 0 ? (
          <EmptyState>Keine Todos für dieses Objekt</EmptyState>
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
