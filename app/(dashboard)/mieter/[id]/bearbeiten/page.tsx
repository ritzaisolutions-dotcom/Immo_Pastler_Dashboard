import { notFound } from "next/navigation";
import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import MieterForm from "@/components/MieterForm";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { TABLES } from "@/lib/supabase/tables";
import { type Inserat, type Mieter, type Wohneinheit } from "@/lib/types";

interface MieterBearbeitenPageProps {
  params: Promise<{ id: string }>;
}

export default async function MieterBearbeitenPage({
  params,
}: MieterBearbeitenPageProps) {
  const { id } = await params;
  const { supabase } = await requireMitarbeiterPage();

  const [{ data: mieterData }, { data: inserateList }, { data: wohneinheitenList }] =
    await Promise.all([
      supabase.from(TABLES.mieter).select("*").eq("id", id).maybeSingle(),
      supabase
        .from(TABLES.inserate)
        .select("id, adresse, stadt")
        .order("adresse", { ascending: true }),
      supabase
        .from(TABLES.wohneinheiten)
        .select("id, inserat_id, nummer, bezeichnung, sort_order")
        .order("sort_order", { ascending: true }),
    ]);

  if (!mieterData) {
    notFound();
  }

  const mieter = mieterData as Mieter;
  const inserate = (inserateList ?? []) as Pick<Inserat, "id" | "adresse" | "stadt">[];
  const wohneinheiten = (wohneinheitenList ?? []) as Wohneinheit[];

  return (
    <div>
      <PageHeader title="Mieter bearbeiten" subtitle={mieter.name} />
      <Card>
        <CardBody>
          <MieterForm mieter={mieter} inserate={inserate} wohneinheiten={wohneinheiten} />
        </CardBody>
      </Card>
    </div>
  );
}
