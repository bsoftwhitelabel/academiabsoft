// Template 3 — Folha de Presenças (1 por SESSÃO da acção).
// Tabela PARTICIPANTES | ASSINATURA com 1 linha por formando inscrito
// (status != CANCELLED) pré-populada, assinatura em branco (à caneta).
// Cabeçalho/rodapé partilhados com Checklist/Ficha via _shared.ts.

import { SHARED_STYLES, renderHeader, renderFooter, esc, fmtDate } from "./_shared.js"

export interface FolhaPresencasData {
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
  trainees: { id: string; name: string }[]
  generatedAt: string
}

const SESSION_TYPE_LABEL: Record<string, string> = {
  TEORICA: "Teórica",
  PRATICA: "Prática",
  MISTA: "Mista",
}

function rowsFor(trainees: { id: string; name: string }[]): string {
  // Linhas dos formandos + 2 linhas extra vazias (visitas/imprevistos).
  const real = trainees.map(
    (t, i) =>
      `<tr><td class="n">${i + 1}</td><td class="p">${esc(t.name)}</td><td class="s"></td></tr>`
  )
  const extra = [0, 1].map(
    () => `<tr><td class="n"></td><td class="p"></td><td class="s"></td></tr>`
  )
  return real.concat(extra).join("")
}

export function renderFolhaPresencas(d: FolhaPresencasData): {
  html: string
  footerHtml: string
} {
  const tipo = d.sessionType
    ? (SESSION_TYPE_LABEL[d.sessionType] ?? esc(d.sessionType))
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
  .subtitle { text-align: center; color: #555; font-size: 12px; margin-bottom: 18px; }
  .sess { border: 1px solid #d4d4d4; border-radius: 4px; padding: 12px 14px;
    margin-bottom: 16px; }
  .sess .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 24px; }
  .sess .k { color: #555; font-weight: bold; font-size: 11px; }
  .sess .full { grid-column: 1 / -1; }
  table.pres { width: 100%; border-collapse: collapse; }
  table.pres th { background: #f3faf6; border: 1px solid #cfe6d8; color: #046b39;
    font-size: 11px; padding: 7px 8px; text-align: left; }
  table.pres td { border: 1px solid #d4d4d4; padding: 6px 8px; height: 35px;
    vertical-align: middle; }
  table.pres td.n { width: 28px; text-align: center; color: #777; }
  table.pres td.p { width: 57%; }
  table.pres td.s { width: 40%; }
  table.pres tr { page-break-inside: avoid; }
  .blk { border: 1px solid #d4d4d4; border-radius: 4px; padding: 10px 14px;
    margin-top: 14px; }
  .blk .k { color: #555; font-weight: bold; font-size: 11px; display: block;
    margin-bottom: 14px; }
  .line { display: block; border-bottom: 1px solid #999; height: 1px; }
  .trainer { display: flex; gap: 40px; margin-top: 14px; }
  .trainer .fld { flex: 1; }
  .trainer .k { color: #555; font-weight: bold; font-size: 11px; display: block; }
  .trainer .v { margin-top: 4px; }
  .trainer .sign { margin-top: 22px; border-bottom: 1px solid #999; height: 1px; }
</style></head>
<body><div class="wrap">
  ${renderHeader(d)}

  <h1>Folha de Presenças</h1>
  <div class="subtitle">Entidade Formadora Certificada DGERT</div>

  <div class="sess"><div class="grid">
    <div><span class="k">DATA:</span> ${fmtDate(d.sessionDate)}</div>
    <div><span class="k">HORÁRIO:</span> ${horario}</div>
    <div><span class="k">MÓDULO:</span> ${esc(d.moduleName ?? "—")}</div>
    <div><span class="k">SESSÃO:</span> ${tipo}</div>
    <div class="full"><span class="k">CURSO:</span> ${esc(
      d.courseName
    )} &nbsp;·&nbsp; <span class="k">ACÇÃO Nº:</span> ${esc(d.actionCode)}</div>
  </div></div>

  <table class="pres">
    <thead><tr>
      <th class="n">#</th><th>PARTICIPANTES</th><th>ASSINATURA</th>
    </tr></thead>
    <tbody>${rowsFor(d.trainees)}</tbody>
  </table>

  <div class="blk">
    <span class="k">Materiais e Equipamentos Pedagógicos</span>
    <span class="line"></span>
  </div>

  <div class="trainer">
    <div class="fld">
      <span class="k">NOME DO FORMADOR</span>
      <div class="v">${esc(d.trainerName ?? "—")}</div>
    </div>
    <div class="fld">
      <span class="k">ASSINATURA</span>
      <div class="sign"></div>
    </div>
  </div>
</div></body></html>`

  return { html, footerHtml: renderFooter(d.generatedAt) }
}
