import { requireMitarbeiterPage } from "@/lib/require-mitarbeiter";
import TodoForm, { type TodoFormOption } from "@/components/TodoForm";
import PageHeader from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { TABLES } from "@/lib/supabase/tables";

export default async function TodoNeuPage() {
  const { supabase } = await requireMitarbeiterPage();

  const [{ data: mieterList }, { data: inserateList }, { data: vermieterList }] =
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

  const mieterOptions: TodoFormOption[] = (mieterList ?? []).map((m) => {
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

  const inseratOptions: TodoFormOption[] = (inserateList ?? []).map((i) => ({
    id: i.id,
    label: `${i.adresse}${i.stadt ? `, ${i.stadt}` : ""}`,
  }));

  const vermieterOptions: TodoFormOption[] = (vermieterList ?? []).map((v) => ({
    id: v.id,
    label: v.firma ? `${v.name} (${v.firma})` : v.name,
  }));

  return (
    <div>
      <PageHeader title="Neues Todo" />
      <Card>
        <CardBody>
          <TodoForm
            mieterOptions={mieterOptions}
            inseratOptions={inseratOptions}
            vermieterOptions={vermieterOptions}
          />
        </CardBody>
      </Card>
    </div>
  );
}
