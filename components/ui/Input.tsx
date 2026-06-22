import { cn } from "@/lib/cn";

type InputVariant = "light" | "dark";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  variant?: InputVariant;
};

const variantStyles: Record<InputVariant, string> = {
  light:
    "border-border bg-white text-text-primary placeholder:text-text-hint focus:border-navy focus:ring-2 focus:ring-navy/10",
  dark:
    "border-white/20 bg-white/10 text-white placeholder:text-white/55 focus:border-gold focus:ring-2 focus:ring-gold/25",
};

export default function Input({
  label,
  variant = "light",
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "mb-1.5 block text-xs font-medium tracking-wide",
            variant === "dark" ? "text-white/90" : "text-text-primary",
          )}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "w-full rounded-[4px] border px-3 py-2 text-sm outline-none transition-colors",
          variantStyles[variant],
          className,
        )}
        {...props}
      />
    </div>
  );
}
