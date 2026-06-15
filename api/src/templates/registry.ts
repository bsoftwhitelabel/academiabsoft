import { renderChecklist, type ChecklistData } from "./checklist.js"
import {
  renderFichaIdentificacao,
  type FichaIdentificacaoData,
} from "./ficha-identificacao.js"
import {
  renderFolhaPresencas,
  type FolhaPresencasData,
} from "./folha-presencas.js"
import {
  renderRegistoSumarios,
  type RegistoSumariosData,
} from "./registo-sumarios.js"
import {
  renderPlanoSessao,
  type PlanoSessaoData,
} from "./plano-sessao.js"
import {
  renderSeparadora,
  type SeparadoraData,
} from "./separadora.js"

// Forma de dados aceite por cada template. Cada rota constrói a sua: o
// /generate constrói ChecklistData; o /generate-mass constrói
// FichaIdentificacaoData (1 por formando) ou FolhaPresencasData (1 por sessão).
export type ChecklistTemplateData = ChecklistData
export type FichaIdentificacaoTemplateData = FichaIdentificacaoData
export type FolhaPresencasTemplateData = FolhaPresencasData
export type RegistoSumariosTemplateData = RegistoSumariosData
export type PlanoSessaoTemplateData = PlanoSessaoData
export type SeparadoraTemplateData = SeparadoraData
export type TemplateData =
  | ChecklistData
  | FichaIdentificacaoData
  | FolhaPresencasData
  | RegistoSumariosData
  | PlanoSessaoData
  | SeparadoraData

export interface TemplateOutput {
  html: string
  footerHtml: string
}

// Registry heterogéneo: cada renderer aceita a sua própria forma de dados.
// O cast é seguro porque a rota que invoca cada template constrói a forma
// correta (ver pdf.ts).
export type TemplateRenderer = (d: TemplateData) => TemplateOutput

// Escalável: adicionar os outros templates aqui depois de validar.
export const TEMPLATES: Record<string, TemplateRenderer> = {
  checklist: renderChecklist as TemplateRenderer,
  fichaIdentificacao: renderFichaIdentificacao as TemplateRenderer,
  folhaPresenca: renderFolhaPresencas as TemplateRenderer,
  registoSumarios: renderRegistoSumarios as TemplateRenderer,
  planoSessao: renderPlanoSessao as TemplateRenderer,
  separadora: renderSeparadora as TemplateRenderer,
}
