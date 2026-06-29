import Link from "next/link";
import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import PartnerForm from "@/components/PartnerForm";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { loadGewerke } from "@/lib/gewerke-server";
import { TABLES } from "@/lib/supabase/tables";
import { ArrowLeft } from "lucide-react";
import { type Inserat } from "@/lib/types";

export default async function PartnerNeuPage() {
  const { supabase } = await requireMitarbeiterPage();

  const [{ data: objekte }, gewerke] = await Promise.all([
    supabase
      .from(TABLES.inserate)
      .select("id, adresse, stadt")
      .order("adresse", { ascending: true }),
    loadGewerke(supabase),
  ]);

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
          <PartnerForm
            objekte={(objekte ?? []) as Pick<Inserat, "id" | "adresse" | "stadt">[]}
            gewerke={gewerke}
          />
        </CardBody>
      </Card>
    </div>
  );
}
