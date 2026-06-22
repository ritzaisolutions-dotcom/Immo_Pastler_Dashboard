import Button from "@/components/ui/Button";

type FormErrorBannerProps = {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export default function FormErrorBanner({
  message,
  onRetry,
  retryLabel = "Erneut versuchen",
}: FormErrorBannerProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-red-200 bg-red-50 px-3 py-2"
      role="alert"
    >
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <Button type="button" variant="secondary" onClick={onRetry} className="shrink-0">
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
