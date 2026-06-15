// Template 1 — Checklist do Dossier Técnico-Pedagógico (capa).
// HTML + CSS inline, A4, margens 2cm, Arial. Sem dependências.
// Cabeçalho (3 logos) e rodapé vêm de _shared.ts — partilhados com a
// Ficha de Identificação para ficarem visualmente idênticos.

import {
  SHARED_STYLES,
  renderHeader,
  renderFooter,
  esc,
  fmtDate,
} from "./_shared.js"

export interface ChecklistData {
  courseName: string
  durationHours: number | null
  actionCode: string | null
  startDate: string | null
  endDate: string | null
  localFormacao: string | null
  tipologiaHorario: string | null
  trainers: string[]
  clientName: string | null
  clientLogoUrl: string | null
  tenantName: string
  tenantLogoUrl: string | null
  // DEPRECATED: o logo DGERT é fixo no código (ver _shared.ts). Mantido só
  // para compatibilidade da forma de dados; ignorado no render.
  dgertLogoUrl: string | null
  generatedAt: string
}

const DTP_SECTIONS = [
  "Descrição da Acção",
  "Recursos Formativos",
  "Contrato de Prestação de Serviços",
  "Formadores",
  "Formandos",
  "Acompanhamento da Acção",
  "Avaliação",
  "Relatórios",
  "Outras Informações",
]

export function renderChecklist(d: ChecklistData): {
  html: string
  footerHtml: string
} {
  const sections = DTP_SECTIONS.map(
    (s, i) =>
      `<li><span class="sec-n">${i + 1}.</span> ${esc(s)}
        <span class="sec-chk"></span></li>`
  ).join("")

  const html = `<!doctype html>
<html lang="pt">
<head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 12px; }
  .wrap { padding: 0; }
  ${SHARED_STYLES}
  h1 { font-size: 18px; text-align: center; margin: 28px 0 4px; }
  .subtitle { text-align: center; color: #555; font-size: 12px; margin-bottom: 24px; }
  .idblock { border: 1px solid #d4d4d4; border-radius: 4px; padding: 14px 16px;
    margin-bottom: 24px; }
  .idblock table { width: 100%; border-collapse: collapse; }
  .idblock td { padding: 4px 8px; vertical-align: top; }
  .idblock td.k { width: 130px; color: #555; font-weight: bold; }
  ol.secs { list-style: none; margin: 0; padding: 0; }
  ol.secs li { display: flex; align-items: center; padding: 9px 12px;
    border: 1px solid #e2e2e2; border-radius: 4px; margin-bottom: 6px; }
  .sec-n { font-weight: bold; width: 26px; }
  .sec-chk { margin-left: auto; width: 16px; height: 16px;
    border: 1.5px solid #888; border-radius: 3px; }
</style></head>
<body><div class="wrap">
  ${renderHeader(d)}

  <h1>Dossier Técnico-Pedagógico — Checklist</h1>
  <div class="subtitle">Entidade Formadora Certificada DGERT</div>

  <div class="idblock"><table>
    <tr><td class="k">Curso</td><td>${esc(d.courseName)}</td></tr>
    <tr><td class="k">Acção nº</td><td>${esc(d.actionCode)}</td></tr>
    <tr><td class="k">Data início</td><td>${fmtDate(d.startDate)}</td>
        <td class="k">Data fim</td><td>${fmtDate(d.endDate)}</td></tr>
    <tr><td class="k">Duração</td><td>${
      d.durationHours != null ? d.durationHours + " h" : "—"
    }</td></tr>
    <tr><td class="k">Formador(es)</td><td colspan="3">${
      d.trainers.length ? esc(d.trainers.join(", ")) : "—"
    }</td></tr>
    <tr><td class="k">Local</td><td>${esc(d.localFormacao)}</td>
        <td class="k">Tipologia</td><td>${esc(d.tipologiaHorario)}</td></tr>
  </table></div>

  <ol class="secs">${sections}</ol>
</div></body></html>`

  return { html, footerHtml: renderFooter(d.generatedAt) }
}
