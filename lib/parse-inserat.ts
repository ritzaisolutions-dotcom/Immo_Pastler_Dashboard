import { isInseratTyp, type InseratTyp } from "@/lib/types";

type InseratBody = {
  adresse?: unknown;
  plz?: unknown;
  stadt?: unknown;
  typ?: unknown;
  vermieter_id?: unknown;
  eigentuemer_name?: unknown;
  eigentuemer_email?: unknown;
  einheiten?: unknown;
  beschreibung?: unknown;
  notizen?: unknown;
};

export function parseInseratBody(body: InseratBody) {
  if (typeof body.adresse !== "string" || !body.adresse.trim()) {
    return { error: "adresse required" as const };
  }

  let typ: InseratTyp | null = null;
  if (typeof body.typ === "string" && body.typ.trim()) {
    if (!isInseratTyp(body.typ)) {
      return { error: "invalid typ" as const };
    }
    typ = body.typ;
  }

  let einheiten: number | null = null;
  if (body.einheiten !== undefined && body.einheiten !== null && body.einheiten !== "") {
    const n = Number(body.einheiten);
    if (!Number.isFinite(n) || n < 1) {
      return { error: "invalid einheiten" as const };
    }
    einheiten = Math.floor(n);
  }

  let vermieter_id: string | null = null;
  if (typeof body.vermieter_id === "string" && body.vermieter_id.trim()) {
    vermieter_id = body.vermieter_id.trim();
  }

  return {
    data: {
      adresse: body.adresse.trim(),
      plz: typeof body.plz === "string" ? body.plz.trim() || null : null,
      stadt: typeof body.stadt === "string" ? body.stadt.trim() || null : null,
      typ,
      vermieter_id,
      eigentuemer_name:
        typeof body.eigentuemer_name === "string"
          ? body.eigentuemer_name.trim() || null
          : null,
      eigentuemer_email:
        typeof body.eigentuemer_email === "string"
          ? body.eigentuemer_email.trim() || null
          : null,
      einheiten,
      beschreibung:
        typeof body.beschreibung === "string"
          ? body.beschreibung.trim() || null
          : null,
      notizen:
        typeof body.notizen === "string" ? body.notizen.trim() || null : null,
    },
  };
}
