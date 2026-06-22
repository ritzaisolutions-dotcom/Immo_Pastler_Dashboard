import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import InseratForm from "@/components/InseratForm";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { TABLES } from "@/lib/supabase/tables";
import { type Vermieter } from "@/lib/types";

export default async function InseratNeuPage() {
  const { supabase } = await requireMitarbeiterPage();

  const { data } = await supabase
    .from(TABLES.vermieter)
    .select("id, name, firma")
    .order("name", { ascending: true });

  const vermieter = (data ?? []) as Pick<Vermieter, "id" | "name" | "firma">[];

  return (
    <div>
      <PageHeader title="Neues Inserat" />
      <Card>
        <CardBody>
          <InseratForm vermieter={vermieter} />
        </CardBody>
      </Card>
    </div>
  );
}
