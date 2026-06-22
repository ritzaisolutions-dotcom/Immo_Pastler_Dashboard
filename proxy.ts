import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  API_WRITE_RATE_LIMIT,
  isProtectedApiRoute,
  isRateLimitedApiWrite,
} from "@/lib/rate-limit-paths";
import { rateLimit } from "@/lib/rate-limit";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

const protectedPaths = [
  "/dashboard",
  "/todos",
  "/mieter",
  "/inserate",
  "/vermieter",
  "/datenschutz",
  "/partner",
  "/emails",
];

function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isMitarbeiter(user: { app_metadata?: Record<string, unknown> } | null): boolean {
  if (!user) return false;
  return user.app_metadata?.role === "mitarbeiter";
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isApiRoute = isProtectedApiRoute(pathname);

  if (!user && isApiRoute) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isMitarbeiterOnlyRoute =
    pathname.startsWith("/partner") ||
    pathname.startsWith("/vermieter") ||
    pathname.startsWith("/api/partner") ||
    pathname.startsWith("/api/vermieter") ||
    pathname.startsWith("/api/partner-nachrichten") ||
    pathname.startsWith("/emails") ||
    pathname.startsWith("/inserate/neu") ||
    pathname.match(/^\/inserate\/[^/]+\/bearbeiten$/) ||
    pathname.startsWith("/mieter/neu") ||
    pathname.match(/^\/mieter\/[^/]+\/bearbeiten$/);

  if (user && isMitarbeiterOnlyRoute && !isMitarbeiter(user)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (isRateLimitedApiWrite(pathname, request.method)) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const limited = rateLimit(
      `api-write:${ip}`,
      API_WRITE_RATE_LIMIT.limit,
      API_WRITE_RATE_LIMIT.windowMs,
    );
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: { "Retry-After": String(limited.retryAfterSec) },
        },
      );
    }
  }

  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/dashboard" : "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/dashboard/:path*",
    "/todos",
    "/todos/:path*",
    "/mieter",
    "/mieter/:path*",
    "/inserate",
    "/inserate/:path*",
    "/datenschutz",
    "/partner",
    "/partner/:path*",
    "/vermieter",
    "/vermieter/:path*",
    "/emails",
    "/emails/:path*",
    "/api/todos/:path*",
    "/api/partner",
    "/api/partner/:path*",
    "/api/vermieter",
    "/api/vermieter/:path*",
    "/api/partner-nachrichten/:path*",
    "/api/inserate",
    "/api/inserate/:path*",
    "/api/mieter",
    "/api/mieter/:path*",
    "/login",
  ],
};
