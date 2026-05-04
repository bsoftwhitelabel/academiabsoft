import "server-only";

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Academia Digital <noreply@academia.local>";

const resend = apiKey ? new Resend(apiKey) : null;

type MagicLinkEmail = {
  to: string;
  url: string;
  tenantName: string;
  recipientName: string;
};

export async function sendMagicLinkEmail({
  to,
  url,
  tenantName,
  recipientName,
}: MagicLinkEmail): Promise<{ delivered: boolean; method: "resend" | "console" }> {
  if (!resend) {
    // dev fallback — logs the URL so the engineer can complete the flow
    // eslint-disable-next-line no-console
    console.log(
      [
        "",
        "═══════════════════════════════════════════════════════════════",
        "📧  MAGIC LINK (RESEND_API_KEY not set — dev console fallback)",
        "═══════════════════════════════════════════════════════════════",
        `   Para:     ${to} (${recipientName})`,
        `   Tenant:   ${tenantName}`,
        `   Link:     ${url}`,
        "   Cole no browser para entrar no portal.",
        "═══════════════════════════════════════════════════════════════",
        "",
      ].join("\n")
    );
    return { delivered: true, method: "console" };
  }

  await resend.emails.send({
    from,
    to,
    subject: `${tenantName} — Aceder ao seu portal`,
    html: renderMagicLinkHtml({ url, tenantName, recipientName }),
  });
  return { delivered: true, method: "resend" };
}

function renderMagicLinkHtml({
  url,
  tenantName,
  recipientName,
}: Pick<MagicLinkEmail, "url" | "tenantName" | "recipientName">) {
  return `<!doctype html>
<html lang="pt">
<body style="margin:0;background:#F8F9FF;font-family:-apple-system,Inter,sans-serif;color:#0B1C30">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <div style="background:#0B2447;border-radius:12px;padding:24px;color:#fff;margin-bottom:24px">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:#E9C33F;margin-bottom:8px">${tenantName.toUpperCase()}</div>
      <h1 style="margin:0;font-size:22px;font-weight:700">Olá, ${recipientName}</h1>
    </div>
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px">
      Toque no botão abaixo para aceder ao seu portal de formando. O link é pessoal e expira em 1 hora.
    </p>
    <p style="text-align:center;margin:32px 0">
      <a href="${url}" style="display:inline-block;background:#0B2447;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.02em">Aceder ao Portal</a>
    </p>
    <p style="font-size:13px;color:#44474E;line-height:1.6;margin:24px 0 0">
      Se o botão não funcionar, copie este URL para o browser:<br>
      <span style="word-break:break-all;color:#0B2447">${url}</span>
    </p>
    <hr style="border:none;border-top:1px solid #C4C6CF;margin:32px 0" />
    <p style="font-size:11px;color:#74777F;line-height:1.6">
      Este email foi enviado por ${tenantName}. Se não solicitou este acesso, ignore esta mensagem.
    </p>
  </div>
</body>
</html>`;
}
