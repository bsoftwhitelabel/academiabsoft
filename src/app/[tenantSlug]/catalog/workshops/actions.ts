"use server";

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Academia Digital <noreply@academia.local>";
const leadsTo =
  process.env.LEADS_EMAIL_TO ??
  process.env.ADMIN_EMAIL ??
  "leads@academia.local";

const resend = apiKey ? new Resend(apiKey) : null;

export type LeadResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

type LeadInput = {
  fullName: string;
  email: string;
  phone?: string;
  company: string;
  companySize?: string;
  programme?: string;
  message?: string;
  tenantSlug: string;
};

export async function submitWorkshopLead(
  formData: FormData
): Promise<LeadResult> {
  const input: LeadInput = {
    fullName: String(formData.get("fullName") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    company: String(formData.get("company") ?? "").trim(),
    companySize: String(formData.get("companySize") ?? "").trim() || undefined,
    programme: String(formData.get("programme") ?? "").trim() || undefined,
    message: String(formData.get("message") ?? "").trim() || undefined,
    tenantSlug: String(formData.get("tenantSlug") ?? "").trim() || "oportoforte",
  };

  if (!input.fullName || input.fullName.length < 2) {
    return { ok: false, error: "Nome completo é obrigatório." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return { ok: false, error: "Email inválido." };
  }
  if (!input.company || input.company.length < 2) {
    return { ok: false, error: "Empresa é obrigatória." };
  }

  const subject = `[Lead Workshops] ${input.company} · ${input.fullName}`;
  const html = buildHtmlLeadEmail(input);
  const text = buildTextLeadEmail(input);

  if (!resend) {
    // eslint-disable-next-line no-console
    console.log(
      [
        "",
        "═══════════════════════════════════════════════════════════════",
        "📩  NEW WORKSHOP LEAD (RESEND_API_KEY not set — console fallback)",
        "═══════════════════════════════════════════════════════════════",
        `   To:       ${leadsTo}`,
        `   Subject:  ${subject}`,
        "",
        text,
        "═══════════════════════════════════════════════════════════════",
        "",
      ].join("\n")
    );
    return {
      ok: true,
      message:
        "Pedido registado. Em ambiente real, recebíamos o lead por email. Vamos contactá-lo em 48h.",
    };
  }

  try {
    await resend.emails.send({
      from,
      to: leadsTo,
      replyTo: input.email,
      subject,
      html,
      text,
    });
    return {
      ok: true,
      message:
        "Pedido enviado. Vamos contactá-lo em 48h com uma proposta personalizada.",
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to send lead email", e);
    return {
      ok: false,
      error:
        "Não foi possível registar o pedido neste momento. Tente novamente.",
    };
  }
}

function buildTextLeadEmail(input: LeadInput): string {
  return [
    "Novo pedido de proposta — Workshops Saúde Mental",
    "",
    `Nome:       ${input.fullName}`,
    `Email:      ${input.email}`,
    input.phone ? `Telefone:   ${input.phone}` : null,
    `Empresa:    ${input.company}`,
    input.companySize ? `Dimensão:   ${input.companySize}` : null,
    input.programme ? `Programa:   ${input.programme}` : null,
    "",
    "Mensagem:",
    input.message ?? "(sem mensagem)",
    "",
    `Tenant:     ${input.tenantSlug}`,
    `Recebido:   ${new Date().toISOString()}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildHtmlLeadEmail(input: LeadInput): string {
  return `<!doctype html>
<html lang="pt">
<body style="margin:0;background:#F8F9FF;font-family:-apple-system,Inter,sans-serif;color:#0B1C30">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px">
    <div style="background:#0B2447;border-radius:12px;padding:20px;color:#fff;margin-bottom:24px">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:#E9C33F;margin-bottom:6px">NOVO LEAD · WORKSHOPS</div>
      <h1 style="margin:0;font-size:22px;font-weight:700">${escapeHtml(input.company)}</h1>
      <div style="font-size:13px;opacity:0.85;margin-top:4px">${escapeHtml(input.fullName)} · ${escapeHtml(input.email)}</div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${row("Empresa", input.company)}
      ${row("Contacto", input.fullName)}
      ${row("Email", `<a href="mailto:${escapeHtml(input.email)}" style="color:#0B2447">${escapeHtml(input.email)}</a>`)}
      ${input.phone ? row("Telefone", input.phone) : ""}
      ${input.companySize ? row("Dimensão", input.companySize) : ""}
      ${input.programme ? row("Programa de interesse", input.programme) : ""}
      ${row("Tenant", input.tenantSlug)}
    </table>

    ${input.message ? `
      <div style="background:#fff;border-left:3px solid #CCA823;padding:16px 20px;margin-top:20px;border-radius:4px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#74777F;margin-bottom:6px">Mensagem</div>
        <div style="font-size:14px;line-height:1.6;color:#0B1C30;white-space:pre-wrap">${escapeHtml(input.message)}</div>
      </div>
    ` : ""}

    <p style="font-size:11px;color:#74777F;margin-top:32px;line-height:1.6">
      Lead capturado via /catalog/workshops · ${new Date().toLocaleString("pt-PT")}
    </p>
  </div>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;border-bottom:1px solid #E2E5EB;font-size:11px;color:#74777F;text-transform:uppercase;letter-spacing:0.06em;font-weight:700;width:40%">${escapeHtml(label)}</td>
    <td style="padding:8px 0;border-bottom:1px solid #E2E5EB;font-size:14px;color:#0B1C30;font-weight:700">${value}</td>
  </tr>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
