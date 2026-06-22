import Link from "next/link";
import { notFound } from "next/navigation";
import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import { TABLES } from "@/lib/supabase/tables";
import {
  zuordnungKonfidenzLabel,
} from "@/lib/zuordnung";
import ZuordnungBadge from "@/components/ZuordnungBadge";
import ZuordnungForm, { type ZuordnungOption } from "@/components/ZuordnungForm";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { type Email } from "@/lib/types";

interface EmailDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function EmailDetailPage({ params }: EmailDetailPageProps) {
  const { id } = await params;
  const { supabase } = await requireMitarbeiterPage();

  const { data: emailData } = await supabase
    .from(TABLES.emails)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!emailData) {
    notFound();
  }

  const email = emailData as Email;

  const { data: todo } = await supabase
    .from(TABLES.todos)
    .select("id, titel, mieter_id, inserat_id")
    .eq("email_id", id)
    .maybeSingle();

  let todoHref: string | null = null;
  if (todo?.mieter_id) {
    todoHref = `/todos?mieter_id=${todo.mieter_id}`;
  } else if (todo?.inserat_id) {
    todoHref = `/todos?inserat_id=${todo.inserat_id}`;
  }

  const [mieterRes, inseratRes, vermieterRes] = await Promise.all([
    email.mieter_id
      ? supabase.from(TABLES.mieter).select("id, name").eq("id", email.mieter_id).maybeSingle()
      : Promise.resolve({ data: null }),
    email.inserat_id
      ? supabase.from(TABLES.inserate).select("id, adresse, stadt").eq("id", email.inserat_id).maybeSingle()
      : Promise.resolve({ data: null }),
    email.vermieter_id
      ? supabase.from(TABLES.vermieter).select("id, name, firma").eq("id", email.vermieter_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const mieter = mieterRes.data;
  const inserat = inseratRes.data;
  const vermieter = vermieterRes.data;

  const [{ data: allMieter }, { data: allInserate }, { data: allVermieter }] =
    await Promise.all([
      supabase
        .from(TABLES.mieter)
        .select(`id, name, einheit_nr, inserat_id, inserat:${TABLES.inserate}(vermieter_id)`)
        .order("name", { ascending: true }),
      supabase
        .from(TABLES.inserate)
        .select("id, adresse, stadt")
        .order("adresse", { ascending: true }),
      supabase
        .from(TABLES.vermieter)
        .select("id, name, firma")
        .order("name", { ascending: true }),
    ]);

  const mieterOptions: ZuordnungOption[] = (allMieter ?? []).map((m) => {
    const inseratRaw = m.inserat as
      | { vermieter_id: string | null }
      | { vermieter_id: string | null }[]
      | null;
    const inserat = Array.isArray(inseratRaw) ? inseratRaw[0] : inseratRaw;
    return {
      id: m.id,
      label: m.einheit_nr ? `${m.name} (${m.einheit_nr})` : m.name,
      inseratId: m.inserat_id,
      vermieterId: inserat?.vermieter_id ?? null,
    };
  });

  const inseratOptions: ZuordnungOption[] = (allInserate ?? []).map((i) => ({
    id: i.id,
    label: `${i.adresse}${i.stadt ? `, ${i.stadt}` : ""}`,
  }));

  const vermieterOptions: ZuordnungOption[] = (allVermieter ?? []).map((v) => ({
    id: v.id,
    label: v.firma ? `${v.name} (${v.firma})` : v.name,
  }));

  const hasZuordnung =
    email.zuordnung_quelle != null ||
    email.mieter_id ||
    email.inserat_id ||
    email.vermieter_id;

  return (
    <div>
      <PageHeader
        title={email.betreff ?? "E-Mail"}
        subtitle={
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/emails" className="text-sm text-text-secondary hover:text-navy">
              ← Zurück zu E-Mails
            </Link>
            {email.zuordnung_quelle && (
              <ZuordnungBadge
                quelle={email.zuordnung_quelle}
                konfidenz={email.zuordnung_konfidenz}
              />
            )}
          </div>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-medium text-text-primary">Metadaten</h2>
        </CardHeader>
        <CardBody>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-text-hint">Von</dt>
              <dd className="text-text-primary">
                {email.von_name ?? email.von_email}
                <span className="block text-text-secondary">{email.von_email}</span>
              </dd>
            </div>
            <div>
              <dt className="text-text-hint">Empfangen</dt>
              <dd className="text-text-primary">
                {new Date(email.empfangen_at).toLocaleString("de-DE")}
              </dd>
            </div>
            <div>
              <dt className="text-text-hint">Verarbeitet</dt>
              <dd className="text-text-primary">
                {email.verarbeitet ? "Ja" : "Nein"}
              </dd>
            </div>
            {todo && (
              <div>
                <dt className="text-text-hint">Verknüpftes Todo</dt>
                <dd>
                  {todoHref ? (
                    <Link href={todoHref} className="text-navy hover:text-gold">
                      {todo.titel}
                    </Link>
                  ) : (
                    <span className="text-text-primary">{todo.titel}</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </CardBody>
      </Card>

      {hasZuordnung ? (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-medium text-text-primary">Zuordnung</h2>
          </CardHeader>
          <CardBody>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-text-hint">Quelle</dt>
                <dd>
                  <ZuordnungBadge
                    quelle={email.zuordnung_quelle}
                    konfidenz={email.zuordnung_konfidenz}
                    showKonfidenz={false}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-text-hint">Konfidenz</dt>
                <dd className="text-text-primary">
                  {zuordnungKonfidenzLabel(email.zuordnung_konfidenz)}
                </dd>
              </div>
              {mieter && (
                <div>
                  <dt className="text-text-hint">Mieter</dt>
                  <dd>
                    <Link
                      href={`/mieter/${mieter.id}`}
                      className="text-navy hover:text-gold"
                    >
                      {mieter.name}
                    </Link>
                  </dd>
                </div>
              )}
              {inserat && (
                <div>
                  <dt className="text-text-hint">Inserat</dt>
                  <dd>
                    <Link
                      href={`/inserate/${inserat.id}`}
                      className="text-navy hover:text-gold"
                    >
                      {inserat.adresse}
                      {inserat.stadt ? `, ${inserat.stadt}` : ""}
                    </Link>
                  </dd>
                </div>
              )}
              {vermieter && (
                <div>
                  <dt className="text-text-hint">Vermieter</dt>
                  <dd>
                    <Link
                      href={`/vermieter/${vermieter.id}`}
                      className="text-navy hover:text-gold"
                    >
                      {vermieter.name}
                      {vermieter.firma ? ` (${vermieter.firma})` : ""}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
          </CardBody>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardBody>
            <p className="text-sm text-text-secondary">
              Noch keine Zuordnung — wird bei Verarbeitung durch n8n gesetzt.
            </p>
          </CardBody>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-medium text-text-primary">Zuordnung bearbeiten</h2>
        </CardHeader>
        <CardBody>
          <ZuordnungForm
            emailId={email.id}
            initialMieterId={email.mieter_id}
            initialInseratId={email.inserat_id}
            initialVermieterId={email.vermieter_id}
            mieterOptions={mieterOptions}
            inseratOptions={inseratOptions}
            vermieterOptions={vermieterOptions}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-medium text-text-primary">Inhalt</h2>
        </CardHeader>
        <CardBody>
          {email.inhalt_text ? (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-text-primary">
              {email.inhalt_text}
            </pre>
          ) : (
            <p className="text-sm text-text-secondary">
              Kein Volltext (Retention oder noch nicht synchronisiert).
            </p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
