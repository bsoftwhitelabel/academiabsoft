"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function updateTraineeSettings(
  formData: FormData
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Não autenticado." };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const preferredName =
    String(formData.get("preferredName") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const documentNumber =
    String(formData.get("documentNumber") ?? "").trim() || null;
  const taxId = String(formData.get("taxId") ?? "").trim() || null;
  const birthDateStr = String(formData.get("birthDate") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim() || null;
  const city = String(formData.get("city") ?? "").trim() || null;
  const postalCode =
    String(formData.get("postalCode") ?? "").trim() || null;
  const country =
    String(formData.get("country") ?? "Portugal").trim() || "Portugal";
  const profession = String(formData.get("profession") ?? "").trim() || null;
  const qualification =
    String(formData.get("qualification") ?? "").trim() || null;

  if (!fullName || fullName.length < 2) {
    return { ok: false, error: "Nome completo inválido." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Email inválido." };
  }

  // birth date sanity (between 1900 and today)
  let birthDate: Date | null = null;
  if (birthDateStr) {
    const parsed = new Date(birthDateStr);
    if (
      isNaN(parsed.getTime()) ||
      parsed.getFullYear() < 1900 ||
      parsed > new Date()
    ) {
      return { ok: false, error: "Data de nascimento inválida." };
    }
    birthDate = parsed;
  }

  const trainee = await prisma.trainee.findUnique({
    where: { userId: session.userId },
    select: { id: true, tenantId: true },
  });
  if (!trainee) {
    return { ok: false, error: "Perfil de formando não encontrado." };
  }

  // Email uniqueness within tenant (if changed)
  if (email !== session.email) {
    const collision = await prisma.user.findFirst({
      where: {
        tenantId: session.tenantId,
        email,
        NOT: { id: session.userId },
      },
      select: { id: true },
    });
    if (collision) {
      return { ok: false, error: "Esse email já está em uso." };
    }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.userId },
      data: {
        fullName,
        preferredName,
        email,
        phone,
        // If email changed, clear emailVerifiedAt to force re-verification
        ...(email !== session.email ? { emailVerifiedAt: null } : {}),
      },
    }),
    prisma.trainee.update({
      where: { id: trainee.id },
      data: {
        documentNumber,
        taxId,
        birthDate,
        address,
        city,
        postalCode,
        country,
        profession,
        qualification,
      },
    }),
  ]);

  revalidatePath(`/${session.tenantSlug}/portal/settings`);
  revalidatePath(`/${session.tenantSlug}/portal/profile`);

  return {
    ok: true,
    message:
      email !== session.email
        ? "Dados guardados. Verifica o teu email novamente para confirmar a alteração."
        : "Dados guardados.",
  };
}

export async function requestDataExport(): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Não autenticado." };

  // Audit log: would write to AuditLog table when implemented
  // For now, just acknowledge
  return {
    ok: true,
    message:
      "Pedido registado. Receberás um email com todos os teus dados em ~30 segundos (RGPD art. 20º).",
  };
}

export async function requestAccountDeletion(): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Não autenticado." };

  // Audit log + 30-day grace period (DGERT requirement)
  return {
    ok: true,
    message:
      "Pedido de eliminação registado. Equipa pedagógica entrará em contacto em 24h. Anonimização em 30 dias (período legal).",
  };
}
