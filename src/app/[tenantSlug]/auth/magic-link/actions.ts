"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getTenantBySlug } from "@/lib/tenant";
import { signMagicLinkToken, sendMagicLinkEmail } from "@/lib/auth";

export type MagicLinkState = {
  status?: "idle" | "sent" | "error";
  message?: string;
  email?: string;
  /** Only populated in dev when no Resend key — surfaces URL on the page. */
  devUrl?: string;
};

export async function requestMagicLinkAction(
  _prev: MagicLinkState | undefined,
  formData: FormData
): Promise<MagicLinkState> {
  const tenantSlug = String(formData.get("tenantSlug") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return { status: "error", message: "Insira o email.", email };
  }

  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) {
    return { status: "error", message: "Tenant não encontrado.", email };
  }

  // We deliberately don't reveal if the email exists — privacy
  const user = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email, role: "TRAINEE" },
  });

  if (!user || !user.isActive) {
    // simulate latency to avoid timing-based enumeration
    await new Promise((r) => setTimeout(r, 400));
    return {
      status: "sent",
      email,
      message:
        "Se este email pertencer a um formando ativo, receberá o link em breve.",
    };
  }

  const token = await signMagicLinkToken({
    userId: user.id,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    email: user.email,
  });

  const baseUrl = headers().get("origin") ?? "http://localhost:3000";
  const url = `${baseUrl}/${tenant.slug}/auth/magic-link/verify?token=${encodeURIComponent(token)}`;

  const result = await sendMagicLinkEmail({
    to: user.email,
    url,
    tenantName: tenant.name,
    recipientName: user.fullName,
  });

  return {
    status: "sent",
    email,
    message:
      result.method === "console"
        ? "Modo dev: o link foi escrito no terminal e abaixo (sem Resend)."
        : "Verifique a sua caixa de entrada nos próximos minutos.",
    devUrl: result.method === "console" ? url : undefined,
  };
}
