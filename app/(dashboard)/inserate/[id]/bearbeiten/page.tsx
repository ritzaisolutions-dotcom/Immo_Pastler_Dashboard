import { notFound } from "next/navigation";
import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import InseratForm from "@/components/InseratForm";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { TABLES } from "@/lib/supabase/tables";
import { type Inserat, type Vermieter } from "@/lib/types";

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

  const { data: vermieterData } = await supabase
    .from(TABLES.vermieter)
    .select("id, name, firma")
    .order("name", { ascending: true });

  const vermieter = (vermieterData ?? []) as Pick<Vermieter, "id" | "name" | "firma">[];

  return (
    <div>
      <PageHeader title="Inserat bearbeiten" subtitle={inserat.adresse} />
      <Card>
        <CardBody>
          <InseratForm inserat={inserat} vermieter={vermieter} />
        </CardBody>
      </Card>
    </div>
  );
}
