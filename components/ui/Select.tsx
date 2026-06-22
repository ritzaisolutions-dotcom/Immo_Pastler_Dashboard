import { cn } from "@/lib/cn";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export default function Select({
  label,
  className,
  id,
  children,
  ...props
}: SelectProps) {
  const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1 block text-[11px] uppercase tracking-wider text-text-hint"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "w-full rounded-[4px] border border-border bg-white px-3 py-1.5 text-sm text-text-primary outline-none focus:border-navy focus:ring-2 focus:ring-navy/10",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
