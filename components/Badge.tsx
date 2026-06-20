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
  | { type: "inseratTyp"; value: InseratTyp | null };

const statusStyles: Record<TodoStatus, string> = {
  offen: "bg-warm-white text-text-secondary border-border",
  in_bearbeitung: "bg-[#EFF6FF] text-info border-[#BFDBFE]",
  erledigt: "bg-[#ECFDF5] text-success border-[#A7F3D0]",
  abgelehnt: "bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]",
};

const prioritaetStyles: Record<TodoPrioritaet, string> = {
  hoch: "bg-[#FEF2F2] text-warning",
  mittel: "bg-[#FFFBEB] text-[#78350F]",
  niedrig: "bg-warm-white text-text-secondary",
};

const kategorieStyles: Record<TodoKategorie, string> = {
  extern: "bg-[#EFF6FF] text-info",
  mieter: "bg-[#F0FDF4] text-[#166534]",
  intern: "bg-warm-white text-text-secondary",
};

const mieterStatusStyles: Record<MieterStatus, string> = {
  aktiv: "bg-[#ECFDF5] text-success",
  ausgezogen: "bg-warm-white text-text-secondary",
  gekuendigt: "bg-[#FEF2F2] text-[#991B1B]",
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
      className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-[4px] ${withBorder ? "border" : ""} ${badgeStyles(variant)}`}
    >
      {badgeLabel(variant)}
    </span>
  );
}
