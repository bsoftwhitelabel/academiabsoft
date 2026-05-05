import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth/jwt";

/**
 * Multi-tenant routing + auth protection.
 *
 * Resolution priority:
 *   1. Custom domain  (formacao.oportoforte.com)  → rewrite to /<slug>/...
 *   2. Subdomain      (oportoforte.academia.app)  → rewrite to /<slug>/...
 *   3. Path-based     (/oportoforte/...)          → pass through
 *   4. Bare root      (/)                         → redirect to default tenant
 *
 * Auth protection:
 *   /<slug>/admin/*    → ADMIN, OWNER  (strict, redirects to login)
 *   /<slug>/trainer/*  → TRAINER, ADMIN, OWNER  (strict, redirects to login)
 *   /<slug>/portal/*   → permissive — pages render gracefully without auth
 *                        (SessionRequired empty state OR demo data)
 *   everything else    → public
 */

const RESERVED_PATHS = new Set([
  "api",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "manifest.webmanifest",
]);

const DEFAULT_TENANT = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "oportoforte";
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "localhost:3000";

const STRICT_GUARDS: Array<{
  prefix: string;
  roles: ReadonlyArray<string>;
}> = [
  { prefix: "/admin", roles: ["ADMIN", "OWNER"] },
  { prefix: "/trainer", roles: ["TRAINER", "ADMIN", "OWNER"] },
];

const PERMISSIVE_PREFIXES = ["/portal"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  const firstSegment = pathname.split("/")[1];
  if (RESERVED_PATHS.has(firstSegment) || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // 1. Subdomain rewriting (when not on localhost)
  if (hostname && BASE_DOMAIN !== "localhost:3000") {
    const cleanBase = BASE_DOMAIN.replace(/:\d+$/, "");
    const cleanHost = hostname.replace(/:\d+$/, "");
    if (cleanHost !== cleanBase && cleanHost.endsWith(`.${cleanBase}`)) {
      const subdomain = cleanHost.slice(0, -1 - cleanBase.length);
      if (subdomain && subdomain !== "www") {
        const url = request.nextUrl.clone();
        url.pathname = `/${subdomain}${pathname}`;
        return NextResponse.rewrite(url);
      }
    }
  }

  // 2. Bare root → default tenant catalog
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_TENANT}/catalog`;
    return NextResponse.redirect(url);
  }

  // 3. Resolve session (best effort) — used to attach headers when available
  const segments = pathname.split("/").filter(Boolean);
  const tenantSlug = segments[0];
  const subPath = segments[1] ? `/${segments[1]}` : "";

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // 4. Strict auth on /admin and /trainer (sensitive areas)
  const strictGuard = STRICT_GUARDS.find(
    (g) => subPath === g.prefix || subPath.startsWith(g.prefix)
  );

  if (strictGuard) {
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = `/${tenantSlug}/auth/login`;
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
    if (session.tenantSlug !== tenantSlug) {
      const url = request.nextUrl.clone();
      url.pathname = `/${session.tenantSlug}/auth/login`;
      return NextResponse.redirect(url);
    }
    if (!strictGuard.roles.includes(session.role)) {
      const url = request.nextUrl.clone();
      url.pathname = `/${tenantSlug}/catalog`;
      return NextResponse.redirect(url);
    }
  }

  // 5. Permissive zones (/portal): never redirect to login.
  //    Pages render with demo data OR a friendly SessionRequired empty state.
  const isPermissive = PERMISSIVE_PREFIXES.some(
    (p) => subPath === p || subPath.startsWith(p)
  );

  // 6. If we have a valid session, attach headers so server components can
  //    skip re-verifying JWT (avoids Edge/Node AUTH_SECRET inconsistencies).
  if (session) {
    // Tenant boundary check (best effort — non-fatal in permissive zones)
    if (
      session.tenantSlug === tenantSlug ||
      isPermissive ||
      !strictGuard
    ) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-session-user-id", session.userId);
      requestHeaders.set("x-session-tenant-id", session.tenantId);
      requestHeaders.set("x-session-tenant-slug", session.tenantSlug);
      requestHeaders.set("x-session-email", session.email);
      requestHeaders.set("x-session-role", session.role);
      requestHeaders.set("x-session-full-name", encodeURIComponent(session.fullName));
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
  }

  // 7. Stale or invalid cookie? If we got a token but verification failed,
  //    clear it so the user can log in fresh on next attempt without being
  //    stuck in a redirect loop. Only clear in permissive zones to avoid
  //    interfering with the strict-zone redirect flow.
  if (token && !session && isPermissive) {
    const response = NextResponse.next();
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|robots.txt|sitemap.xml).*)"],
};
