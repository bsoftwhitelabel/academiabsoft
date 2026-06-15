// Template 2 — Ficha de Identificação do Formando.
// 1 página A4 por formando. Formulário EM BRANCO para preenchimento manual:
// apenas o nome do formando (e o contexto da ação) vêm pré-populados; todos
// os campos ficam vazios com uma linha para escrever à mão.
// Cabeçalho (3 logos) e estilos partilhados com o Checklist via _shared.ts.
// Rodapé legal: cláusula RGPD (Regulamento (UE) 2016/679).

import { SHARED_STYLES, renderHeader, renderFooter, esc } from "./_shared.js"

export interface FichaIdentificacaoData {
  traineeName: string
  courseName: string | null
  actionCode: string | null
  clientName: string | null
  clientLogoUrl: string | null
  tenantName: string
  tenantLogoUrl: string | null
  generatedAt: string
}

// Campo: label + linha vazia para preenchimento manual.
function field(label: string, opts?: { tall?: boolean }): string {
  return `<div class="fld">
    <span class="l">${esc(label)}</span>
    <span class="b${opts?.tall ? " b--tall" : ""}"></span>
  </div>`
}

// Conjunto de opções para assinalar à mão (□ quadrado / ○ redondo).
function options(label: string, items: string[], round = false): string {
  const boxes = items
    .map(
      (it) =>
        `<span class="opt"><span class="box${
          round ? " box--r" : ""
        }"></span>${esc(it)}</span>`
    )
    .join("")
  return `<div class="fld fld--opts">
    <span class="l">${esc(label)}</span>
    <div class="opts">${boxes}</div>
  </div>`
}

export function renderFichaIdentificacao(d: FichaIdentificacaoData): {
  html: string
  footerHtml: string
} {
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
    padding: 10px 14px; margin: 12px 0 4px; font-size: 12px; }
  .idbanner b { color: #046b39; }
  .idbanner .ctx { color: #555; font-size: 11px; margin-top: 4px; }
  .sec-h { font-size: 13px; font-weight: bold; color: #046b39;
    margin: 18px 0 10px; border-bottom: 1.5px solid #cfe6d8; padding-bottom: 3px; }
  .row { display: flex; gap: 20px; margin-bottom: 16px; }
  .fld { flex: 1; min-width: 0; }
  .fld .l { display: block; font-size: 10.5px; color: #555; font-weight: bold;
    margin-bottom: 16px; }
  .fld .b { display: block; height: 1px; border-bottom: 1px solid #999; }
  .fld .b--tall { margin-top: 8px; }
  .fld--opts .l { margin-bottom: 8px; }
  .opts { display: flex; gap: 18px; flex-wrap: wrap; padding-top: 2px; }
  .opt { display: flex; align-items: center; gap: 6px; font-size: 11px; }
  .box { width: 12px; height: 12px; border: 1.5px solid #888; border-radius: 2px;
    display: inline-block; }
  .box--r { border-radius: 50%; }
  .sign { display: flex; gap: 50px; margin-top: 24px; }
  .sign .fld .b { margin-top: 22px; }
  .rgpd { margin-top: 22px; border: 1px solid #d4d4d4; border-radius: 4px;
    padding: 12px 14px; font-size: 8.6px; color: #555; line-height: 1.55;
    text-align: justify; }
  .rgpd h4 { margin: 0 0 6px; font-size: 10px; color: #1a1a1a; }
  .rgpd .consent { margin-top: 8px; display: flex; align-items: center;
    gap: 6px; font-size: 9px; color: #1a1a1a; font-weight: bold; }
</style></head>
<body><div class="wrap">
  ${renderHeader(d)}

  <h1>Ficha de Identificação do Formando</h1>
  <div class="subtitle">Entidade Formadora Certificada DGERT</div>

  <div class="idbanner">
    <div>Formando: <b>${esc(d.traineeName)}</b></div>
    <div class="ctx">Curso: ${esc(d.courseName)} &nbsp;·&nbsp; Acção nº ${esc(
    d.actionCode
  )}</div>
  </div>

  <div class="sec-h">1. Dados Pessoais</div>
  <div class="row">${field("Nome Completo")}</div>
  <div class="row">${field("Nome Preferido")}${field("Sexo")}</div>
  <div class="row">${field("Data de Nascimento")}${field(
    "Nacionalidade"
  )}</div>
  <div class="row">${options("Tipo de Identificação", [
    "Cartão de Cidadão",
    "Passaporte",
    "Outro",
  ])}</div>
  <div class="row">${field("Número de Identificação")}${field(
    "Validade"
  )}</div>
  <div class="row">${field("NIF")}${field("Nº Segurança Social")}</div>
  <div class="row">${field("Estado (civil)")}</div>

  <div class="sec-h">2. Contactos</div>
  <div class="row">${field("Email")}${field("Telefone")}</div>
  <div class="row">${field("Morada")}</div>
  <div class="row">${field("País")}${field("Cidade")}${field("CEP")}</div>

  <div class="sec-h">3. Situação Profissional</div>
  <div class="row">${field("Situação face ao Emprego")}${field(
    "Profissão"
  )}</div>

  <div class="sec-h">4. Habilitações Literárias</div>
  <div class="row">${options(
    "Nível mais elevado concluído",
    ["9ª Série", "12º Ano", "Licenciatura", "Mestrado", "Doutoramento"],
    true
  )}</div>

  <div class="sign">
    ${field("Data")}
    ${field("Assinatura do Formando")}
  </div>

  <div class="rgpd">
    <h4>Proteção de Dados Pessoais (RGPD)</h4>
    Os dados pessoais recolhidos nesta ficha são tratados por
    <b>${esc(d.tenantName)}</b>, na qualidade de responsável pelo tratamento, ao
    abrigo do Regulamento (UE) 2016/679 do Parlamento Europeu e do Conselho,
    de 27 de abril de 2016 (Regulamento Geral sobre a Proteção de Dados —
    RGPD), e da Lei n.º 58/2019, de 8 de agosto. Os dados destinam-se
    exclusivamente à gestão administrativa e pedagógica da ação de formação,
    ao cumprimento das obrigações legais decorrentes da certificação DGERT e
    à emissão de certificados, sendo conservados pelo período legalmente
    exigível. O titular dos dados pode, a qualquer momento, exercer os
    direitos de acesso, retificação, apagamento, limitação e portabilidade,
    bem como opor-se ao tratamento, mediante pedido escrito ao responsável
    pelo tratamento. Os contactos do Encarregado de Proteção de Dados podem
    ser solicitados junto da entidade formadora.
    <div class="consent">
      <span class="box"></span>
      Declaro que tomei conhecimento e autorizo o tratamento dos meus dados
      pessoais nos termos acima descritos.
    </div>
  </div>
</div></body></html>`

  return { html, footerHtml: renderFooter(d.generatedAt) }
}
