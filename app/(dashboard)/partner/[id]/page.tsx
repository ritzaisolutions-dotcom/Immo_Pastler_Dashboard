import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import PartnerForm from "@/components/PartnerForm";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { TABLES } from "@/lib/supabase/tables";
import { type Partner } from "@/lib/types";
import { ArrowLeft } from "lucide-react";

interface PartnerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PartnerDetailPage({ params }: PartnerDetailPageProps) {
  const { id } = await params;
  const { supabase } = await requireMitarbeiterPage();

  const { data } = await supabase
    .from(TABLES.partner)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const partner = data as Partner;

  return (
    <div>
      <Link
        href="/partner"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück zu Partner
      </Link>
      <PageHeader
        title={partner.firma}
        subtitle="Partner bearbeiten"
      />
      <Card>
        <CardBody>
          <PartnerForm partner={partner} />
        </CardBody>
      </Card>
    </div>
  );
}
