import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import MieterForm from "@/components/MieterForm";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { TABLES } from "@/lib/supabase/tables";
import { type Inserat, type Wohneinheit } from "@/lib/types";

interface MieterNeuPageProps {
  searchParams: Promise<{ inserat_id?: string }>;
}

export default async function MieterNeuPage({ searchParams }: MieterNeuPageProps) {
  const { inserat_id } = await searchParams;
  const { supabase } = await requireMitarbeiterPage();

  const [{ data: inserateList }, { data: wohneinheitenList }] = await Promise.all([
    supabase
      .from(TABLES.inserate)
      .select("id, adresse, stadt")
      .order("adresse", { ascending: true }),
    supabase
      .from(TABLES.wohneinheiten)
      .select("id, inserat_id, nummer, bezeichnung, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  const inserate = (inserateList ?? []) as Pick<Inserat, "id" | "adresse" | "stadt">[];
  const wohneinheiten = (wohneinheitenList ?? []) as Wohneinheit[];

  return (
    <div>
      <PageHeader title="Neuer Mieter" />
      <Card>
        <CardBody>
          <MieterForm
            inserate={inserate}
            wohneinheiten={wohneinheiten}
            defaultInseratId={inserat_id}
          />
        </CardBody>
      </Card>
    </div>
  );
}
