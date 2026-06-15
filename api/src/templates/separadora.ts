// Template 6 — Separadora de secção do Dossier (divider page).
// Visualmente distinta dos documentos: SEM cabeçalho partilhado, número
// gigante centrado, nome da secção, curso e nº de acção, selo DGERT no fim.
// Usada na Fase 2 (ZIP do Dossier Completo) — 9 separadoras por dossier.

import { DGERT_LOGO_BASE64, esc } from "./_shared.js"

// As 9 secções do Dossier Técnico-Pedagógico (DGERT).
export const SECCOES_DTP = [
  "Descrição da Acção",
  "Recursos Formativos",
  "Contrato de Prestação de Serviços",
  "Formadores",
  "Formandos",
  "Acompanhamento da Acção",
  "Avaliação",
  "Relatórios",
  "Outras Informações",
] as const

// Cor "primária" — o verde institucional partilhado com o selo DGERT.
// (tenants.primaryColor existe no schema mas não vem na assinatura desta
// função; pode ser ligado na Fase 2 se se quiser tema por tenant.)
const PRIMARY = "#046b39"

export interface SeparadoraData {
  sectionNumber: number
  sectionName: string
  courseName: string | null
  actionCode: string | null
  tenantName: string
  tenantLogoUrl: string | null
  generatedAt: string
}

export function renderSeparadora(d: SeparadoraData): {
  html: string
  footerHtml: string
} {
  const html = `<!doctype html>
<html lang="pt">
<head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; }
  .page {
    min-height: 25cm;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    text-align: center;
    padding: 2cm 2cm;
  }
  .num {
    font-size: 120pt; font-weight: 800; line-height: 1;
    color: ${PRIMARY}; margin: 0;
  }
  .sec {
    font-size: 32pt; font-weight: 600; margin: 18px 0 0;
    color: #1a1a1a;
  }
  .course {
    font-size: 16pt; font-weight: 400; color: #777; margin: 22px 0 0;
  }
  .action {
    font-size: 12pt; color: #555; margin: 8px 0 0;
  }
  .seal {
    margin-top: auto; padding-top: 40px;
  }
  .seal img { height: 70px; }
</style></head>
<body>
  <div class="page">
    <div style="flex:1;display:flex;flex-direction:column;
      align-items:center;justify-content:center;">
      <p class="num">${esc(String(d.sectionNumber))}</p>
      <p class="sec">${esc(d.sectionName)}</p>
      <p class="course">${esc(d.courseName ?? "—")}</p>
      <p class="action">Acção nº ${esc(d.actionCode ?? "—")}</p>
    </div>
    <div class="seal">
      <img src="${DGERT_LOGO_BASE64}" alt="Entidade Formadora Certificada DGERT"/>
    </div>
  </div>
</body></html>`

  // Separadora é uma página limpa: sem rodapé de numeração.
  return { html, footerHtml: "<span></span>" }
}
