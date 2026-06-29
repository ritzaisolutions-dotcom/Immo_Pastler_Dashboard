import { gewerkDisplayLabel } from "./gewerk";

export type TodoStatus = "offen" | "in_bearbeitung" | "erledigt" | "abgelehnt";
export type TodoPrioritaet = "hoch" | "mittel" | "niedrig";
export type TodoKategorie = "extern" | "mieter" | "intern";
export type MieterStatus = "aktiv" | "ausgezogen" | "gekuendigt";
export type InseratTyp = "WEG" | "Mietsverwaltung" | "Sondereigentum";

export const INSERAT_TYPEN: InseratTyp[] = [
  "WEG",
  "Mietsverwaltung",
  "Sondereigentum",
];

export interface Inserat {
  id: string;
  adresse: string;
  plz: string | null;
  stadt: string | null;
  typ: InseratTyp | null;
  vermieter_id: string | null;
  eigentuemer_name: string | null;
  eigentuemer_email: string | null;
  einheiten: number | null;
  beschreibung: string | null;
  notizen: string | null;
  bild_url: string | null;
  created_at: string;
}

export interface Vermieter {
  id: string;
  name: string;
  firma: string | null;
  email: string;
  telefon: string | null;
  adresse: string | null;
  plz: string | null;
  stadt: string | null;
  beschreibung: string | null;
  notizen: string | null;
  created_at: string;
}

export interface Email {
  id: string;
  message_id: string;
  von_email: string;
  von_name: string | null;
  betreff: string | null;
  inhalt_text: string | null;
  empfangen_at: string;
  verarbeitet: boolean;
  mieter_id: string | null;
  inserat_id: string | null;
  vermieter_id: string | null;
  zuordnung_quelle: string | null;
  zuordnung_konfidenz: string | null;
  created_at: string;
}

export interface EmailWithTodo extends Email {
  todo: Pick<Todo, "id" | "titel"> | null;
}

export interface Mieter {
  id: string;
  inserat_id: string | null;
  name: string;
  email: string | null;
  telefon: string | null;
  adresse: string | null;
  plz: string | null;
  stadt: string | null;
  einheit_nr: string | null;
  wohneinheit_id: string | null;
  einzug_datum: string | null;
  auszug_datum: string | null;
  status: MieterStatus;
  notizen: string | null;
  created_at: string;
}

export type PartnerGewerk = string;

export type PartnerAnredeForm = "sie" | "du";

export type ObjektPartnerGewerkKategorie = string;

export interface Gewerk {
  key: string;
  label: string;
  objekt_relevant: boolean;
  sort_order: number;
  created_at?: string;
}

export type PartnerNachrichtStatus = "entwurf" | "gesendet" | "abgelehnt";

export interface Partner {
  id: string;
  firma: string;
  ansprechpartner: string | null;
  adresse: string | null;
  plz: string | null;
  stadt: string | null;
  email: string;
  telefon: string | null;
  gewerk: PartnerGewerk;
  beschreibung: string | null;
  notizen: string | null;
  aktiv: boolean;
  anrede_form: PartnerAnredeForm;
  einsatzgebiet: string | null;
  created_at: string;
}

export interface Wohneinheit {
  id: string;
  inserat_id: string;
  nummer: string;
  bezeichnung: string | null;
  sort_order: number;
  created_at: string;
}

export interface WohneinheitWithMieter extends Wohneinheit {
  mieter: Pick<Mieter, "id" | "name" | "email"> | null;
  open_todos_count?: number;
}

export interface ObjektPartnerGewerk {
  inserat_id: string;
  gewerk: ObjektPartnerGewerkKategorie;
  partner_id: string;
}

export interface PartnerNachricht {
  id: string;
  todo_id: string;
  partner_id: string;
  betreff: string;
  inhalt: string;
  status: PartnerNachrichtStatus;
  gesendet_at: string | null;
  gesendet_von: string | null;
  created_at: string;
}

export interface PartnerNachrichtWithPartner extends PartnerNachricht {
  partner: Pick<Partner, "firma" | "email" | "ansprechpartner"> | null;
}

export interface Todo {
  id: string;
  email_id: string | null;
  mieter_id: string | null;
  inserat_id: string | null;
  vermieter_id: string | null;
  partner_id: string | null;
  use_case: string | null;
  gewerk: PartnerGewerk | null;
  titel: string;
  beschreibung: string | null;
  kategorie: TodoKategorie | null;
  prioritaet: TodoPrioritaet;
  status: TodoStatus;
  zuordnung_quelle: string | null;
  zuordnung_konfidenz: string | null;
  faellig_at: string | null;
  erledigt_at: string | null;
  created_at: string;
}

export interface TodoWithMieter extends Todo {
  mieter: Pick<Mieter, "name" | "id"> | null;
}

