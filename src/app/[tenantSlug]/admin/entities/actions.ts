"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

type RequireAdminResult =
  | { ok: true; session: Awaited<ReturnType<typeof getSession>> & object }
  | { ok: false; error: string };

async function requireAdmin(): Promise<RequireAdminResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Não autenticado." };
  if (session.role !== "ADMIN" && session.role !== "OWNER") {
    return { ok: false, error: "Permissão negada." };
  }
  return { ok: true, session };
}

export async function approveEntity(entityId: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const entity = await prisma.entity.findUnique({
    where: { id: entityId },
    select: { tenantId: true, isActive: true },
  });
  if (!entity) return { ok: false, error: "Empresa não encontrada." };
  if (entity.tenantId !== auth.session.tenantId) {
    return { ok: false, error: "Permissão negada (tenant)." };
  }
  if (entity.isActive) {
    return { ok: false, error: "Esta empresa já está aprovada." };
  }

  await prisma.entity.update({
    where: { id: entityId },
    data: { isActive: true },
  });

  revalidatePath(`/${auth.session.tenantSlug}/admin/entities`);
  return { ok: true, message: "Empresa aprovada e ativada." };
}

export async function rejectEntity(
  entityId: string,
  reason: string
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (!reason.trim()) {
    return { ok: false, error: "Indica o motivo de rejeição." };
  }

  const entity = await prisma.entity.findUnique({
    where: { id: entityId },
    select: {
      tenantId: true,
      isActive: true,
      _count: { select: { trainees: true } },
    },
  });
  if (!entity) return { ok: false, error: "Empresa não encontrada." };
  if (entity.tenantId !== auth.session.tenantId) {
    return { ok: false, error: "Permissão negada (tenant)." };
  }
  if (entity.isActive) {
    return {
      ok: false,
      error: "Não é possível rejeitar uma empresa já ativa.",
    };
  }
  if (entity._count.trainees > 0) {
    // Detach trainees instead of deleting
    await prisma.trainee.updateMany({
      where: { entityId },
      data: { entityId: null },
    });
  }

  await prisma.entity.delete({ where: { id: entityId } });

  revalidatePath(`/${auth.session.tenantSlug}/admin/entities`);
  return {
    ok: true,
    message: `Empresa rejeitada · ${reason.trim().slice(0, 60)}`,
  };
}
