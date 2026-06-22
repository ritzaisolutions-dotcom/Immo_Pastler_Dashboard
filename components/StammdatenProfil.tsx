import { type ReactNode } from "react";

export type StammdatenRow = {
  label: string;
  value: ReactNode;
};

type StammdatenProfilProps = {
  title: string;
  subtitle?: string | null;
  rows: StammdatenRow[];
};

export default function StammdatenProfil({
  title,
  subtitle,
  rows,
}: StammdatenProfilProps) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-xl text-text-primary">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
      )}
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-text-hint">{row.label}</dt>
            <dd className="text-text-primary">{row.value ?? "—"}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
