import {
  zuordnungKonfidenzLabel,
  zuordnungQuelleLabel,
} from "@/lib/zuordnung";

type ZuordnungBadgeProps = {
  quelle: string | null;
  konfidenz?: string | null;
  showKonfidenz?: boolean;
};

export default function ZuordnungBadge({
  quelle,
  konfidenz,
  showKonfidenz = true,
}: ZuordnungBadgeProps) {
  const label = zuordnungQuelleLabel(quelle);
  const isUnknown = !quelle || quelle === "unbekannt";

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-block rounded-[4px] px-2 py-0.5 text-[11px] font-medium ${
          isUnknown
            ? "bg-warm-white text-text-hint"
            : "bg-info/10 text-info"
        }`}
      >
        {label}
      </span>
      {showKonfidenz && konfidenz && !isUnknown && (
        <span className="text-[11px] text-text-hint">
          ({zuordnungKonfidenzLabel(konfidenz)})
        </span>
      )}
    </span>
  );
}
