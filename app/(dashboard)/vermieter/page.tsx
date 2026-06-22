import Link from "next/link";
import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import { TABLES } from "@/lib/supabase/tables";
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
import { type Vermieter } from "@/lib/types";
import { UserCircle } from "lucide-react";

export default async function VermieterPage() {
  const { supabase } = await requireMitarbeiterPage();

  const { data } = await supabase
    .from(TABLES.vermieter)
    .select("*")
    .order("name", { ascending: true });

  const vermieterList = (data ?? []) as Vermieter[];

  const inseratCounts = new Map<string, number>();
  if (vermieterList.length > 0) {
    const ids = vermieterList.map((v) => v.id);
    const { data: inserate } = await supabase
      .from(TABLES.inserate)
      .select("vermieter_id")
      .in("vermieter_id", ids);
    for (const row of inserate ?? []) {
      if (row.vermieter_id) {
        inseratCounts.set(
          row.vermieter_id,
          (inseratCounts.get(row.vermieter_id) ?? 0) + 1,
        );
      }
    }
  }

  return (
    <div>
      <PageHeader
        title="Vermieter"
        actions={
          <Link
            href="/vermieter/neu"
            className="inline-flex items-center justify-center rounded-[4px] bg-navy px-4 py-2 text-sm text-white transition-colors hover:bg-navy-mid"
          >
            Neuer Vermieter
          </Link>
        }
      />

      {vermieterList.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          action={{ label: "Vermieter anlegen", href: "/vermieter/neu" }}
        >
          Keine Vermieter angelegt
        </EmptyState>
      ) : (
        <DataTable>
          <TableHead>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Kontakt</TableHeaderCell>
            <TableHeaderCell>Adresse</TableHeaderCell>
            <TableHeaderCell>Inserate</TableHeaderCell>
          </TableHead>
          <TableBody>
            {vermieterList.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <Link
                    href={`/vermieter/${v.id}`}
                    className="font-medium text-navy hover:text-gold"
                  >
                    {v.name}
                  </Link>
                  {v.firma && (
                    <p className="text-xs text-text-hint">{v.firma}</p>
                  )}
                </TableCell>
                <TableCell className="text-text-secondary">
                  <a href={`mailto:${v.email}`} className="hover:text-navy">
                    {v.email}
                  </a>
                  {v.telefon && <p className="text-xs">{v.telefon}</p>}
                </TableCell>
                <TableCell className="text-text-secondary">
                  {v.adresse ? (
                    <>
                      {v.adresse}
                      {(v.plz || v.stadt) && (
                        <p className="text-xs">
                          {[v.plz, v.stadt].filter(Boolean).join(" ")}
                        </p>
                      )}
                    </>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>{inseratCounts.get(v.id) ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}
    </div>
  );
}
