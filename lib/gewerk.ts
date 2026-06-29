const UMLAUT_MAP: Record<string, string> = {
  ä: "ae",
  ö: "oe",
  ü: "ue",
  ß: "ss",
};

export function slugifyGewerkLabel(label: string): string {
  const normalized = label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const replaced = normalized
    .split("")
    .map((char) => UMLAUT_MAP[char] ?? char)
    .join("");

  const slug = replaced
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

  return slug || "gewerk";
}

export function isValidGewerkKey(key: string): boolean {
  return /^[a-z][a-z0-9_]{0,39}$/.test(key);
}

export function humanizeGewerkKey(key: string): string {
  return key
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function gewerkDisplayLabel(
  key: string,
  gewerke?: ReadonlyArray<{ key: string; label: string }>,
): string {
  const found = gewerke?.find((g) => g.key === key);
  return found?.label ?? humanizeGewerkKey(key);
}
