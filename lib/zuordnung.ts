export type ZuordnungQuelle =
  | "absender_mieter"
  | "absender_vermieter"
  | "inhalt_objekt"
  | "inhalt_einheit"
  | "inhalt_mieter_name"
  | "unbekannt";

export type ZuordnungKonfidenz = "hoch" | "mittel" | "niedrig";

export function zuordnungQuelleLabel(quelle: string | null): string {
  switch (quelle) {
    case "absender_mieter":
      return "Absender (Mieter)";
    case "absender_vermieter":
      return "Absender (Vermieter)";
    case "inhalt_objekt":
      return "Inhalt (Objektadresse)";
    case "inhalt_einheit":
      return "Inhalt (Einheit)";
    case "inhalt_mieter_name":
      return "Inhalt (Mietername)";
    case "unbekannt":
      return "Nicht zugeordnet";
    default:
      return quelle ?? "—";
  }
}

export function zuordnungKonfidenzLabel(konfidenz: string | null): string {
  switch (konfidenz) {
    case "hoch":
      return "Hoch";
    case "mittel":
      return "Mittel";
    case "niedrig":
      return "Niedrig";
    default:
      return konfidenz ?? "—";
  }
}

export function isZuordnungQuelle(value: string): value is ZuordnungQuelle {
  return [
    "absender_mieter",
    "absender_vermieter",
    "inhalt_objekt",
    "inhalt_einheit",
    "inhalt_mieter_name",
    "unbekannt",
  ].includes(value);
}
