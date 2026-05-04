"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { verifyPassword, createSession, roleHomePath } from "@/lib/auth";

export type LoginState = {
  error?: string;
  email?: string;
};

export async function loginAction(
  _prev: LoginState | undefined,
  formData: FormData
): Promise<LoginState> {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Preencha email e password.", email };
  }
  if (!tenantSlug) {
    return { error: "Tenant inválido.", email };
  }

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return { error: "Tenant não encontrado.", email };
  }

  const user = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email },
  });

  if (!user || !user.passwordHash) {
    return { error: "Credenciais inválidas.", email };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { error: "Credenciais inválidas.", email };
  }

  if (!user.isActive) {
    return { error: "Conta desativada. Contacte o administrador.", email };
  }

  await createSession({
    userId: user.id,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  redirect(roleHomePath(user.role, tenant.slug));
}
