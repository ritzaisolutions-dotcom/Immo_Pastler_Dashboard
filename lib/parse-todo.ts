import {
  isTodoStatus,
  TODO_KATEGORIEN,
  TODO_PRIORITAETEN,
  TODO_STATUSES,
  type TodoKategorie,
  type TodoPrioritaet,
  type TodoStatus,
} from "@/lib/types";

type TodoBody = {
  titel?: unknown;
  beschreibung?: unknown;
  kategorie?: unknown;
  prioritaet?: unknown;
  status?: unknown;
  faellig_at?: unknown;
  mieter_id?: unknown;
  inserat_id?: unknown;
  vermieter_id?: unknown;
  gewerk?: unknown;
  use_case?: unknown;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function uuidOrNull(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const trimmed = v.trim();
  return UUID_RE.test(trimmed) ? trimmed : null;
}

function isTodoKategorie(value: string): value is TodoKategorie {
  return TODO_KATEGORIEN.includes(value as TodoKategorie);
}

function isTodoPrioritaet(value: string): value is TodoPrioritaet {
  return TODO_PRIORITAETEN.includes(value as TodoPrioritaet);
}

export function parseTodoBody(body: TodoBody) {
  if (typeof body.titel !== "string" || !body.titel.trim()) {
    return { error: "Titel ist erforderlich" as const };
  }

  let kategorie: TodoKategorie = "intern";
  if (typeof body.kategorie === "string" && body.kategorie.trim()) {
    if (!isTodoKategorie(body.kategorie)) {
      return { error: "Ungültige Kategorie" as const };
    }
    kategorie = body.kategorie;
  }

  let prioritaet: TodoPrioritaet = "mittel";
  if (typeof body.prioritaet === "string" && body.prioritaet.trim()) {
    if (!isTodoPrioritaet(body.prioritaet)) {
      return { error: "Ungültige Priorität" as const };
    }
    prioritaet = body.prioritaet;
  }

  let status: TodoStatus = "offen";
  if (typeof body.status === "string" && body.status.trim()) {
    if (!isTodoStatus(body.status)) {
      return { error: "Ungültiger Status" as const };
    }
    status = body.status;
  }

  const mieter_id = uuidOrNull(body.mieter_id);
  const inserat_id = uuidOrNull(body.inserat_id);
  const vermieter_id = uuidOrNull(body.vermieter_id);

  if (body.mieter_id != null && body.mieter_id !== "" && !mieter_id) {
    return { error: "Ungültiger Mieter" as const };
  }
  if (body.inserat_id != null && body.inserat_id !== "" && !inserat_id) {
    return { error: "Ungültiges Inserat" as const };
  }
  if (body.vermieter_id != null && body.vermieter_id !== "" && !vermieter_id) {
    return { error: "Ungültiger Vermieter" as const };
  }

  const trimOrNull = (v: unknown) =>
    typeof v === "string" ? v.trim() || null : null;

  const faellig_at =
    typeof body.faellig_at === "string" && body.faellig_at.trim()
      ? body.faellig_at.trim()
      : null;

  return {
    data: {
      titel: body.titel.trim(),
      beschreibung: trimOrNull(body.beschreibung),
      kategorie,
      prioritaet,
      status,
      faellig_at,
      mieter_id,
      inserat_id,
      vermieter_id,
      gewerk: trimOrNull(body.gewerk),
      use_case: trimOrNull(body.use_case),
      email_id: null,
      partner_id: null,
      zuordnung_quelle: "manuell",
      zuordnung_konfidenz: null,
      erledigt_at: status === "erledigt" ? new Date().toISOString() : null,
    },
  };
}

export { TODO_KATEGORIEN, TODO_PRIORITAETEN, TODO_STATUSES };
