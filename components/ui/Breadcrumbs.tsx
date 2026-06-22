"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  todos: "Todos",
  mieter: "Mieter",
  inserate: "Inserate",
  partner: "Partner",
  emails: "E-Mails",
  neu: "Neu",
  bearbeiten: "Bearbeiten",
  datenschutz: "Datenschutz",
};

function segmentLabel(segment: string, index: number, segments: string[]): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  if (index === segments.length - 1 && segments.length > 1) return "Detail";
  return segment;
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join("/")}`;
    const label = segmentLabel(segment, index, segments);
    const isLast = index === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-[13px]">
      <Link
        href="/dashboard"
        className="flex shrink-0 items-center text-text-hint transition-colors hover:text-navy"
        aria-label="Dashboard"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex min-w-0 items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-hint" />
          {crumb.isLast ? (
            <span
              className="truncate font-medium text-text-primary"
              aria-current="page"
            >
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="truncate text-text-secondary transition-colors hover:text-navy"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
