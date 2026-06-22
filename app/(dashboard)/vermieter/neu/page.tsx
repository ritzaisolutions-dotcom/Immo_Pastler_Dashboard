import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import VermieterForm from "@/components/VermieterForm";

export default function VermieterNeuPage() {
  return (
    <div>
      <PageHeader title="Neuer Vermieter" />
      <Card>
        <CardBody>
          <VermieterForm />
        </CardBody>
      </Card>
    </div>
  );
}
