import { notFound } from "next/navigation";
import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import PartnerForm from "@/components/PartnerForm";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { loadGewerke } from "@/lib/gewerke-server";
import { TABLES } from "@/lib/supabase/tables";
import { type Inserat, type Partner } from "@/lib/types";

interface PartnerBearbeitenPageProps {
  params: Promise<{ id: string }>;
}

export default async function PartnerBearbeitenPage({
  params,
}: PartnerBearbeitenPageProps) {
  const { id } = await params;
  const { supabase } = await requireMitarbeiterPage();

  const [{ data }, { data: objekte }, { data: partnerObjekte }, gewerke] =
    await Promise.all([
      supabase.from(TABLES.partner).select("*").eq("id", id).maybeSingle(),
      supabase
        .from(TABLES.inserate)
        .select("id, adresse, stadt")
        .order("adresse", { ascending: true }),
      supabase
        .from(TABLES.partnerObjekte)
        .select("inserat_id")
        .eq("partner_id", id),
      loadGewerke(supabase),
    ]);

  if (!data) {
    notFound();
  }

  const partner = data as Partner;
  const selectedObjektIds = (partnerObjekte ?? []).map(
    (row) => row.inserat_id as string,
  );

  return (
    <div>
      <PageHeader title="Partner bearbeiten" subtitle={partner.firma} />
      <Card>
        <CardBody>
          <PartnerForm
            partner={partner}
            objekte={(objekte ?? []) as Pick<Inserat, "id" | "adresse" | "stadt">[]}
            selectedObjektIds={selectedObjektIds}
            gewerke={gewerke}
          />
        </CardBody>
      </Card>
    </div>
  );
}
