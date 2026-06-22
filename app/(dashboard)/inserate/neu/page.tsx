import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import InseratForm from "@/components/InseratForm";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";

export default async function InseratNeuPage() {
  await requireMitarbeiterPage();

  return (
    <div>
      <PageHeader title="Neues Inserat" />
      <Card>
        <CardBody>
          <InseratForm />
        </CardBody>
      </Card>
    </div>
  );
}
