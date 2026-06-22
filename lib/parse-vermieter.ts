type VermieterBody = {
  name?: unknown;
  firma?: unknown;
  email?: unknown;
  telefon?: unknown;
  adresse?: unknown;
  plz?: unknown;
  stadt?: unknown;
  beschreibung?: unknown;
  notizen?: unknown;
};

function trimOrNull(v: unknown): string | null {
  return typeof v === "string" ? v.trim() || null : null;
}

export function parseVermieterBody(body: VermieterBody) {
  if (typeof body.name !== "string" || !body.name.trim()) {
    return { error: "Name ist erforderlich" as const };
  }
  if (typeof body.email !== "string" || !body.email.trim()) {
    return { error: "E-Mail ist erforderlich" as const };
  }

  return {
    data: {
      name: body.name.trim(),
      firma: trimOrNull(body.firma),
      email: body.email.trim().toLowerCase(),
      telefon: trimOrNull(body.telefon),
      adresse: trimOrNull(body.adresse),
      plz: trimOrNull(body.plz),
      stadt: trimOrNull(body.stadt),
      beschreibung: trimOrNull(body.beschreibung),
      notizen: trimOrNull(body.notizen),
    },
  };
}
