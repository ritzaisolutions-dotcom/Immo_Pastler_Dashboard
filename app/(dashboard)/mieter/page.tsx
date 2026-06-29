import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { isMitarbeiter } from "@/lib/auth-roles";
import { TABLES } from "@/lib/supabase/tables";
import Badge from "@/components/Badge";
import MieterSearch from "@/components/MieterSearch";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/DataTable";
import { splitName, type MieterWithInserat } from "@/lib/types";

interface MieterPageProps {
  searchParams: Promise<{ q?: string }>;
}

type MieterRow = MieterWithInserat & {
  wohneinheit: { nummer: string } | null;
};

export default async function MieterPage({ searchParams }: MieterPageProps) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const mitarbeiter = isMitarbeiter(user);

  let query = supabase
    .from(TABLES.mieter)
    .select(
      `*, inserat:${TABLES.inserate}(adresse, stadt), wohneinheit:${TABLES.wohneinheiten}(nummer)`,
    )
    .order("name", { ascending: true });

  if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data: mieterList } = await query;
  const mieter = (mieterList ?? []) as MieterRow[];

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
      <PageHeader
        title="Mieter"
        actions={
          mitarbeiter ? (
            <Link
              href="/mieter/neu"
              className="inline-flex items-center justify-center rounded-[4px] bg-navy px-4 py-2 text-sm text-white transition-colors hover:bg-navy-mid"
            >
              Neuer Mieter
            </Link>
          ) : undefined
        }
      />

      <div className="mb-6">
        <MieterSearch initialQuery={q ?? ""} />
      </div>

      {mieter.length === 0 ? (
        <EmptyState>Keine Mieter gefunden</EmptyState>
      ) : (
        <DataTable>
          <TableHead>
            <TableHeaderCell>Vorname</TableHeaderCell>
            <TableHeaderCell>Nachname</TableHeaderCell>
            <TableHeaderCell>E-Mail (Match-Key)</TableHeaderCell>
            <TableHeaderCell>Wohnung</TableHeaderCell>
            <TableHeaderCell>Objekt</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Offene Todos</TableHeaderCell>
          </TableHead>
          <TableBody>
            {mieter.map((m, index) => {
              const { vorname, nachname } = splitName(m.name);
              const wohnung =
                m.wohneinheit?.nummer ?? m.einheit_nr ?? "—";
              return (
                <TableRow key={m.id}>
                  <TableCell>
                    <Link
                      href={`/mieter/${m.id}`}
                      className="font-medium text-navy hover:text-gold"
                    >
                      {vorname || "—"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {nachname || "—"}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {m.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-text-secondary">{wohnung}</TableCell>
                  <TableCell className="text-text-secondary">
                    {m.inserat && m.inserat_id ? (
                      <Link
                        href={`/objekte/${m.inserat_id}`}
                        className="text-navy hover:text-gold"
                      >
                        {m.inserat.adresse}
                        {m.inserat.stadt ? `, ${m.inserat.stadt}` : ""}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={{ type: "mieterStatus", value: m.status }} />
                  </TableCell>
                  <TableCell>
                    {openTodoCounts[index] > 0 ? (
                      <Link
                        href={`/todos?mieter_id=${m.id}`}
                        className="inline-block rounded-[4px] bg-gold-pale px-2 py-0.5 text-xs font-medium text-warning hover:opacity-90"
                      >
                        {openTodoCounts[index]}
                      </Link>
                    ) : (
                      <span className="text-text-hint">0</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </DataTable>
      )}
    </div>
  );
}
