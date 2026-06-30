import { createClient } from "@/utils/supabase/server";
import { isMitarbeiter } from "@/lib/auth-roles";
import { TABLES } from "@/lib/supabase/tables";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import EmptyState from "@/components/ui/EmptyState";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import Badge from "@/components/Badge";
import { formatDate, type TodoWithMieter } from "@/lib/types";
import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CheckSquare,
  Users,
} from "lucide-react";

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const mitarbeiter = isMitarbeiter(user);
  const today = todayIsoDate();

  const [
    { count: offenCount },
    { count: hochCount },
    { count: faelligCount },
    { count: aktivMieterCount },
    { data: recentTodos },
  ] = await Promise.all([
    supabase
      .from(TABLES.todos)
      .select("*", { count: "exact", head: true })
      .eq("status", "offen"),
    supabase
      .from(TABLES.todos)
      .select("*", { count: "exact", head: true })
      .eq("prioritaet", "hoch")
      .neq("status", "erledigt"),
    supabase
      .from(TABLES.todos)
      .select("*", { count: "exact", head: true })
      .eq("faellig_at", today),
    supabase
      .from(TABLES.mieter)
      .select("*", { count: "exact", head: true })
      .eq("status", "aktiv"),
    supabase
      .from(TABLES.todos)
      .select(`*, mieter:${TABLES.mieter}(name)`)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const todos = (recentTodos ?? []) as TodoWithMieter[];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={
          !mitarbeiter
            ? "Eingeschränkter Lesezugriff (Eigentümer)"
            : undefined
        }
      />

      <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Offene Todos"
          value={offenCount ?? 0}
          icon={CheckSquare}
          href="/todos?status=offen"
        />
        <StatCard
          label="Hohe Priorität"
          value={hochCount ?? 0}
          icon={AlertTriangle}
          href="/todos?prioritaet=hoch"
        />
        <StatCard
          label="Heute fällig"
          value={faelligCount ?? 0}
          icon={Calendar}
          href="/todos"
        />
        <StatCard
          label="Aktive Mieter"
          value={aktivMieterCount ?? 0}
          icon={Users}
          href="/mieter"
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-text-primary">
              Aktuelle Todos
            </h2>
            <Link href="/todos" className="text-xs text-navy hover:text-gold">
              Alle anzeigen →
            </Link>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {todos.length === 0 ? (
            <div className="px-6 py-8">
              <EmptyState>Keine offenen To-Dos</EmptyState>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition-colors hover:bg-warm-white/50"
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
        </CardBody>
      </Card>
    </div>
  );
}
