// Template 4 — Registo de Sumários (1 PDF por ACÇÃO; agrega todas as sessões).
// Réplica do "Registo de Sumários" do BT-SOFT. Cabeçalho/rodapé via _shared.

import {
  SHARED_STYLES,
  DGERT_LOGO_BASE64,
  renderHeader,
  renderFooter,
  esc,
  fmtDate,
} from "./_shared.js"

export interface RegistoSumariosSession {
  sessionDate: string | null
  startTime: string | null
  endTime: string | null
  summary: string | null
  trainerSignatureUrl: string | null
  moduleName: string | null
  trainerName: string | null
}

export interface RegistoSumariosData {
  courseName: string | null
  durationHours: number | null
  actionCode: string | null
  startDate: string | null
  endDate: string | null
  tipologiaHorario: string | null // LABORAL | POS_LABORAL | MISTO | null
  format: string | null // PRESENCIAL | ELEARNING | null
  clientName: string | null
  clientLogoUrl: string | null
  tenantName: string
  tenantLogoUrl: string | null
  sessions: RegistoSumariosSession[]
  generatedAt: string
}

const TIPOLOGIA_LABEL: Record<string, string> = {
  LABORAL: "Laboral",
  POS_LABORAL: "Pós-laboral",
  MISTO: "Misto",
}
const FORMAT_LABEL: Record<string, string> = {
  PRESENCIAL: "Presencial",
  ELEARNING: "E-Learning",
}

export function renderRegistoSumarios(d: RegistoSumariosData): {
  html: string
  footerHtml: string
} {
  const tipologia = d.tipologiaHorario
    ? (TIPOLOGIA_LABEL[d.tipologiaHorario] ?? esc(d.tipologiaHorario))
    : "—"
  const forma = d.format
    ? (FORMAT_LABEL[d.format] ?? esc(d.format))
    : "—"
  const codigo = d.actionCode ? ` (${esc(d.actionCode)})` : ""

  const rows = d.sessions
    .map(
      (s) => `<tr>
      <td>${esc(s.moduleName ?? "—")}</td>
      <td>${fmtDate(s.sessionDate)}</td>
      <td>${
        s.startTime || s.endTime
          ? `Das ${esc(s.startTime ?? "—")} às ${esc(s.endTime ?? "—")}`
          : "—"
      }</td>
      <td>${esc(s.trainerName ?? "—")}</td>
      <td class="rub">${
        s.trainerSignatureUrl
          ? `<img class="signature" src="${s.trainerSignatureUrl}" alt="rubrica"/>`
          : ""
      }</td>
      <td class="sum">${esc(s.summary ?? "")}</td>
    </tr>`
    )
    .join("")

  const html = `<!doctype html>
<html lang="pt">
<head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 12px; }
  .wrap { padding: 0; }
  ${SHARED_STYLES}
  h1 { font-size: 18px; text-align: center; margin: 26px 0 4px; }
  .subtitle { text-align: center; color: #555; font-size: 12px; margin-bottom: 18px; }
  table.info { width: 100%; border-collapse: collapse; margin-bottom: 18px;
    font-size: 11px; }
  table.info td { border: 1px solid #ccc; padding: 7px 9px; vertical-align: top; }
  table.info b { color: #046b39; }
  table.summaries { width: 100%; border-collapse: collapse; table-layout: fixed; }
  table.summaries th { background: #f3faf6; border: 1px solid #cfe6d8;
    color: #046b39; font-size: 10.5px; padding: 8px; text-align: left; }
  table.summaries td { border: 1px solid #ccc; padding: 8px;
    vertical-align: top; font-size: 11px; }
  table.summaries col.c1 { width: 12%; }
  table.summaries col.c2 { width: 10%; }
  table.summaries col.c3 { width: 14%; }
  table.summaries col.c4 { width: 18%; }
  table.summaries col.c5 { width: 10%; }
  table.summaries col.c6 { width: 36%; }
  table.summaries tbody tr { page-break-inside: avoid; }
  td.sum { font-size: 10px; line-height: 1.3; word-wrap: break-word;
    overflow-wrap: anywhere; }
  td.rub { text-align: center; }
  img.signature { max-height: 40px; max-width: 120px; }
  .dgert-seal { margin-top: 26px; text-align: right; }
  .dgert-seal img { height: 70px; }
</style></head>
<body><div class="wrap">
  ${renderHeader(d)}

  <h1>Registo de Sumários</h1>
  <div class="subtitle">Entidade Formadora Certificada DGERT</div>

  <table class="info">
    <tr><td colspan="2"><b>Curso:</b> ${esc(d.courseName)}${codigo}</td></tr>
    <tr><td><b>Duração:</b> ${
      d.durationHours != null ? d.durationHours + " Horas" : "—"
    }</td>
        <td><b>Cód. da Acção:</b> ${esc(d.actionCode)}</td></tr>
    <tr><td><b>Data de início:</b> ${fmtDate(d.startDate)}</td>
        <td><b>Data de fim:</b> ${fmtDate(d.endDate)}</td></tr>
    <tr><td><b>Tipologia de Horário:</b> ${tipologia}</td>
        <td><b>Forma de Organização:</b> ${forma}</td></tr>
    <tr><td colspan="2"><b>Cliente:</b> ${esc(d.clientName)}</td></tr>
  </table>

  <table class="summaries">
    <colgroup>
      <col class="c1"/><col class="c2"/><col class="c3"/>
      <col class="c4"/><col class="c5"/><col class="c6"/>
    </colgroup>
    <thead><tr>
      <th>Módulo/Tema</th><th>Data</th><th>Horário da Sessão</th>
      <th>Formador/E-Formador</th><th>Rubrica</th><th>Sumário</th>
    </tr></thead>
    <tbody>${
      rows ||
      `<tr><td colspan="6" style="text-align:center;color:#777;padding:18px">Sem sessões registadas.</td></tr>`
    }</tbody>
  </table>

  <div class="dgert-seal">
    <img src="${DGERT_LOGO_BASE64}" alt="Entidade Formadora Certificada DGERT"/>
  </div>
</div></body></html>`

  return { html, footerHtml: renderFooter(d.generatedAt) }
}
