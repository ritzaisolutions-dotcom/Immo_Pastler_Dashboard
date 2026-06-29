import Link from "next/link";
import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import { loadGewerke } from "@/lib/gewerke-server";
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
import {
  anredeFormLabel,
  gewerkLabel,
  type Partner,
} from "@/lib/types";
import { Handshake } from "lucide-react";

export default async function PartnerPage() {
  const { supabase } = await requireMitarbeiterPage();

  const [{ data }, { data: partnerObjekte }, gewerke] = await Promise.all([
    supabase.from(TABLES.partner).select("*").order("firma", { ascending: true }),
    supabase
      .from(TABLES.partnerObjekte)
      .select(`partner_id, inserat:${TABLES.inserate}(adresse)`),
    loadGewerke(supabase),
  ]);

  const partners = (data ?? []) as Partner[];

  const objekteByPartner = new Map<string, string[]>();
  for (const row of partnerObjekte ?? []) {
    const partnerId = row.partner_id as string;
    const inseratRaw = row.inserat as { adresse: string } | { adresse: string }[] | null;
    const inserat = Array.isArray(inseratRaw) ? inseratRaw[0] : inseratRaw;
    if (!inserat?.adresse) continue;
    const list = objekteByPartner.get(partnerId) ?? [];
    list.push(inserat.adresse);
    objekteByPartner.set(partnerId, list);
  }

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
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Firma</TableHeaderCell>
            <TableHeaderCell>Gewerk</TableHeaderCell>
            <TableHeaderCell>Kontakt</TableHeaderCell>
            <TableHeaderCell>Einsatzgebiet</TableHeaderCell>
            <TableHeaderCell>Objekte</TableHeaderCell>
            <TableHeaderCell>Anrede</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
          </TableHead>
          <TableBody>
            {partners.map((p) => {
              const objektAdressen = objekteByPartner.get(p.id) ?? [];
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link
                      href={`/partner/${p.id}`}
                      className="font-medium text-navy hover:text-gold"
                    >
                      {p.ansprechpartner ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell className="text-text-secondary">{p.firma}</TableCell>
                  <TableCell className="text-text-secondary">
                    {gewerkLabel(p.gewerk, gewerke)}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    <a href={`mailto:${p.email}`} className="hover:text-navy">
                      {p.email}
                    </a>
                    {p.telefon && <p className="text-xs">{p.telefon}</p>}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {p.einsatzgebiet ?? "—"}
                  </TableCell>
                  <TableCell className="max-w-[180px] text-sm text-text-secondary">
                    {objektAdressen.length > 0
                      ? objektAdressen.join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {anredeFormLabel(p.anrede_form ?? "sie")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={{ type: "partnerAktiv", value: p.aktiv }} />
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
