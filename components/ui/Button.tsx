import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "gold" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-navy text-white hover:bg-navy-mid disabled:opacity-60",
  secondary:
    "border border-border bg-white text-text-primary hover:bg-warm-white disabled:opacity-60",
  gold:
    "bg-gold text-burgundy font-medium hover:bg-gold-light disabled:opacity-60",
  ghost:
    "border border-white/20 bg-transparent text-white/70 hover:border-white/40 hover:text-white",
};

export default function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-[2px] px-4 py-2 text-sm transition-colors",
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
