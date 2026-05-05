"use server";

import { revalidateTag, revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { CACHE_TAGS } from "@/lib/cache";

export type ActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

async function requireAdmin() {
  const session = await getSession();
  if (!session) return { ok: false as const, error: "Não autenticado." };
  if (session.role !== "ADMIN" && session.role !== "OWNER") {
    return { ok: false as const, error: "Permissão negada." };
  }
  return { ok: true as const, session };
}

export async function clearAllCache(): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // Invalidate every known tag for this tenant
  revalidateTag(CACHE_TAGS.tenant(auth.session.tenantSlug));
  revalidateTag(CACHE_TAGS.tenantById(auth.session.tenantId));
  revalidateTag(CACHE_TAGS.courses(auth.session.tenantId));
  revalidateTag(CACHE_TAGS.areas(auth.session.tenantId));
  revalidateTag(CACHE_TAGS.trainingActions(auth.session.tenantId));

  // Force revalidate of common public paths
  revalidatePath(`/${auth.session.tenantSlug}/catalog`, "page");

  return {
    ok: true,
    message: "Cache limpa. Próxima visita força refetch dos dados.",
  };
}

export async function clearCoursesCache(): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  revalidateTag(CACHE_TAGS.courses(auth.session.tenantId));
  revalidatePath(`/${auth.session.tenantSlug}/catalog`, "page");
  return { ok: true, message: "Cache de cursos limpa." };
}

export async function clearTenantCache(): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  revalidateTag(CACHE_TAGS.tenant(auth.session.tenantSlug));
  revalidateTag(CACHE_TAGS.tenantById(auth.session.tenantId));
  return { ok: true, message: "Cache do tenant limpa (branding, domínio)." };
}

export async function clearAreasCache(): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  revalidateTag(CACHE_TAGS.areas(auth.session.tenantId));
  return { ok: true, message: "Cache de áreas de formação limpa." };
}
