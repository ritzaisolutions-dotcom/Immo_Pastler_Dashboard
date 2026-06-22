import { cn } from "@/lib/cn";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export default function Textarea({ label, className, id, ...props }: TextareaProps) {
  const textareaId =
    id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div>
      {label && (
        <label htmlFor={textareaId} className="mb-1 block text-xs text-text-hint">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          "w-full rounded-[4px] border border-border bg-white px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-navy focus:ring-2 focus:ring-navy/10",
          className,
        )}
        {...props}
      />
    </div>
  );
}
