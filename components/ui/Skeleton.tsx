import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-[4px] bg-border/60", className)}
    />
  );
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-[4px] border border-border bg-white p-4">
      <Skeleton className="mb-3 h-5 w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={cn("mb-2 h-4", i % 2 === 0 ? "w-full" : "w-2/3")} />
      ))}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 border-b border-border px-4 py-3">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/6" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="ml-auto h-5 w-12" />
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-[4px] border border-border bg-white p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Skeleton className="mb-2 h-10 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-10 w-10 shrink-0 rounded-[4px]" />
      </div>
    </div>
  );
}
