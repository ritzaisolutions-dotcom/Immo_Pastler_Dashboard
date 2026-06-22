import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

type StatCardProps = {
  label: string;
  value: number;
  icon: LucideIcon;
  href?: string;
  accent?: boolean;
  className?: string;
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  href,
  accent = true,
  className,
}: StatCardProps) {
  const inner = (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-display text-[38px] leading-none text-text-primary">
          {value}
        </p>
        <p className="mt-2 text-xs text-text-secondary">{label}</p>
      </div>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-gold-pale">
        <Icon className="h-5 w-5 text-burgundy" strokeWidth={1.75} />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        <Card accent={accent} className={cn("p-6 shadow-card-hover transition-shadow", className)}>
          {inner}
        </Card>
      </Link>
    );
  }

  return (
    <Card accent={accent} className={cn("p-6", className)}>
      {inner}
    </Card>
  );
}
