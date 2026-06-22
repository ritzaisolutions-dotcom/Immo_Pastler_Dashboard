import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import { TABLES } from "@/lib/supabase/tables";
import PageHeader from "@/components/ui/PageHeader";
import StammdatenProfil from "@/components/StammdatenProfil";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import {
  DataTable,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/DataTable";
import { inseratTypLabel, type Inserat, type Vermieter } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

interface VermieterDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function VermieterDetailPage({ params }: VermieterDetailPageProps) {
  const { id } = await params;
  const { supabase } = await requireMitarbeiterPage();

  const { data } = await supabase
    .from(TABLES.vermieter)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const vermieter = data as Vermieter;

  const { data: inserate } = await supabase
    .from(TABLES.inserate)
    .select("*")
    .eq("vermieter_id", id)
    .order("adresse", { ascending: true });

  const inseratList = (inserate ?? []) as Inserat[];

  return (
    <div>
      <Link
        href="/vermieter"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Vermieter
      </Link>

      <PageHeader
        title={vermieter.name}
        subtitle={vermieter.firma}
        actions={
          <Link href={`/vermieter/${id}/bearbeiten`}>
            <Button variant="secondary">Bearbeiten</Button>
          </Link>
        }
      />

      <Card className="mb-8">
        <CardBody>
          <StammdatenProfil
            title="Stammdaten"
            rows={[
              { label: "E-Mail", value: <a href={`mailto:${vermieter.email}`} className="text-navy hover:text-gold">{vermieter.email}</a> },
              { label: "Telefon", value: vermieter.telefon },
              {
                label: "Kontaktadresse",
                value: vermieter.adresse
                  ? `${vermieter.adresse}${vermieter.plz || vermieter.stadt ? `, ${[vermieter.plz, vermieter.stadt].filter(Boolean).join(" ")}` : ""}`
                  : null,
              },
              { label: "Beschreibung", value: vermieter.beschreibung },
              { label: "Notizen", value: vermieter.notizen },
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-display text-xl text-text-primary">Verwaltete Inserate</h2>
        </CardHeader>
        <CardBody>
          {inseratList.length === 0 ? (
            <EmptyState>
              Noch keine Inserate mit diesem Vermieter verknüpft
            </EmptyState>
          ) : (
            <DataTable>
              <TableHead>
                <TableHeaderCell>Adresse</TableHeaderCell>
                <TableHeaderCell>Typ</TableHeaderCell>
                <TableHeaderCell>Einheiten</TableHeaderCell>
              </TableHead>
              <TableBody>
                {inseratList.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <Link
                        href={`/inserate/${i.id}`}
                        className="font-medium text-navy hover:text-gold"
                      >
                        {i.adresse}
                      </Link>
                      <p className="text-xs text-text-hint">
                        {[i.plz, i.stadt].filter(Boolean).join(" ")}
                      </p>
                    </TableCell>
                    <TableCell>{inseratTypLabel(i.typ)}</TableCell>
                    <TableCell>{i.einheiten ?? "—"}</TableCell>
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
