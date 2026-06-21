// Cabeçalho/rodapé PARTILHADOS pelos templates de PDF (Checklist, Ficha de
// Identificação, …). Mantém os dois visualmente idênticos no topo/fundo.
//
// LOGÓTIPO DGERT — FIXO NO CÓDIGO.
// O selo "Entidade Formadora Certificada DGERT" é um selo regulatório, igual
// para todos os tenants, e o ficheiro oficial só está disponível na área
// reservada autenticada de cada entidade no balcão DGERT (não é descarregável
// publicamente). Por isso embebemo-lo aqui em base64 (SVG, ~2.2 KB) em vez de
// depender da BD.
//
// ⚠️ tenants.dgertLogoUrl está DEPRECATED — já NÃO é usado para render. Pode
// ser removido do schema numa migração futura. Não voltar a ligar esse campo
// ao cabeçalho.

export const DGERT_LOGO_BASE64 =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0ODAgMTA0IiByb2xlPSJpbWciIGFyaWEtbGFiZWw9IkVudGlkYWRlIEZvcm1hZG9yYSBDZXJ0aWZpY2FkYSBER0VSVCI+CjxkZWZzPjxsaW5lYXJHcmFkaWVudCBpZD0iZyIgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzBhOGE0YSIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzA0NmIzOSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPgo8cmVjdCB4PSIxIiB5PSIxIiB3aWR0aD0iNDc4IiBoZWlnaHQ9IjEwMiIgcng9IjEwIiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiMwNDZiMzkiIHN0cm9rZS13aWR0aD0iMiIvPgo8cmVjdCB4PSIxIiB5PSIxIiB3aWR0aD0iMTIyIiBoZWlnaHQ9IjEwMiIgcng9IjEwIiBmaWxsPSJ1cmwoI2cpIi8+CjxyZWN0IHg9IjExMyIgeT0iMSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwMiIgZmlsbD0idXJsKCNnKSIvPgo8Y2lyY2xlIGN4PSI2MiIgY3k9IjUyIiByPSIzNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIuNSIvPgo8Y2lyY2xlIGN4PSI2MiIgY3k9IjUyIiByPSIyNyIgZmlsbD0iI2ZmZmZmZiIvPgo8cGF0aCBkPSJNNDkgNTMgbDkgOSBsMTggLTIwIiBmaWxsPSJub25lIiBzdHJva2U9IiMwNDZiMzkiIHN0cm9rZS13aWR0aD0iNiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGQ9Ik00MSA3MCBxLTcgLTE4IDMgLTMzIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPHBhdGggZD0iTTgzIDcwIHE3IC0xOCAtMyAtMzMiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZmZmZiIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPgo8dGV4dCB4PSIxNDIiIHk9IjM0IiBmb250LWZhbWlseT0iQXJpYWwsIEhlbHZldGljYSwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOSIgZm9udC13ZWlnaHQ9IjcwMCIgZmlsbD0iIzA0NmIzOSIgdGV4dExlbmd0aD0iMzE2IiBsZW5ndGhBZGp1c3Q9InNwYWNpbmdBbmRHbHlwaHMiPkVOVElEQURFIEZPUk1BRE9SQTwvdGV4dD4KPHRleHQgeD0iMTQyIiB5PSI1OSIgZm9udC1mYW1pbHk9IkFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjYiIGZvbnQtd2VpZ2h0PSI4MDAiIGZpbGw9IiMwYThhNGEiIGxldHRlci1zcGFjaW5nPSIxIj5DRVJUSUZJQ0FEQTwvdGV4dD4KPGxpbmUgeDE9IjE0MiIgeTE9IjY5IiB4Mj0iNDY2IiB5Mj0iNjkiIHN0cm9rZT0iI2NmZTZkOCIgc3Ryb2tlLXdpZHRoPSIxLjUiLz4KPHRleHQgeD0iMTQyIiB5PSI4NiIgZm9udC1mYW1pbHk9IkFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZvbnQtd2VpZ2h0PSI3MDAiIGZpbGw9IiM1NTUiIHRleHRMZW5ndGg9IjMxNiIgbGVuZ3RoQWRqdXN0PSJzcGFjaW5nQW5kR2x5cGhzIj5ER0VSVCDCtyBEaXJlw6fDo28tR2VyYWwgZG8gRW1wcmVnbzwvdGV4dD4KPHRleHQgeD0iMTQyIiB5PSI5OSIgZm9udC1mYW1pbHk9IkFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAuNSIgZmlsbD0iIzc3NyIgdGV4dExlbmd0aD0iMzIwIiBsZW5ndGhBZGp1c3Q9InNwYWNpbmdBbmRHbHlwaHMiPmUgZGFzIFJlbGHDp8O1ZXMgZGUgVHJhYmFsaG8gwrcgUmVww7pibGljYSBQb3J0dWd1ZXNhPC90ZXh0Pgo8L3N2Zz4="

export function esc(s: string | null | undefined): string {
  return String(s ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
}

// Caixa de logo: usa a imagem se houver data URI/URL; senão placeholder cinza.
function logoBox(url: string | null, label: string): string {
  if (url && url.trim()) {
    return `<div class="logo"><img src="${url}" alt="${esc(label)}"/></div>`
  }
  return `<div class="logo logo--ph"><span>${esc(label)}</span></div>`
}

export interface SharedHeaderData {
  clientName: string | null
  clientLogoUrl: string | null
  tenantName: string
  tenantLogoUrl: string | null
}

// CSS partilhado dos logos + rodapé. Cada template injeta no seu <style>
// para que cabeçalho/rodapé sejam pixel-idênticos entre templates.
export const SHARED_STYLES = `
  .logos { display: flex; gap: 16px; align-items: stretch; }
  .logo { flex: 1; height: 70px; border: 1px solid #d4d4d4; border-radius: 4px;
    display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .logo img { max-width: 100%; max-height: 64px; object-fit: contain; }
  .logo--ph { background: #f0f0f0; color: #666; font-size: 11px; font-weight: bold;
    text-align: center; padding: 6px; }
  .logo--dgert { border-color: #cfe6d8; padding: 4px; }
`

// Cabeçalho com 3 logos: Cliente · Entidade formadora · selo DGERT (fixo).
export function renderHeader(d: SharedHeaderData): string {
  return `<div class="logos">
    ${logoBox(d.clientLogoUrl, esc(d.clientName) || "Cliente")}
    ${logoBox(d.tenantLogoUrl, esc(d.tenantName))}
    <div class="logo logo--dgert">
      <img src="${DGERT_LOGO_BASE64}" alt="Entidade Formadora Certificada DGERT"/>
    </div>
  </div>`
}

// Rodapé com data de geração + selo DGERT + numeração de páginas.
// (Renderizado pelo Chromium via footerTemplate — usa .pageNumber/.totalPages.)
export function renderFooter(generatedAt?: string): string {
  return `
    <div style="font-family:Arial,sans-serif;font-size:8px;color:#666;
      width:100%;padding:0 2cm;display:flex;justify-content:space-between;">
      <span>Gerado em ${fmtDate(generatedAt ?? new Date().toISOString())}</span>
      <span>Entidade Formadora Certificada DGERT</span>
      <span>Pág. <span class="pageNumber"></span>/<span class="totalPages"></span></span>
    </div>`
}
