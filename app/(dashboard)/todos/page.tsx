import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { isMitarbeiter } from "@/lib/auth-roles";
import { TABLES } from "@/lib/supabase/tables";
import TodoCard from "@/components/TodoCard";
import TodoFilterBar from "@/components/TodoFilterBar";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Card, CardBody } from "@/components/ui/Card";
import {
  type TodoWithMieterInserat,
  type TodoWithNachricht,
  type PartnerNachrichtWithPartner,
} from "@/lib/types";

interface TodosPageProps {
  searchParams: Promise<{
    kategorie?: string;
    status?: string;
    prioritaet?: string;
    sort?: string;
    mieter_id?: string;
    inserat_id?: string;
  }>;
}

export default async function TodosPage({ searchParams }: TodosPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const showDescription = isMitarbeiter(user);
  const showStatusToggle = isMitarbeiter(user);

  const sortColumn =
    params.sort === "faellig_at" ? "faellig_at" :
    params.sort === "titel" ? "titel" :
    "created_at";
  const sortAscending = params.sort === "titel" || params.sort === "faellig_at";

  let query = supabase
    .from(TABLES.todos)
    .select(
      `*, mieter:${TABLES.mieter}(id, name), inserat:${TABLES.inserate}(id, adresse, stadt)`,
    )
    .order(sortColumn, { ascending: sortAscending });

  if (params.kategorie) {
    query = query.eq("kategorie", params.kategorie);
  }
  if (params.status) {
    query = query.eq("status", params.status);
  }
  if (params.prioritaet) {
    query = query.eq("prioritaet", params.prioritaet);
  }
  if (params.mieter_id) {
    query = query.eq("mieter_id", params.mieter_id);
  }
  if (params.inserat_id) {
    query = query.eq("inserat_id", params.inserat_id);
  }

  const { data: todos } = await query;
  const items = (todos ?? []) as TodoWithMieterInserat[];

  let filterLabel: string | null = null;
  if (params.mieter_id) {
    const { data: m } = await supabase
      .from(TABLES.mieter)
      .select("name")
      .eq("id", params.mieter_id)
      .maybeSingle();
    filterLabel = m?.name
      ? `Mieter: ${m.name}`
      : `Mieter-ID: ${params.mieter_id}`;
  } else if (params.inserat_id) {
    const { data: i } = await supabase
      .from(TABLES.inserate)
      .select("adresse, stadt")
      .eq("id", params.inserat_id)
      .maybeSingle();
    filterLabel = i
      ? `Inserat: ${i.adresse}${i.stadt ? `, ${i.stadt}` : ""}`
      : `Inserat-ID: ${params.inserat_id}`;
  }

  let itemsWithNachricht: TodoWithMieterInserat[] | TodoWithNachricht[] = items;
  if (showStatusToggle && items.length > 0) {
    const todoIds = items.map((t) => t.id);
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

    itemsWithNachricht = items.map((todo) => ({
      ...todo,
      partner_nachricht: byTodo.get(todo.id) ?? null,
    })) as TodoWithNachricht[];
  }

  return (
    <div>
      <PageHeader title="Todos" />

      <Card className="mb-6">
        <CardBody>
          <Suspense fallback={null}>
            <TodoFilterBar />
          </Suspense>
        </CardBody>
      </Card>

      {filterLabel && (
        <p className="mb-4 text-sm text-text-secondary">
          Gefiltert nach {filterLabel}.{" "}
          <Link href="/todos" className="text-navy hover:text-gold">
            Filter zurücksetzen
          </Link>
        </p>
      )}

      {items.length === 0 ? (
        <EmptyState>Keine Todos gefunden</EmptyState>
      ) : (
        <div className="space-y-3">
          {itemsWithNachricht.map((todo) => (
            <TodoCard
              key={todo.id}
              todo={todo as TodoWithNachricht}
              showDescription={showDescription}
              showStatusToggle={showStatusToggle}
              showPartnerNachricht={showStatusToggle}
              showEmailLink={showStatusToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
