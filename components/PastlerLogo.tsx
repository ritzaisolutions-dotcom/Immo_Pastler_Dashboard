import Image from "next/image";

type PastlerLogoProps = {
  variant?: "dark" | "light";
  showWordmark?: boolean;
  className?: string;
};

export default function PastlerLogo({
  variant = "dark",
  showWordmark = false,
  className = "",
}: PastlerLogoProps) {
  const wordmarkClass =
    variant === "dark"
      ? "text-white"
      : "text-burgundy";

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Image
        src="/JPlogo-png.avif"
        alt="Pastler Immobilienverwaltung — Hausverwaltung Koblenz"
        width={120}
        height={132}
        className="h-auto w-[88px]"
        priority
      />
      {showWordmark && (
        <p
          className={`mt-3 font-display text-sm tracking-[3px] ${wordmarkClass}`}
        >
          PASTLER<span className="text-gold">.</span>
        </p>
      )}
    </div>
  );
}
