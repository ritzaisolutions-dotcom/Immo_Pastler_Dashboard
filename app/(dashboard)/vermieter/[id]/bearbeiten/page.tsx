import { notFound } from "next/navigation";
import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import VermieterForm from "@/components/VermieterForm";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { TABLES } from "@/lib/supabase/tables";
import { type Vermieter } from "@/lib/types";

interface VermieterBearbeitenPageProps {
  params: Promise<{ id: string }>;
}

export default async function VermieterBearbeitenPage({
  params,
}: VermieterBearbeitenPageProps) {
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

  return (
    <div>
      <PageHeader title="Vermieter bearbeiten" subtitle={vermieter.name} />
      <Card>
        <CardBody>
          <VermieterForm vermieter={vermieter} />
        </CardBody>
      </Card>
    </div>
  );
}
