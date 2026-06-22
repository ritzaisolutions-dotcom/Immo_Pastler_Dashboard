import Link from "next/link";
import InseratAvatar from "@/components/InseratAvatar";
import Button from "@/components/ui/Button";

type ProfileHeaderProps = {
  adresse: string;
  subtitle?: string | null;
  bildUrl?: string | null;
  editHref?: string;
};

export default function ProfileHeader({
  adresse,
  subtitle,
  bildUrl,
  editHref,
}: ProfileHeaderProps) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-6">
      <div className="flex items-start gap-5">
        <InseratAvatar adresse={adresse} bildUrl={bildUrl} size="lg" />
        <div>
          <h1 className="font-display text-3xl text-burgundy">{adresse}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>
          )}
        </div>
      </div>
      {editHref && (
        <Link href={editHref}>
          <Button variant="secondary">Bearbeiten</Button>
        </Link>
      )}
    </div>
  );
}
