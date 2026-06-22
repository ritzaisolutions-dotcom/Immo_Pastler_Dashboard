import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { isMitarbeiter } from "@/lib/auth-roles";
import { TABLES } from "@/lib/supabase/tables";
import Badge from "@/components/Badge";
import InseratAvatar from "@/components/InseratAvatar";
import InserateSearchInput from "@/components/InserateSearchInput";
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
import { Building2 } from "lucide-react";
import { type Inserat } from "@/lib/types";

interface InseratePageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function InseratePage({ searchParams }: InseratePageProps) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const mitarbeiter = isMitarbeiter(user);

  let inserateQuery = supabase
    .from(TABLES.inserate)
    .select("*")
    .order("adresse", { ascending: true });

  if (q) {
    inserateQuery = inserateQuery.or(`adresse.ilike.%${q}%,stadt.ilike.%${q}%`);
  }

  const { data: inserateList } = await inserateQuery;
  const inserate = (inserateList ?? []) as Inserat[];

  const enriched = await Promise.all(
    inserate.map(async (inserat) => {
      const [{ count: mieterCount }, { count: openTodosCount }] =
        await Promise.all([
          supabase
            .from(TABLES.mieter)
            .select("*", { count: "exact", head: true })
            .eq("inserat_id", inserat.id),
          supabase
            .from(TABLES.todos)
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
      <PageHeader
        title="Inserate"
        actions={
          mitarbeiter ? (
            <Link
              href="/inserate/neu"
              className="inline-flex items-center justify-center rounded-[4px] bg-navy px-4 py-2 text-sm text-white transition-colors hover:bg-navy-mid"
            >
              Neues Inserat
            </Link>
          ) : undefined
        }
      />

      <div className="mb-4">
        <Suspense fallback={null}>
          <InserateSearchInput />
        </Suspense>
      </div>

      {enriched.length === 0 ? (
        <EmptyState icon={Building2}>
          {q ? `Keine Inserate für „${q}" gefunden` : "Keine Inserate gefunden"}
        </EmptyState>
      ) : (
        <DataTable>
          <TableHead>
            <TableHeaderCell className="w-14">
              <span className="sr-only">Bild</span>
            </TableHeaderCell>
            <TableHeaderCell>Adresse</TableHeaderCell>
            <TableHeaderCell>Typ</TableHeaderCell>
            <TableHeaderCell>Mieter</TableHeaderCell>
            <TableHeaderCell>Offene Todos</TableHeaderCell>
          </TableHead>
          <TableBody>
            {enriched.map((inserat) => (
              <TableRow key={inserat.id}>
                <TableCell>
                  <InseratAvatar
                    adresse={inserat.adresse}
                    bildUrl={inserat.bild_url}
                    href={`/inserate/${inserat.id}`}
                  />
                </TableCell>
                <TableCell>
                  <Link
                    href={`/inserate/${inserat.id}`}
                    className="font-medium text-navy hover:text-gold"
                  >
                    {inserat.adresse}
                    {inserat.stadt ? `, ${inserat.stadt}` : ""}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={{ type: "inseratTyp", value: inserat.typ }}
                  />
                </TableCell>
                <TableCell className="text-text-secondary">
                  {inserat.mieterCount}
                </TableCell>
                <TableCell>
                  {inserat.openTodosCount > 0 ? (
                    <Link
                      href={`/todos?inserat_id=${inserat.id}`}
                      className="inline-block rounded-[4px] bg-gold-pale px-2 py-0.5 text-xs font-medium text-warning hover:opacity-90"
                    >
                      {inserat.openTodosCount}
                    </Link>
                  ) : (
                    <span className="text-text-hint">0</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}
    </div>
  );
}
