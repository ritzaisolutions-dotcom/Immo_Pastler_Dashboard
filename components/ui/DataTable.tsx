import { cn } from "@/lib/cn";
import { Card } from "@/components/ui/Card";

export function DataTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </Card>
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="sticky top-0 z-10">
      <tr className="border-b border-border bg-warm-white text-left text-xs uppercase tracking-wider text-text-hint">
        {children}
      </tr>
    </thead>
  );
}

export function TableHeaderCell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <th className={cn("px-4 py-3 font-medium", className)}>{children}</th>;
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      className={cn(
        "border-b border-border last:border-0 transition-colors hover:bg-warm-white/50",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableCell({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={cn("px-4 py-3", className)}>
      {children}
    </td>
  );
}
