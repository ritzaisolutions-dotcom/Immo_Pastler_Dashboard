import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import PartnerForm from "@/components/PartnerForm";
import StammdatenProfil from "@/components/StammdatenProfil";
import Badge from "@/components/Badge";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { TABLES } from "@/lib/supabase/tables";
import { gewerkLabel, type Partner } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

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
      <PageHeader title={partner.firma} subtitle={partner.ansprechpartner} />

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

      <Card>
        <CardHeader>
          <h2 className="font-medium text-text-primary">Bearbeiten</h2>
        </CardHeader>
        <CardBody>
          <PartnerForm partner={partner} />
        </CardBody>
      </Card>
    </div>
  );
}
