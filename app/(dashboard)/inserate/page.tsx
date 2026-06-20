import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import Badge from "@/components/Badge";

export default async function InseratePage() {
  const supabase = await createClient();

  const { data: inserateList } = await supabase
    .from("inserate")
    .select("*")
    .order("adresse", { ascending: true });

  const inserate = inserateList ?? [];

  const enriched = await Promise.all(
    inserate.map(async (inserat) => {
      const [{ count: mieterCount }, { count: openTodosCount }] =
        await Promise.all([
          supabase
            .from("mieter")
            .select("*", { count: "exact", head: true })
            .eq("inserat_id", inserat.id),
          supabase
            .from("todos")
            .select("*", { count: "exact", head: true })
            .eq("inserat_id", inserat.id)
            .neq("status", "erledigt"),
        ]);

      return {
        ...inserat,
        mieterCount: mieterCount ?? 0,
        openTodosCount: openTodosCount ?? 0,
      };
    }),
  );

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl text-text-primary">Inserate</h1>

      {enriched.length === 0 ? (
        <p className="text-sm text-text-secondary">Keine Inserate gefunden</p>
      ) : (
        <div className="overflow-hidden border border-border bg-white rounded-[4px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-warm-white text-left text-xs uppercase tracking-wider text-text-hint">
                <th className="px-4 py-3">Adresse</th>
                <th className="px-4 py-3">Typ</th>
                <th className="px-4 py-3">Mieter</th>
                <th className="px-4 py-3">Offene Todos</th>
              </tr>
            </thead>
            <tbody>
              {enriched.map((inserat) => (
                <tr
                  key={inserat.id}
                  className="border-b border-border last:border-0 hover:bg-warm-white/50"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/inserate/${inserat.id}`}
                      className="font-medium text-navy hover:text-gold"
                    >
                      {inserat.adresse}
                      {inserat.stadt ? `, ${inserat.stadt}` : ""}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={{ type: "inseratTyp", value: inserat.typ }}
                    />
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {inserat.mieterCount}
                  </td>
                  <td className="px-4 py-3">
                    {inserat.openTodosCount > 0 ? (
                      <span className="inline-block bg-gold-pale px-2 py-0.5 text-xs font-medium text-warning rounded-[4px]">
                        {inserat.openTodosCount}
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
