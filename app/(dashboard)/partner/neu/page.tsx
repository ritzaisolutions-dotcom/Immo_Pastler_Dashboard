import Link from "next/link";
import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import PartnerForm from "@/components/PartnerForm";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { ArrowLeft } from "lucide-react";

export default async function PartnerNeuPage() {
  await requireMitarbeiterPage();

  return (
    <div>
      <Link
        href="/partner"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Partner
      </Link>
      <PageHeader title="Neuer Partner" />
      <Card>
        <CardBody>
          <PartnerForm />
        </CardBody>
      </Card>
    </div>
  );
}
