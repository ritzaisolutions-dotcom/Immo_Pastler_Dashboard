import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { isMitarbeiter } from "@/lib/auth-roles";
import { TABLES } from "@/lib/supabase/tables";
import Badge from "@/components/Badge";
import InseratAvatar from "@/components/InseratAvatar";
import InserateSearchInput from "@/components/InserateSearchInput";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import { Card, CardBody } from "@/components/ui/Card";
import { Building2 } from "lucide-react";
import { type Inserat } from "@/lib/types";

interface ObjektePageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function ObjektePage({ searchParams }: ObjektePageProps) {
  const { q } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const mitarbeiter = isMitarbeiter(user);

  let query = supabase
    .from(TABLES.inserate)
    .select("*")
    .order("adresse", { ascending: true });

  if (q) {
    query = query.or(`adresse.ilike.%${q}%,stadt.ilike.%${q}%`);
  }

  const { data: inserateList } = await query;
  const inserate = (inserateList ?? []) as Inserat[];

  const enriched = await Promise.all(
    inserate.map(async (inserat) => {
      const [{ count: wohnungenCount }, { count: openTodosCount }] =
        await Promise.all([
          supabase
            .from(TABLES.wohneinheiten)
            .select("*", { count: "exact", head: true })
            .eq("inserat_id", inserat.id),
          supabase
            .from(TABLES.todos)
            .select("*", { count: "exact", head: true })
            .eq("inserat_id", inserat.id)
            .neq("status", "erledigt"),
        ]);

      return {
        ...inserat,
        wohnungenCount: wohnungenCount ?? inserat.einheiten ?? 0,
        openTodosCount: openTodosCount ?? 0,
      };
    }),
  );

  return (
    <div>
      <PageHeader
        title="Objekte"
        actions={
          mitarbeiter ? (
            <Link
              href="/objekte/neu"
              className="inline-flex items-center justify-center rounded-[4px] bg-navy px-4 py-2 text-sm text-white transition-colors hover:bg-navy-mid"
            >
              Neues Objekt
            </Link>
          ) : undefined
        }
      />

      <div className="mb-4">
        <Suspense fallback={null}>
          <InserateSearchInput />
        </Suspense>
      </div>

      {enriched.length === 0 ? (
        <EmptyState icon={Building2}>
          {q ? `Keine Objekte für „${q}" gefunden` : "Keine Objekte gefunden"}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {enriched.map((objekt) => (
            <Link key={objekt.id} href={`/objekte/${objekt.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardBody className="space-y-4">
                  <div className="flex items-start gap-4">
                    <InseratAvatar
                      adresse={objekt.adresse}
                      bildUrl={objekt.bild_url}
                    />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-lg text-burgundy">
                        {objekt.adresse}
                      </h2>
                      <p className="text-sm text-text-secondary">
                        {objekt.plz} {objekt.stadt}
                      </p>
                      <div className="mt-2">
                        <Badge
                          variant={{ type: "inseratTyp", value: objekt.typ }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                    <span className="text-text-secondary">
                      {objekt.wohnungenCount} Wohneinheiten
                    </span>
                    {objekt.openTodosCount > 0 ? (
                      <span className="rounded-[4px] bg-gold-pale px-2 py-0.5 text-xs font-medium text-warning">
                        {objekt.openTodosCount} offene Todos
                      </span>
                    ) : (
                      <span className="text-text-hint">Keine offenen Todos</span>
                    )}
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
