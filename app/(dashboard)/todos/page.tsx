import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import TodoCard from "@/components/TodoCard";
import TodoFilterBar from "@/components/TodoFilterBar";
import { type TodoWithMieter } from "@/lib/types";

interface TodosPageProps {
  searchParams: Promise<{
    kategorie?: string;
    status?: string;
    prioritaet?: string;
    mieter_id?: string;
  }>;
}

export default async function TodosPage({ searchParams }: TodosPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("todos")
    .select("*, mieter(name)")
    .order("created_at", { ascending: false });

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

  const { data: todos } = await query;
  const items = (todos ?? []) as TodoWithMieter[];

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl text-text-primary">Todos</h1>

      <Suspense fallback={null}>
        <TodoFilterBar />
      </Suspense>

      {params.mieter_id && (
        <p className="mb-4 text-sm text-text-secondary">
          Gefiltert nach Mieter-ID: {params.mieter_id}
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-text-secondary">Keine Todos gefunden</p>
      ) : (
        <div className="space-y-3">
          {items.map((todo) => (
            <TodoCard key={todo.id} todo={todo} />
          ))}
        </div>
      )}
    </div>
  );
}
