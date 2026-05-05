"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

const DOMAIN_RE = /^(?!-)[a-zA-Z0-9-]{1,63}(?:\.[a-zA-Z0-9-]{1,63})+$/;

function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "");
}

export async function updateTenantDomain(
  formData: FormData
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Não autenticado." };
  if (session.role !== "ADMIN" && session.role !== "OWNER") {
    return { ok: false, error: "Permissão negada." };
  }

  const raw = String(formData.get("domain") ?? "").trim();
  const domain = raw === "" ? null : normalizeDomain(raw);

  if (domain !== null) {
    if (!DOMAIN_RE.test(domain)) {
      return {
        ok: false,
        error: "Domínio inválido. Usa formato: formacao.exemplo.com",
      };
    }
    // Check uniqueness across tenants (enforced by @unique but give friendly error)
    const taken = await prisma.tenant.findFirst({
      where: { domain, NOT: { id: session.tenantId } },
      select: { slug: true },
    });
    if (taken) {
      return {
        ok: false,
        error: `Este domínio já está atribuído a outro tenant (${taken.slug}).`,
      };
    }
  }

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { domain },
  });

  revalidatePath(`/${session.tenantSlug}/admin/settings`);

  return {
    ok: true,
    message: domain
      ? `Domínio ${domain} guardado. Configura DNS para ativar.`
      : "Domínio personalizado removido.",
  };
}

export async function updateTenantBranding(
  formData: FormData
): Promise<ActionResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Não autenticado." };
  if (session.role !== "ADMIN" && session.role !== "OWNER") {
    return { ok: false, error: "Permissão negada." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim() || null;
  const primaryColor =
    String(formData.get("primaryColor") ?? "").trim() || null;
  const accentColor = String(formData.get("accentColor") ?? "").trim() || null;
  const dgertCode = String(formData.get("dgertCode") ?? "").trim() || null;

  if (!name) return { ok: false, error: "Nome é obrigatório." };
  if (
    primaryColor &&
    !/^#[0-9A-Fa-f]{6}$/.test(primaryColor)
  ) {
    return { ok: false, error: "Cor primária inválida (usa #RRGGBB)." };
  }
  if (accentColor && !/^#[0-9A-Fa-f]{6}$/.test(accentColor)) {
    return { ok: false, error: "Cor de destaque inválida (usa #RRGGBB)." };
  }

  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { name, logoUrl, primaryColor, accentColor, dgertCode },
  });

  revalidatePath(`/${session.tenantSlug}/admin/settings`);
  return { ok: true, message: "Configurações de marca guardadas." };
}
