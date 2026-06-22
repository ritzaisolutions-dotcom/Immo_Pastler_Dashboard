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
  einzug_datum: string | null;
  auszug_datum: string | null;
  status: MieterStatus;
  notizen: string | null;
  created_at: string;
}

export type PartnerGewerk =
  | "elektriker"
  | "sanitaer"
  | "schluessel"
  | "reinigung"
  | "hausmeister"
  | "allgemein";

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
  created_at: string;
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

export const PARTNER_GEWERKE: PartnerGewerk[] = [
  "elektriker",
  "sanitaer",
  "schluessel",
  "reinigung",
  "hausmeister",
  "allgemein",
];

export function isPartnerGewerk(value: string): value is PartnerGewerk {
  return PARTNER_GEWERKE.includes(value as PartnerGewerk);
}

export function gewerkLabel(gewerk: PartnerGewerk): string {
  switch (gewerk) {
    case "elektriker":
      return "Elektriker";
    case "sanitaer":
      return "Sanitär";
    case "schluessel":
      return "Schlüsseldienst";
    case "reinigung":
      return "Reinigung";
    case "hausmeister":
      return "Hausmeister";
    case "allgemein":
      return "Allgemein";
    default: {
      const _exhaustive: never = gewerk;
      return _exhaustive;
    }
  }
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
