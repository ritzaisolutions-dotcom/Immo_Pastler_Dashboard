import { notFound } from "next/navigation";
import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import PartnerForm from "@/components/PartnerForm";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { TABLES } from "@/lib/supabase/tables";
import { type Partner } from "@/lib/types";

interface PartnerBearbeitenPageProps {
  params: Promise<{ id: string }>;
}

export default async function PartnerBearbeitenPage({
  params,
}: PartnerBearbeitenPageProps) {
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

  return (
    <div>
      <PageHeader title="Partner bearbeiten" subtitle={partner.firma} />
      <Card>
        <CardBody>
          <PartnerForm partner={partner} />
        </CardBody>
      </Card>
    </div>
  );
}
