import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import StammdatenProfil from "@/components/StammdatenProfil";
import Badge from "@/components/Badge";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { TABLES } from "@/lib/supabase/tables";
import { gewerkLabel, nachrichtStatusLabel, type Partner, type PartnerNachricht } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/DataTable";

interface PartnerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PartnerDetailPage({ params }: PartnerDetailPageProps) {
  const { id } = await params;
  const { supabase } = await requireMitarbeiterPage();

  const { data } = await supabase
    .from(TABLES.partner)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const partner = data as Partner;

  const { data: nachrichten } = await supabase
    .from(TABLES.partnerNachrichten)
    .select(`*, todo:${TABLES.todos}(id, titel, mieter_id, inserat_id)`)
    .eq("partner_id", id)
    .order("created_at", { ascending: false });

  const nachrichtList = (nachrichten ?? []) as (PartnerNachricht & {
    todo: { id: string; titel: string; mieter_id: string | null; inserat_id: string | null } | null;
  })[];

  const adresseZeile = [partner.adresse, [partner.plz, partner.stadt].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <Link
        href="/partner"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Partner
      </Link>
      <PageHeader
        title={partner.firma}
        subtitle={partner.ansprechpartner}
        actions={
          <Link href={`/partner/${id}/bearbeiten`}>
            <Button variant="secondary">Bearbeiten</Button>
          </Link>
        }
      />

      <Card className="mb-6">
        <CardBody>
          <StammdatenProfil
            title="Stammdaten"
            rows={[
              {
                label: "Gewerk",
                value: (
                  <span className="inline-flex items-center gap-2">
                    {gewerkLabel(partner.gewerk)}
                    <Badge variant={{ type: "partnerAktiv", value: partner.aktiv }} />
                  </span>
                ),
              },
              {
                label: "E-Mail",
                value: (
                  <a href={`mailto:${partner.email}`} className="text-navy hover:text-gold">
                    {partner.email}
                  </a>
                ),
              },
              { label: "Telefon", value: partner.telefon },
              { label: "Adresse", value: adresseZeile || null },
              { label: "Beschreibung", value: partner.beschreibung },
              { label: "Notizen", value: partner.notizen },
            ]}
          />
        </CardBody>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-display text-xl text-text-primary">Nachrichten & Aufträge</h2>
        </CardHeader>
        <CardBody>
          {nachrichtList.length === 0 ? (
            <EmptyState>Keine Partner-Nachrichten für diesen Partner</EmptyState>
          ) : (
            <DataTable>
              <TableHead>
                <TableHeaderCell>Betreff</TableHeaderCell>
                <TableHeaderCell>Todo</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Erstellt</TableHeaderCell>
              </TableHead>
              <TableBody>
                {nachrichtList.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="text-text-primary">{n.betreff}</TableCell>
                    <TableCell>
                      {n.todo ? (
                        <Link
                          href={
                            n.todo.mieter_id
                              ? `/todos?mieter_id=${n.todo.mieter_id}`
                              : n.todo.inserat_id
                                ? `/todos?inserat_id=${n.todo.inserat_id}`
                                : "/todos"
                          }
                          className="text-navy hover:text-gold"
                        >
                          {n.todo.titel}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {nachrichtStatusLabel(n.status)}
                    </TableCell>
                    <TableCell className="text-text-secondary">
                      {new Date(n.created_at).toLocaleDateString("de-DE")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
