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
import Badge from "@/components/Badge";
import { gewerkLabel, type Partner } from "@/lib/types";
import { Handshake } from "lucide-react";

export default async function PartnerPage() {
  const { supabase } = await requireMitarbeiterPage();

  const { data } = await supabase
    .from(TABLES.partner)
    .select("*")
    .order("firma", { ascending: true });

  const partners = (data ?? []) as Partner[];

  return (
    <div>
      <PageHeader
        title="Partner"
        actions={
          <Link
            href="/partner/neu"
            className="inline-flex items-center justify-center rounded-[4px] bg-navy px-4 py-2 text-sm text-white transition-colors hover:bg-navy-mid"
          >
            Neuer Partner
          </Link>
        }
      />

      {partners.length === 0 ? (
        <EmptyState icon={Handshake} action={{ label: "Partner anlegen", href: "/partner/neu" }}>
          Keine Partner angelegt
        </EmptyState>
      ) : (
        <DataTable>
          <TableHead>
            <TableHeaderCell>Firma</TableHeaderCell>
            <TableHeaderCell>Gewerk</TableHeaderCell>
            <TableHeaderCell>Kontakt</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
          </TableHead>
          <TableBody>
            {partners.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <Link
                    href={`/partner/${p.id}`}
                    className="font-medium text-navy hover:text-gold"
                  >
                    {p.firma}
                  </Link>
                  {p.ansprechpartner && (
                    <p className="text-xs text-text-hint">{p.ansprechpartner}</p>
                  )}
                </TableCell>
                <TableCell className="text-text-secondary">
                  {gewerkLabel(p.gewerk)}
                </TableCell>
                <TableCell className="text-text-secondary">
                  <a href={`mailto:${p.email}`} className="hover:text-navy">
                    {p.email}
                  </a>
                  {p.telefon && <p className="text-xs">{p.telefon}</p>}
                </TableCell>
                <TableCell>
                  <Badge variant={{ type: "partnerAktiv", value: p.aktiv }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}
    </div>
  );
}
