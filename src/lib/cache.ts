import "server-only";

import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "./prisma";
import type { TenantContext } from "./tenant";

/**
 * Cache layer for read-heavy queries that change rarely.
 *
 * Strategy:
 * - Tenant data (slug → tenant): cached 1 hour, tag `tenant:<slug>`
 * - Public courses by tenant: cached 5 minutes, tag `courses:<tenantId>`
 * - Areas by tenant: cached 1 hour, tag `areas:<tenantId>`
 *
 * Cache is invalidated via `revalidateTag()` when admin updates content
 * (course create/update, branding change, etc.). Page `/admin/cache`
 * exposes manual invalidation buttons for emergencies.
 *
 * Why this matters: Catalog page renders for every visitor. Without cache,
 * each page hit = 4-5 Prisma queries to Supabase (us-west-2). With cache,
 * most hits are sub-millisecond memory reads.
 */

// ─── Tags ────────────────────────────────────────────────────────────────

export const CACHE_TAGS = {
  tenant: (slug: string) => `tenant:${slug}`,
  tenantById: (id: string) => `tenant-id:${id}`,
  courses: (tenantId: string) => `courses:${tenantId}`,
  course: (slug: string) => `course:${slug}`,
  areas: (tenantId: string) => `areas:${tenantId}`,
  trainingActions: (tenantId: string) => `actions:${tenantId}`,
} as const;

// ─── Cached lookups ──────────────────────────────────────────────────────

export const cachedGetTenantBySlug = (slug: string) =>
  unstable_cache(
    async (): Promise<TenantContext | null> => {
      try {
        return await prisma.tenant.findUnique({
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
      } catch {
        return null;
      }
    },
    [`tenant-by-slug:${slug}`],
    {
      tags: [CACHE_TAGS.tenant(slug)],
      revalidate: 3600, // 1 hour
    }
  )();

export const cachedListAreas = (tenantId: string) =>
  unstable_cache(
    async () => {
      return prisma.trainingArea.findMany({
        where: { tenantId },
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      });
    },
    [`areas:${tenantId}`],
    {
      tags: [CACHE_TAGS.areas(tenantId)],
      revalidate: 3600,
    }
  )();

export const cachedListPublicCourses = (tenantId: string) =>
  unstable_cache(
    async () => {
      return prisma.course.findMany({
        where: {
          tenantId,
          status: "ACTIVE",
          isPublic: true,
        },
        include: {
          trainingArea: { select: { name: true } },
          _count: { select: { trainingActions: true } },
        },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      });
    },
    [`public-courses:${tenantId}`],
    {
      tags: [CACHE_TAGS.courses(tenantId)],
      revalidate: 300, // 5 min
    }
  )();

export const cachedGetCourseBySlug = (tenantId: string, slug: string) =>
  unstable_cache(
    async () => {
      return prisma.course.findUnique({
        where: {
          tenantId_slug: { tenantId, slug },
        },
        include: {
          trainingArea: { select: { id: true, name: true } },
          modules: { orderBy: { order: "asc" } },
        },
      });
    },
    [`course:${tenantId}:${slug}`],
    {
      tags: [CACHE_TAGS.course(slug), CACHE_TAGS.courses(tenantId)],
      revalidate: 600, // 10 min
    }
  )();

// ─── Invalidation API ────────────────────────────────────────────────────

export function invalidateTenantCache(slug: string) {
  revalidateTag(CACHE_TAGS.tenant(slug));
}

export function invalidateCoursesCache(tenantId: string) {
  revalidateTag(CACHE_TAGS.courses(tenantId));
}

export function invalidateAreasCache(tenantId: string) {
  revalidateTag(CACHE_TAGS.areas(tenantId));
}

export function invalidateAllCache(tenantId: string, tenantSlug: string) {
  revalidateTag(CACHE_TAGS.tenant(tenantSlug));
  revalidateTag(CACHE_TAGS.courses(tenantId));
  revalidateTag(CACHE_TAGS.areas(tenantId));
  revalidateTag(CACHE_TAGS.trainingActions(tenantId));
}
