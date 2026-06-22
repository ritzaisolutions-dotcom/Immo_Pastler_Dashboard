import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

type EmptyStateProps = {
  children: React.ReactNode;
  icon?: LucideIcon;
  action?: { label: string; href: string };
  className?: string;
};

export default function EmptyState({
  children,
  icon: Icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[4px] bg-warm-white">
          <Icon className="h-6 w-6 text-text-hint" strokeWidth={1.5} />
        </div>
      )}
      <p className="text-sm text-text-secondary">{children}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-4 inline-flex items-center justify-center rounded-[2px] bg-navy px-4 py-2 text-sm text-white transition-colors hover:bg-navy-mid"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
