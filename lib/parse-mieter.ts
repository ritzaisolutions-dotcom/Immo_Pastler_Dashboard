import { isMieterStatus, type MieterStatus } from "@/lib/types";

type MieterBody = {
  name?: unknown;
  email?: unknown;
  telefon?: unknown;
  adresse?: unknown;
  plz?: unknown;
  stadt?: unknown;
  einheit_nr?: unknown;
  wohneinheit_id?: unknown;
  inserat_id?: unknown;
  einzug_datum?: unknown;
  auszug_datum?: unknown;
  status?: unknown;
  notizen?: unknown;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function uuidOrNull(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const trimmed = v.trim();
  return UUID_RE.test(trimmed) ? trimmed : null;
}

export function parseMieterBody(body: MieterBody) {
  if (typeof body.name !== "string" || !body.name.trim()) {
    return { error: "Name ist erforderlich" as const };
  }

  if (
    typeof body.inserat_id !== "string" ||
    !body.inserat_id.trim()
  ) {
    return { error: "Bitte ein Inserat auswählen" as const };
  }

  let status: MieterStatus = "aktiv";
  if (typeof body.status === "string" && body.status.trim()) {
    if (!isMieterStatus(body.status)) {
      return { error: "Ungültiger Status" as const };
    }
    status = body.status;
  }

  const inserat_id = body.inserat_id.trim();
  const wohneinheit_id = uuidOrNull(body.wohneinheit_id);

  if (body.wohneinheit_id != null && body.wohneinheit_id !== "" && !wohneinheit_id) {
    return { error: "Ungültige Wohneinheit" as const };
  }

  const trimOrNull = (v: unknown) =>
    typeof v === "string" ? v.trim() || null : null;

  const dateOrNull = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : null;

  return {
    data: {
      name: body.name.trim(),
      email: trimOrNull(body.email),
      telefon: trimOrNull(body.telefon),
      adresse: trimOrNull(body.adresse),
      plz: trimOrNull(body.plz),
      stadt: trimOrNull(body.stadt),
      einheit_nr: trimOrNull(body.einheit_nr),
      wohneinheit_id,
      inserat_id,
      einzug_datum: dateOrNull(body.einzug_datum),
      auszug_datum: dateOrNull(body.auszug_datum),
      status,
      notizen: trimOrNull(body.notizen),
    },
  };
}
