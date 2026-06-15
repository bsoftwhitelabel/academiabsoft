// Template 5 — Plano de Sessão (1 PDF por SESSÃO; via /generate-mass).
// 6 secções; texto pode ser longo (white-space:pre-wrap) ou vazio
// ("Por preencher"). Cada secção evita quebra a meio (page-break-inside).
// Cabeçalho/rodapé partilhados via _shared.ts.

import { SHARED_STYLES, renderHeader, renderFooter, esc, fmtDate } from "./_shared.js"

export interface PlanoSessaoData {
  courseName: string | null
  actionCode: string | null
  clientName: string | null
  clientLogoUrl: string | null
  tenantName: string
  tenantLogoUrl: string | null
  sessionDate: string | null
  startTime: string | null
  endTime: string | null
  sessionType: string | null // TEORICA | PRATICA | MISTA | null
  moduleName: string | null
  trainerName: string | null
  objetivos: string | null
  introducao: string | null
  desenvolvimento: string | null
  conclusao: string | null
  avaliacao: string | null
  recursos: string[] | null // didacticResources (text[])
  generatedAt: string
}

const TYPE_LABEL: Record<string, string> = {
  TEORICA: "Teórica",
  PRATICA: "Prática",
  MISTA: "Mista",
}

const EMPTY = `<em class="empty">Por preencher</em>`

function textSection(title: string, value: string | null): string {
  const content = value && value.trim() ? esc(value) : EMPTY
  return `<div class="section">
    <h2>${esc(title)}</h2>
    <div class="content">${content}</div>
  </div>`
}

function resourcesSection(items: string[] | null): string {
  const has = Array.isArray(items) && items.length > 0
  const body = has
    ? `<ul class="resources">${items!
        .map((r) => `<li>${esc(r)}</li>`)
        .join("")}</ul>`
    : EMPTY
  return `<div class="section">
    <h2>Recursos / Materiais Pedagógicos</h2>
    <div class="content">${body}</div>
  </div>`
}

export function renderPlanoSessao(d: PlanoSessaoData): {
  html: string
  footerHtml: string
} {
  const tipo = d.sessionType
    ? (TYPE_LABEL[d.sessionType] ?? esc(d.sessionType))
    : "—"
  const horario =
    d.startTime || d.endTime
      ? `das ${esc(d.startTime ?? "—")} às ${esc(d.endTime ?? "—")}`
      : "—"

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
  .subtitle { text-align: center; color: #555; font-size: 12px; margin-bottom: 14px; }
  .idbanner { border: 1px solid #cfe6d8; background: #f3faf6; border-radius: 4px;
    padding: 10px 14px; margin: 12px 0 20px; font-size: 11px; line-height: 1.6; }
  .idbanner b { color: #046b39; }
  .section { page-break-inside: avoid; margin-bottom: 16px; }
  .section h2 { font-size: 14px; color: #046b39; margin: 0 0 8px;
    border-bottom: 1.5px solid #cfe6d8; padding-bottom: 3px; }
  .section .content { font-size: 11px; line-height: 1.5; white-space: pre-wrap;
    word-wrap: break-word; overflow-wrap: anywhere; }
  .empty { color: #999; font-style: italic; }
  ul.resources { margin: 0; padding-left: 18px; }
  ul.resources li { margin-bottom: 3px; }
  .signature-block { margin-top: 36px; page-break-inside: avoid; }
  .signature-block .who { font-size: 11px; color: #555; }
  .signature-block .line { border-bottom: 1px solid #999; height: 1px;
    width: 280px; margin: 26px 0 6px; }
  .signature-block .date { font-size: 11px; color: #555; }
</style></head>
<body><div class="wrap">
  ${renderHeader(d)}

  <h1>Plano de Sessão</h1>
  <div class="subtitle">Entidade Formadora Certificada DGERT</div>

  <div class="idbanner">
    <div><b>Curso:</b> ${esc(d.courseName)} &nbsp;·&nbsp; <b>Acção nº:</b> ${esc(
    d.actionCode
  )}</div>
    <div><b>Sessão do dia</b> ${fmtDate(d.sessionDate)}, ${horario}</div>
    <div><b>Módulo:</b> ${esc(d.moduleName ?? "—")} &nbsp;·&nbsp;
      <b>Tipo:</b> ${tipo} &nbsp;·&nbsp;
      <b>Formador:</b> ${esc(d.trainerName ?? "—")}</div>
  </div>

  ${textSection("Objectivos", d.objetivos)}
  ${textSection("Introdução", d.introducao)}
  ${textSection("Desenvolvimento", d.desenvolvimento)}
  ${textSection("Conclusão", d.conclusao)}
  ${resourcesSection(d.recursos)}
  ${textSection("Forma de Avaliação", d.avaliacao)}

  <div class="signature-block">
    <div class="who">O Formador:</div>
    <div class="line"></div>
    <div class="date">Data: ___ / ___ / ______</div>
  </div>
</div></body></html>`

  return { html, footerHtml: renderFooter(d.generatedAt) }
}
