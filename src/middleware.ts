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
 *   /<slug>/admin/*    → ADMIN, OWNER
 *   /<slug>/trainer/*  → TRAINER, ADMIN, OWNER
 *   /<slug>/portal/*   → TRAINEE
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

const ROLE_GUARDS: Array<{
  prefix: string;
  roles: ReadonlyArray<string>;
}> = [
  { prefix: "/admin", roles: ["ADMIN", "OWNER"] },
  { prefix: "/trainer", roles: ["TRAINER", "ADMIN", "OWNER"] },
  { prefix: "/portal", roles: ["TRAINEE"] },
];

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

  // 3. Auth protection for tenant-scoped routes
  const segments = pathname.split("/").filter(Boolean);
  const tenantSlug = segments[0];
  const subPath = segments[1] ? `/${segments[1]}` : "";

  const guard = ROLE_GUARDS.find((g) => subPath === g.prefix || subPath.startsWith(g.prefix));
  if (!guard) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = `/${tenantSlug}/auth/login`;
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // tenant boundary check
  if (session.tenantSlug !== tenantSlug) {
    const url = request.nextUrl.clone();
    url.pathname = `/${session.tenantSlug}/auth/login`;
    return NextResponse.redirect(url);
  }

  // role boundary check
  if (!guard.roles.includes(session.role)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${tenantSlug}/catalog`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|favicon.ico|robots.txt|sitemap.xml).*)"],
};
