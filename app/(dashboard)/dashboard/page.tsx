import { createClient } from "@/utils/supabase/server";
import Badge from "@/components/Badge";
import TodoCard from "@/components/TodoCard";
import { formatDate, type TodoWithMieter } from "@/lib/types";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = todayIsoDate();

  const [
    { count: offenCount },
    { count: hochCount },
    { count: faelligCount },
    { count: aktivMieterCount },
    { data: recentTodos },
  ] = await Promise.all([
    supabase
      .from("todos")
      .select("*", { count: "exact", head: true })
      .eq("status", "offen"),
    supabase
      .from("todos")
      .select("*", { count: "exact", head: true })
      .eq("prioritaet", "hoch")
      .neq("status", "erledigt"),
    supabase
      .from("todos")
      .select("*", { count: "exact", head: true })
      .eq("faellig_at", today),
    supabase
      .from("mieter")
      .select("*", { count: "exact", head: true })
      .eq("status", "aktiv"),
    supabase
      .from("todos")
      .select("*, mieter(name)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const todos = (recentTodos ?? []) as TodoWithMieter[];

  return (
    <div>
      <h1 className="mb-8 font-display text-3xl text-text-primary">Dashboard</h1>

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Offene Todos" value={offenCount ?? 0} />
        <MetricCard label="Hohe Priorität" value={hochCount ?? 0} />
        <MetricCard label="Heute fällig" value={faelligCount ?? 0} />
        <MetricCard label="Aktive Mieter" value={aktivMieterCount ?? 0} />
      </div>

      <section>
        <h2 className="mb-4 font-display text-xl text-text-primary">
          Aktuelle Todos
        </h2>
        {todos.length === 0 ? (
          <p className="text-sm text-text-secondary">Keine offenen To-Dos</p>
        ) : (
          <div className="space-y-3">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-border bg-white p-4 rounded-[4px]"
              >
                <div>
                  <p className="font-medium text-text-primary">{todo.titel}</p>
                  <p className="mt-1 text-xs text-text-hint">
                    Fällig: {formatDate(todo.faellig_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {todo.kategorie && (
                    <Badge
                      variant={{ type: "kategorie", value: todo.kategorie }}
                    />
                  )}
                  <Badge
                    variant={{ type: "prioritaet", value: todo.prioritaet }}
                  />
                  <Badge variant={{ type: "status", value: todo.status }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border bg-white p-6 rounded-[4px]">
      <p className="font-display text-[38px] leading-none text-text-primary">
        {value}
      </p>
      <p className="mt-2 text-xs text-text-secondary">{label}</p>
    </div>
  );
}
