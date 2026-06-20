import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { TABLES } from "@/lib/supabase/tables";
import Badge from "@/components/Badge";
import MieterSearch from "@/components/MieterSearch";
import { type MieterWithInserat } from "@/lib/types";

interface MieterPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function MieterPage({ searchParams }: MieterPageProps) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from(TABLES.mieter)
    .select(`*, inserat:${TABLES.inserate}(adresse, stadt)`)
    .order("name", { ascending: true });

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data: mieterList } = await query;
  const mieter = (mieterList ?? []) as MieterWithInserat[];

  const openTodoCounts = await Promise.all(
    mieter.map(async (m) => {
      const { count } = await supabase
        .from(TABLES.todos)
        .select("*", { count: "exact", head: true })
        .eq("mieter_id", m.id)
        .neq("status", "erledigt");
      return count ?? 0;
    }),
  );

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl text-text-primary">Mieter</h1>

      <MieterSearch initialQuery={q ?? ""} />

      {mieter.length === 0 ? (
        <p className="mt-6 text-sm text-text-secondary">Keine Mieter gefunden</p>
      ) : (
        <div className="mt-6 overflow-hidden border border-border bg-white rounded-[4px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-warm-white text-left text-xs uppercase tracking-wider text-text-hint">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">E-Mail</th>
                <th className="px-4 py-3">Inserat</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Offene Todos</th>
              </tr>
            </thead>
            <tbody>
              {mieter.map((m, index) => (
                <tr
                  key={m.id}
                  className="border-b border-border last:border-0 hover:bg-warm-white/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/todos?mieter_id=${m.id}`}
                      className="font-medium text-navy hover:text-gold"
                    >
                      {m.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {m.email ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {m.inserat
                      ? `${m.inserat.adresse}, ${m.inserat.stadt ?? ""}${m.einheit_nr ? ` · ${m.einheit_nr}` : ""}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={{ type: "mieterStatus", value: m.status }} />
                  </td>
                  <td className="px-4 py-3">
                    {openTodoCounts[index] > 0 ? (
                      <span className="inline-block bg-gold-pale px-2 py-0.5 text-xs font-medium text-warning rounded-[4px]">
                        {openTodoCounts[index]}
                      </span>
                    ) : (
                      <span className="text-text-hint">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
