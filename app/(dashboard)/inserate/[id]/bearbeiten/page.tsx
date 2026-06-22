import { notFound } from "next/navigation";
import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import InseratForm from "@/components/InseratForm";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { TABLES } from "@/lib/supabase/tables";
import { type Inserat } from "@/lib/types";

interface InseratBearbeitenPageProps {
  params: Promise<{ id: string }>;
}

export default async function InseratBearbeitenPage({
  params,
}: InseratBearbeitenPageProps) {
  const { id } = await params;
  const { supabase } = await requireMitarbeiterPage();

  const { data } = await supabase
    .from(TABLES.inserate)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const inserat = data as Inserat;

  return (
    <div>
      <PageHeader title="Inserat bearbeiten" subtitle={inserat.adresse} />
      <Card>
        <CardBody>
          <InseratForm inserat={inserat} />
        </CardBody>
      </Card>
    </div>
  );
}
