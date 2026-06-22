/** API prefixes that count toward write rate limits (proxy.ts). */
export const RATE_LIMITED_API_PREFIXES = [
  "/api/todos",
  "/api/partner",
  "/api/partner-nachrichten",
  "/api/inserate",
  "/api/mieter",
] as const;

export const API_WRITE_RATE_LIMIT = {
  limit: 30,
  windowMs: 60_000,
} as const;

const WRITE_METHODS = new Set(["PATCH", "POST", "DELETE"]);

export function isRateLimitedApiWrite(pathname: string, method: string): boolean {
  if (!WRITE_METHODS.has(method)) return false;
  return RATE_LIMITED_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isProtectedApiRoute(pathname: string): boolean {
  return RATE_LIMITED_API_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