export interface TodoWithInserat extends Todo {
  inserat: Pick<Inserat, "adresse" | "stadt" | "id"> | null;
}

export interface TodoWithMieterInserat extends Todo {
  mieter: Pick<Mieter, "name" | "id"> | null;
  inserat: Pick<Inserat, "adresse" | "stadt" | "id"> | null;
  vermieter?: Pick<Vermieter, "id" | "name" | "firma"> | null;
}

export interface TodoWithNachricht extends TodoWithMieterInserat {
  partner_nachricht: PartnerNachrichtWithPartner | null;
}

export interface MieterWithInserat extends Mieter {
  inserat: Pick<Inserat, "adresse" | "stadt" | "vermieter_id"> | null;
}

export interface InseratWithVermieter extends Inserat {
  vermieter: Pick<Vermieter, "id" | "name" | "firma" | "email"> | null;
}

/** @deprecated Fallback — Gewerke aus `pastler_gewerke` laden */
export const PARTNER_GEWERKE: PartnerGewerk[] = [
  "elektriker",
  "sanitaer",
  "schluessel",
  "reinigung",
  "hausmeister",
  "maler",
  "allgemein",
];

/** @deprecated Fallback — objekt-relevante Gewerke aus DB laden */
export const OBJEKT_PARTNER_GEWERKE: ObjektPartnerGewerkKategorie[] = [
  "elektriker",
  "sanitaer",
  "maler",
  "hausmeister",
];

export function gewerkLabel(
  gewerk: string,
  gewerke?: ReadonlyArray<Pick<Gewerk, "key" | "label">>,
): string {
  return gewerkDisplayLabel(gewerk, gewerke);
}

export function objektPartnerGewerkLabel(
  gewerk: string,
  gewerke?: ReadonlyArray<Pick<Gewerk, "key" | "label">>,
): string {
  return gewerkDisplayLabel(gewerk, gewerke);
}

export function nachrichtStatusLabel(status: PartnerNachrichtStatus): string {
  switch (status) {
    case "entwurf":
      return "Entwurf";
    case "gesendet":
      return "Gesendet";
    case "abgelehnt":
      return "Abgelehnt";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export const TODO_STATUSES: TodoStatus[] = [
  "offen",
  "in_bearbeitung",
  "erledigt",
  "abgelehnt",
];

export const TODO_PRIORITAETEN: TodoPrioritaet[] = ["hoch", "mittel", "niedrig"];
export const TODO_KATEGORIEN: TodoKategorie[] = ["extern", "mieter", "intern"];

export const MIETER_STATUSES: MieterStatus[] = ["aktiv", "ausgezogen", "gekuendigt"];

export function isInseratTyp(value: string): value is InseratTyp {
  return INSERAT_TYPEN.includes(value as InseratTyp);
}

export function isMieterStatus(value: string): value is MieterStatus {
  return MIETER_STATUSES.includes(value as MieterStatus);
}

export function inseratTypLabel(typ: InseratTyp | null): string {
  return typ ?? "—";
}

export function isTodoStatus(value: string): value is TodoStatus {
  return TODO_STATUSES.includes(value as TodoStatus);
}

export function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function statusLabel(status: TodoStatus): string {
  switch (status) {
    case "offen":
      return "Offen";
    case "in_bearbeitung":
      return "In Bearbeitung";
    case "erledigt":
      return "Erledigt";
    case "abgelehnt":
      return "Abgelehnt";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function prioritaetLabel(prioritaet: TodoPrioritaet): string {
  switch (prioritaet) {
    case "hoch":
      return "Hoch";
    case "mittel":
      return "Mittel";
    case "niedrig":
      return "Niedrig";
    default: {
      const _exhaustive: never = prioritaet;
      return _exhaustive;
    }
  }
}

export function kategorieLabel(kategorie: TodoKategorie | null): string {
  if (!kategorie) return "—";
  switch (kategorie) {
    case "extern":
      return "Extern";
    case "mieter":
      return "Mieter";
    case "intern":
      return "Intern";
    default: {
      const _exhaustive: never = kategorie;
      return _exhaustive;
    }
  }
}


export function anredeFormLabel(form: PartnerAnredeForm): string {
  return form === "du" ? "Du" : "Sie";
}

export function splitName(fullName: string): {
  vorname: string;
  nachname: string;
} {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { vorname: parts[0] ?? "", nachname: "" };
  }
  return {
    vorname: parts[0] ?? "",
    nachname: parts.slice(1).join(" "),
  };
}

export function mieterStatusLabel(status: MieterStatus): string {
  switch (status) {
    case "aktiv":
      return "Aktiv";
    case "ausgezogen":
      return "Ausgezogen";
    case "gekuendigt":
      return "Gekündigt";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
