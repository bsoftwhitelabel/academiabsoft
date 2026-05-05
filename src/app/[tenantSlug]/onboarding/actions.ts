"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signMagicLinkToken, sendMagicLinkEmail } from "@/lib/auth";
import { getTenantBySlug } from "@/lib/tenant";

export type OnboardingResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

export type EntitiesPayload = Array<{
  id: string;
  name: string;
  city: string | null;
}>;

export async function listTenantEntities(
  tenantSlug: string
): Promise<EntitiesPayload> {
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) return [];
  return prisma.entity.findMany({
    where: { tenantId: tenant.id, isActive: true },
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });
}

type OnboardingInput = {
  // step 1
  fullName: string;
  email: string;
  phone?: string;
  taxId?: string;
  birthDate?: string;
  // step 2
  entityChoice: "existing" | "new" | "none";
  entityId?: string;
  newEntityName?: string;
  newEntityCity?: string;
  // step 3
  agreedTerms: boolean;
  tenantSlug: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitOnboarding(
  formData: FormData
): Promise<OnboardingResult> {
  const input: OnboardingInput = {
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    taxId: String(formData.get("taxId") ?? "").trim() || undefined,
    birthDate: String(formData.get("birthDate") ?? "").trim() || undefined,
    entityChoice: (String(formData.get("entityChoice") ?? "none") as
      | "existing"
      | "new"
      | "none"),
    entityId: String(formData.get("entityId") ?? "").trim() || undefined,
    newEntityName: String(formData.get("newEntityName") ?? "").trim() || undefined,
    newEntityCity: String(formData.get("newEntityCity") ?? "").trim() || undefined,
    agreedTerms: formData.get("agreedTerms") === "on",
    tenantSlug: String(formData.get("tenantSlug") ?? "").trim(),
  };

  if (!input.fullName || input.fullName.length < 2) {
    return { ok: false, error: "Nome completo inválido." };
  }
  if (!EMAIL_RE.test(input.email)) {
    return { ok: false, error: "Email inválido." };
  }
  if (!input.tenantSlug) {
    return { ok: false, error: "Tenant não identificado." };
  }
  if (!input.agreedTerms) {
    return { ok: false, error: "Tem de aceitar os termos para continuar." };
  }
  if (input.entityChoice === "existing" && !input.entityId) {
    return { ok: false, error: "Selecione a empresa." };
  }
  if (input.entityChoice === "new" && !input.newEntityName) {
    return { ok: false, error: "Indique o nome da empresa." };
  }

  const tenant = await getTenantBySlug(input.tenantSlug);
  if (!tenant) return { ok: false, error: "Tenant não encontrado." };

  // Email duplicate check (per tenant)
  const existing = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: input.email },
    select: { id: true },
  });
  if (existing) {
    return {
      ok: false,
      error:
        "Já existe uma conta com este email. Use o login com magic-link para entrar.",
    };
  }

  // Resolve entity
  let entityId: string | null = null;
  if (input.entityChoice === "existing" && input.entityId) {
    const found = await prisma.entity.findFirst({
      where: { id: input.entityId, tenantId: tenant.id },
      select: { id: true },
    });
    if (!found) return { ok: false, error: "Empresa selecionada inválida." };
    entityId = found.id;
  } else if (input.entityChoice === "new" && input.newEntityName) {
    const created = await prisma.entity.create({
      data: {
        tenantId: tenant.id,
        name: input.newEntityName,
        city: input.newEntityCity ?? null,
        isActive: false, // pending admin approval
      },
      select: { id: true },
    });
    entityId = created.id;
  }

  // Create user + trainee
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: input.email,
      fullName: input.fullName,
      phone: input.phone,
      role: "TRAINEE",
      isActive: true,
      traineeProfile: {
        create: {
          tenantId: tenant.id,
          entityId,
          taxId: input.taxId,
          birthDate: input.birthDate ? new Date(input.birthDate) : null,
        },
      },
    },
    select: { id: true, email: true, fullName: true },
  });

  // Generate magic link
  const token = await signMagicLinkToken({
    userId: user.id,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    email: user.email,
  });

  const baseDomain =
    process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "academiab2.vercel.app";
  const protocol = baseDomain.startsWith("localhost") ? "http" : "https";
  const url = `${protocol}://${baseDomain}/${tenant.slug}/auth/magic-link/verify?token=${token}`;

  await sendMagicLinkEmail({
    to: user.email,
    url,
    tenantName: tenant.name,
    recipientName: user.fullName,
  });

  // ACTION result is propagated, but we redirect to the success page with a token
  redirect(`/${tenant.slug}/onboarding/success?email=${encodeURIComponent(user.email)}`);
}
