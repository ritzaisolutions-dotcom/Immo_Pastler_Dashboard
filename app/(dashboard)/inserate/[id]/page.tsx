import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import Badge from "@/components/Badge";
import TodoCard from "@/components/TodoCard";
import {
  TODO_KATEGORIEN,
  kategorieLabel,
  type Todo,
  type Mieter,
} from "@/lib/types";

interface InseratDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function InseratDetailPage({
  params,
}: InseratDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: inserat } = await supabase
    .from("inserate")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const [{ data: mieterList }, { data: todosList }] = await Promise.all([
    supabase
      .from("mieter")
      .select("*")
      .eq("inserat_id", id)
      .order("name", { ascending: true }),
    supabase
      .from("todos")
      .select("*")
      .eq("inserat_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const mieter = (mieterList ?? []) as Mieter[];
  const todos = (todosList ?? []) as Todo[];

  const todosByKategorie = TODO_KATEGORIEN.map((kategorie) => ({
    kategorie,
    items: todos.filter((t) => t.kategorie === kategorie),
  }));

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/inserate"
          className="text-sm text-text-secondary hover:text-navy"
        >
          ← Zurück zu Inserate
        </Link>
        <h1 className="mt-2 font-display text-3xl text-text-primary">
          {inserat
            ? `${inserat.adresse}${inserat.stadt ? `, ${inserat.stadt}` : ""}`
            : "Inserat"}
        </h1>
      </div>

      {!inserat ? (
        <p className="text-sm text-text-secondary">
          Keine Daten für dieses Inserat verfügbar.
        </p>
      ) : (
        <>
      <section className="mb-8 border border-border bg-white p-6 rounded-[4px]">
        <h2 className="mb-4 font-display text-xl text-text-primary">
          Eigentümer
        </h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-text-hint">Name</dt>
            <dd className="text-text-primary">
              {inserat.eigentuemer_name ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-text-hint">E-Mail</dt>
            <dd className="text-text-primary">
              {inserat.eigentuemer_email ?? "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 font-display text-xl text-text-primary">Mieter</h2>
        {mieter.length === 0 ? (
          <p className="text-sm text-text-secondary">Keine Mieter</p>
        ) : (
          <div className="overflow-hidden border border-border bg-white rounded-[4px]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-warm-white text-left text-xs uppercase tracking-wider text-text-hint">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">E-Mail</th>
                  <th className="px-4 py-3">Einheit</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {mieter.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {m.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {m.einheit_nr ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={{ type: "mieterStatus", value: m.status }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl text-text-primary">
          Statusboard
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {todosByKategorie.map(({ kategorie, items }) => (
            <div
              key={kategorie}
              className="border border-border bg-white p-4 rounded-[4px]"
            >
              <h3 className="mb-3 border-b border-border pb-2 font-medium text-text-primary">
                {kategorieLabel(kategorie)}
              </h3>
              {items.length === 0 ? (
                <p className="text-xs text-text-hint">Keine Todos</p>
              ) : (
                <div className="space-y-3">
                  {items.map((todo) => (
                    <TodoCard key={todo.id} todo={todo} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
        </>
      )}
    </div>
  );
}
