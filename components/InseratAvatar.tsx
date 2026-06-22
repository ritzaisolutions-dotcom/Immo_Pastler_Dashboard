import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/cn";

type InseratAvatarProps = {
  adresse: string;
  bildUrl?: string | null;
  size?: "sm" | "lg";
  href?: string;
  className?: string;
};

function initials(adresse: string): string {
  const parts = adresse.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export default function InseratAvatar({
  adresse,
  bildUrl,
  size = "sm",
  href,
  className,
}: InseratAvatarProps) {
  const dim = size === "lg" ? 96 : 48;
  const textSize = size === "lg" ? "text-xl" : "text-sm";

  const inner = (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border border-border bg-gold-pale",
        className,
      )}
      style={{ width: dim, height: dim }}
    >
      {bildUrl ? (
        <Image
          src={bildUrl}
          alt=""
          width={dim}
          height={dim}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          className={cn(
            "flex h-full w-full items-center justify-center font-display text-burgundy",
            textSize,
          )}
        >
          {initials(adresse)}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block transition-opacity hover:opacity-90">
        {inner}
      </Link>
    );
  }

  return inner;
}
