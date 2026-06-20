export type TodoStatus = "offen" | "in_bearbeitung" | "erledigt" | "abgelehnt";
export type TodoPrioritaet = "hoch" | "mittel" | "niedrig";
export type TodoKategorie = "extern" | "mieter" | "intern";
export type MieterStatus = "aktiv" | "ausgezogen" | "gekuendigt";
export type InseratTyp = "WEG" | "Mietsverwaltung" | "Sondereigentum";

export interface Inserat {
  id: string;
  adresse: string;
  plz: string | null;
  stadt: string | null;
  typ: InseratTyp | null;
  eigentuemer_name: string | null;
  eigentuemer_email: string | null;
  einheiten: number | null;
  notizen: string | null;
  created_at: string;
}

export interface Mieter {
  id: string;
  inserat_id: string | null;
  name: string;
  email: string | null;
  telefon: string | null;
  einheit_nr: string | null;
  einzug_datum: string | null;
  auszug_datum: string | null;
  status: MieterStatus;
  created_at: string;
}

export interface Todo {
  id: string;
  email_id: string | null;
  mieter_id: string | null;
  inserat_id: string | null;
  titel: string;
  beschreibung: string | null;
  kategorie: TodoKategorie | null;
  prioritaet: TodoPrioritaet;
  status: TodoStatus;
  faellig_at: string | null;
  erledigt_at: string | null;
  created_at: string;
}

export interface TodoWithMieter extends Todo {
  mieter: Pick<Mieter, "name"> | null;
}

export interface MieterWithInserat extends Mieter {
  inserat: Pick<Inserat, "adresse" | "stadt"> | null;
}

export const TODO_STATUSES: TodoStatus[] = [
  "offen",
  "in_bearbeitung",
  "erledigt",
  "abgelehnt",
];

export const TODO_PRIORITAETEN: TodoPrioritaet[] = ["hoch", "mittel", "niedrig"];
export const TODO_KATEGORIEN: TodoKategorie[] = ["extern", "mieter", "intern"];

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
