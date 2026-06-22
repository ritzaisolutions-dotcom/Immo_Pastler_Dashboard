import { isMieterStatus, type MieterStatus } from "@/lib/types";

type MieterBody = {
  name?: unknown;
  email?: unknown;
  telefon?: unknown;
  einheit_nr?: unknown;
  inserat_id?: unknown;
  einzug_datum?: unknown;
  auszug_datum?: unknown;
  status?: unknown;
};

export function parseMieterBody(body: MieterBody) {
  if (typeof body.name !== "string" || !body.name.trim()) {
    return { error: "name required" as const };
  }

  let status: MieterStatus = "aktiv";
  if (typeof body.status === "string" && body.status.trim()) {
    if (!isMieterStatus(body.status)) {
      return { error: "invalid status" as const };
    }
    status = body.status;
  }

  let inserat_id: string | null = null;
  if (typeof body.inserat_id === "string" && body.inserat_id.trim()) {
    inserat_id = body.inserat_id.trim();
  }

  const dateOrNull = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : null;

  return {
    data: {
      name: body.name.trim(),
      email: typeof body.email === "string" ? body.email.trim() || null : null,
      telefon:
        typeof body.telefon === "string" ? body.telefon.trim() || null : null,
      einheit_nr:
        typeof body.einheit_nr === "string" ? body.einheit_nr.trim() || null : null,
      inserat_id,
      einzug_datum: dateOrNull(body.einzug_datum),
      auszug_datum: dateOrNull(body.auszug_datum),
      status,
    },
  };
}
