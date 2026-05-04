/**
 * Tenant resolution helpers.
 *
 * Resolution order in `middleware.ts`:
 *   1. Custom domain match (Tenant.domain == request.hostname)
 *   2. Subdomain match (request.hostname starts with `<slug>.`)
 *   3. Path prefix match (URL begins with /<slug>/)
 *   4. Default tenant slug (env)
 *
 * Mock implementation now — DB-backed once we have data.
 */

import { prisma } from "./prisma";

export type TenantContext = {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
};

const DEFAULT_SLUG = process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG ?? "oportoforte";

export async function getTenantBySlug(slug: string): Promise<TenantContext | null> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        domain: true,
        logoUrl: true,
        primaryColor: true,
        accentColor: true,
      },
    });
    return tenant;
  } catch {
    // DB not reachable — fall back to mock for local dev/demo
    return mockTenant(slug);
  }
}

export async function getTenantByDomain(domain: string): Promise<TenantContext | null> {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { domain },
      select: {
        id: true,
        slug: true,
        name: true,
        domain: true,
        logoUrl: true,
        primaryColor: true,
        accentColor: true,
      },
    });
    return tenant;
  } catch {
    return null;
  }
}

export function getDefaultTenantSlug(): string {
  return DEFAULT_SLUG;
}

/**
 * Mock fallback for local dev — returns a tenant context without DB.
 * Replace with real DB lookup once Postgres is wired.
 */
function mockTenant(slug: string): TenantContext {
  const known: Record<string, TenantContext> = {
    oportoforte: {
      id: "tenant_oportoforte",
      slug: "oportoforte",
      name: "Grupo Oporto Forte",
      domain: null,
      logoUrl: null,
      primaryColor: "#0B2447",
      accentColor: "#CCA823",
    },
  };
  return (
    known[slug] ?? {
      id: `tenant_${slug}`,
      slug,
      name: slug.charAt(0).toUpperCase() + slug.slice(1),
      domain: null,
      logoUrl: null,
      primaryColor: null,
      accentColor: null,
    }
  );
}
