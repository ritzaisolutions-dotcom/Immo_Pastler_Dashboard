import {
  kategorieLabel,
  prioritaetLabel,
  statusLabel,
  type TodoKategorie,
  type TodoPrioritaet,
  type TodoStatus,
  type MieterStatus,
  type InseratTyp,
} from "@/lib/types";

type BadgeVariant =
  | { type: "status"; value: TodoStatus }
  | { type: "prioritaet"; value: TodoPrioritaet }
  | { type: "kategorie"; value: TodoKategorie | null }
  | { type: "mieterStatus"; value: MieterStatus }
  | { type: "inseratTyp"; value: InseratTyp | null }
  | { type: "partnerAktiv"; value: boolean };

const statusStyles: Record<TodoStatus, string> = {
  offen: "bg-warm-white text-text-secondary border-border",
  in_bearbeitung: "bg-info/10 text-info border-info/30",
  erledigt: "bg-success/10 text-success border-success/30",
  abgelehnt: "bg-burgundy/10 text-burgundy border-burgundy/30",
};

const prioritaetStyles: Record<TodoPrioritaet, string> = {
  hoch: "bg-burgundy/10 text-warning",
  mittel: "bg-gold-pale text-warning",
  niedrig: "bg-warm-white text-text-secondary",
};

const kategorieStyles: Record<TodoKategorie, string> = {
  extern: "bg-info/10 text-info",
  mieter: "bg-success/10 text-success",
  intern: "bg-warm-white text-text-secondary",
};

const mieterStatusStyles: Record<MieterStatus, string> = {
  aktiv: "bg-success/10 text-success",
  ausgezogen: "bg-warm-white text-text-secondary",
  gekuendigt: "bg-burgundy/10 text-burgundy",
};

function badgeLabel(variant: BadgeVariant): string {
  switch (variant.type) {
    case "status":
      return statusLabel(variant.value);
    case "prioritaet":
      return prioritaetLabel(variant.value);
    case "kategorie":
      return kategorieLabel(variant.value);
    case "mieterStatus":
      return variant.value === "aktiv"
        ? "Aktiv"
        : variant.value === "ausgezogen"
          ? "Ausgezogen"
          : "Gekündigt";
    case "inseratTyp":
      return variant.value ?? "—";
    case "partnerAktiv":
      return variant.value ? "Aktiv" : "Inaktiv";
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}

function badgeStyles(variant: BadgeVariant): string {
  switch (variant.type) {
    case "status":
      return statusStyles[variant.value];
    case "prioritaet":
      return prioritaetStyles[variant.value];
    case "kategorie":
      return variant.value
        ? kategorieStyles[variant.value]
        : "bg-warm-white text-text-secondary";
    case "mieterStatus":
      return mieterStatusStyles[variant.value];
    case "inseratTyp":
      return "bg-warm-white text-text-secondary";
    case "partnerAktiv":
      return variant.value ? "bg-success/10 text-success" : "bg-warm-white text-text-hint";
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}

export default function Badge({ variant }: { variant: BadgeVariant }) {
  const withBorder = variant.type === "status";

  return (
    <span
      className={`inline-block rounded-[4px] px-2 py-0.5 text-[11px] font-medium ${withBorder ? "border" : ""} ${badgeStyles(variant)}`}
    >
      {badgeLabel(variant)}
    </span>
  );
}
