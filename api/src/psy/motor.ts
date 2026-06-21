/**
 * Motor de cálculo do módulo Saúde Mental (NR-1 Modelo A).
 *
 * Lógica pura, sem efeitos colaterais, sem dependência de BD nem HTTP.
 * Mesma input devolve sempre a mesma output. Testável em isolamento.
 *
 * LOCALIZAÇÃO: este motor vive no BACKEND, não no cliente. Razão de
 * anonimato: psy_responses e psy_answers nunca devem sair do servidor.
 * O cliente recebe SÓ agregados já gated (N>=5), nunca respostas cruas.
 *
 * INVARIANTE de orientação: é por PERGUNTA, nunca por dimensão.
 *   invert = (dim.tipo === "Protetiva") XOR (q.direcao === "Inversa")
 *   oriented = v se !invert; oriented = 6 - v se invert.
 *
 * Os cortes (classificacao, igrp, criticidade) vêm de psy_thresholds via
 * parâmetro `thresholds`. NÃO hardcoded.
 */

// ============================================================================
// Tipos
// ============================================================================

export type Direcao = "Direta" | "Inversa"
export type Tipo = "Risco" | "Protetiva"
export type Grupo = "Essencial" | "Complementar" | "ComplementarII"
export type Classificacao = "Favorável" | "Atenção" | "Risco" | "Risco Elevado"
export type Prioridade = "P1" | "P2" | "P3" | "P4"
export type ProbValor = 1 | 2 | 3 | 4
export type Impacto = 2 | 3 | 4

export type Dimension = {
  id: string
  codigo: string
  nome: string
  bloco: string | null
  grupo: Grupo
  tipo: Tipo
  impacto: Impacto
  ordem: number
}

export type Question = {
  id: string
  dimensionId: string
  codigo: string
  direcao: Direcao
  ordem: number
}

export type Answer = {
  responseId: string
  questionId: string
  valor: number // 1..5
}

export type Response = {
  id: string
  areaId: string
}

export type ThresholdsClassificacao = {
  favoravel_ate: number
  atencao_ate: number
  risco_ate: number
}
export type ThresholdsIgrp = { z1: number; z2: number; z3: number }
export type ThresholdsCriticidade = {
  p3_min: number
  p2_min: number
  p1_min: number
}
export type Thresholds = {
  classificacao: ThresholdsClassificacao
  igrp: ThresholdsIgrp
  criticidade: ThresholdsCriticidade
}

export type DimensionResult = {
  dimensionId: string
  codigo: string
  nome: string
  bloco: string | null
  grupo: Grupo
  tipo: Tipo
  impacto: Impacto
  media: number // 1..5 (escala oriented), não arredondada
  pontuacao: number // 0..100, arredondada a 1 casa
  classificacao: Classificacao
  prob_valor: ProbValor
  criticidade: number
  prioridade: Prioridade
  n_respondentes: number
  n_respostas: number
}

export type IgrpResult = { valor: number; banda: string }
export type ImoResult = { valor: number; banda: string; provisorio: true }

export type MatrizCelula = {
  prob: ProbValor
  impacto: Impacto
  n: number
  dimensionIds: string[]
}

export type ComputeOk = {
  insuficiente: false
  n: number
  minN: number
  dimensoes: DimensionResult[]
  igrp: IgrpResult
  imo: ImoResult
  matriz: MatrizCelula[]
  top: DimensionResult[]
}
export type ComputeInsuficiente = {
  insuficiente: true
  n: number
  minN: number
  reason: "N insuficiente"
}
export type ComputeResult = ComputeOk | ComputeInsuficiente

// ============================================================================
// Funções puras (cada uma directamente testável)
// ============================================================================

/**
 * Orientação por pergunta. Inverter se XOR de (tipo Protetiva, direcao Inversa).
 *
 *   Risco     + Direta    → não inverte → v
 *   Risco     + Inversa   →    inverte → 6 - v
 *   Protetiva + Direta    →    inverte → 6 - v
 *   Protetiva + Inversa   → não inverte → v
 */
export function orient(v: number, tipo: Tipo, direcao: Direcao): number {
  const invert = (tipo === "Protetiva") !== (direcao === "Inversa")
  return invert ? 6 - v : v
}

/** Arredonda a `casas` casas decimais (half away from zero, padrão JS). */
export function round(n: number, casas = 1): number {
  const factor = 10 ** casas
  return Math.round(n * factor) / factor
}

/** Pontuação 0..100 a partir da media 1..5, arredondada a 1 casa. */
export function pontuacaoFromMedia(media: number): number {
  return round(((media - 1) / 4) * 100, 1)
}

/** Classificação a partir da pontuação 0..100 e cortes. */
export function classificarPontuacao(
  pontuacao: number,
  t: ThresholdsClassificacao
): Classificacao {
  if (pontuacao <= t.favoravel_ate) return "Favorável"
  if (pontuacao <= t.atencao_ate) return "Atenção"
  if (pontuacao <= t.risco_ate) return "Risco"
  return "Risco Elevado"
}

/** Probabilidade discreta 1..4 alinhada com a classificação. */
export function probValorFromPontuacao(
  pontuacao: number,
  t: ThresholdsClassificacao
): ProbValor {
  if (pontuacao <= t.favoravel_ate) return 1
  if (pontuacao <= t.atencao_ate) return 2
  if (pontuacao <= t.risco_ate) return 3
  return 4
}

/** Prioridade discreta a partir da criticidade. */
export function prioridadeFromCriticidade(
  criticidade: number,
  t: ThresholdsCriticidade
): Prioridade {
  if (criticidade >= t.p1_min) return "P1"
  if (criticidade >= t.p2_min) return "P2"
  if (criticidade >= t.p3_min) return "P3"
  return "P4"
}

/**
 * Banda IGRP. Risco psicossocial: ALTO é MAU.
 *   <= z1 → "Baixo"
 *   <= z2 → "Médio"
 *   <= z3 → "Alto"
 *   >  z3 → "Muito Alto"
 */
export function bandaIgrp(valor: number, t: ThresholdsIgrp): string {
  if (valor <= t.z1) return "Baixo"
  if (valor <= t.z2) return "Médio"
  if (valor <= t.z3) return "Alto"
  return "Muito Alto"
}

/**
 * Banda IMO. Maturidade organizacional protetiva: ALTO é BOM.
 * Labels próprios, PROVISÓRIOS (sinalizar sempre via ImoResult.provisorio).
 * Usa os mesmos cortes da escala (z1, z2, z3) por enquanto, sem oráculo
 * clínico próprio.
 *   <= z1 → "Maturidade Baixa"        (pouca maturidade, mau)
 *   <= z2 → "Maturidade Média"
 *   <= z3 → "Maturidade Alta"
 *   >  z3 → "Maturidade Muito Alta"   (muita maturidade, bom)
 */
export function bandaImo(valor: number, t: ThresholdsIgrp): string {
  if (valor <= t.z1) return "Maturidade Baixa"
  if (valor <= t.z2) return "Maturidade Média"
  if (valor <= t.z3) return "Maturidade Alta"
  return "Maturidade Muito Alta"
}

// ============================================================================
// Validação de entrada
// ============================================================================

function validateAnswers(answers: Answer[]): void {
  for (const a of answers) {
    if (
      !Number.isInteger(a.valor) ||
      a.valor < 1 ||
      a.valor > 5
    ) {
      throw new Error(
        `Resposta inválida: responseId=${a.responseId}, questionId=${a.questionId}, valor=${a.valor} (esperado inteiro 1..5)`
      )
    }
  }
}

// ============================================================================
// Função top-level: compute()
// ============================================================================

/**
 * Computa todos os resultados a partir de respostas, perguntas, dimensões e
 * cortes. Função pura.
 *
 * Gating: se N (respondentes distintos) < minN (default 5), devolve
 *   { insuficiente: true, n, minN, reason: "N insuficiente" }
 */
export function compute(
  responses: Response[],
  answers: Answer[],
  dimensions: Dimension[],
  questions: Question[],
  thresholds: Thresholds,
  options: { minN?: number } = {}
): ComputeResult {
  const minN = options.minN ?? 5
  const respondentIds = new Set(responses.map((r) => r.id))
  const n = respondentIds.size

  if (n < minN) {
    return { insuficiente: true, n, minN, reason: "N insuficiente" }
  }

  validateAnswers(answers)

  const qById = new Map(questions.map((q) => [q.id, q]))
  const qsByDim = new Map<string, Question[]>()
  for (const q of questions) {
    const arr = qsByDim.get(q.dimensionId) ?? []
    arr.push(q)
    qsByDim.set(q.dimensionId, arr)
  }

  const validAnswers = answers.filter(
    (a) => respondentIds.has(a.responseId) && qById.has(a.questionId)
  )

  const dimResults: DimensionResult[] = []
  for (const dim of dimensions) {
    const perguntas = qsByDim.get(dim.id) ?? []
    if (perguntas.length === 0) continue
    const perguntaIds = new Set(perguntas.map((q) => q.id))
    const ansDaDim = validAnswers.filter((a) => perguntaIds.has(a.questionId))
    if (ansDaDim.length === 0) continue

    const orientedValues = ansDaDim.map((a) => {
      const q = qById.get(a.questionId)!
      return orient(a.valor, dim.tipo, q.direcao)
    })

    const media =
      orientedValues.reduce((s, v) => s + v, 0) / orientedValues.length
    const pontuacao = pontuacaoFromMedia(media)
    const classificacao = classificarPontuacao(pontuacao, thresholds.classificacao)
    const prob_valor = probValorFromPontuacao(
      pontuacao,
      thresholds.classificacao
    )
    const criticidade = prob_valor * dim.impacto
    const prioridade = prioridadeFromCriticidade(
      criticidade,
      thresholds.criticidade
    )
    const n_respondentes = new Set(ansDaDim.map((a) => a.responseId)).size
    const n_respostas = ansDaDim.length

    dimResults.push({
      dimensionId: dim.id,
      codigo: dim.codigo,
      nome: dim.nome,
      bloco: dim.bloco,
      grupo: dim.grupo,
      tipo: dim.tipo,
      impacto: dim.impacto,
      media,
      pontuacao,
      classificacao,
      prob_valor,
      criticidade,
      prioridade,
      n_respondentes,
      n_respostas,
    })
  }

  const risco = dimResults.filter((d) => d.tipo === "Risco")
  const protetiva = dimResults.filter((d) => d.tipo === "Protetiva")

  const igrpValor =
    risco.length > 0 ? risco.reduce((s, d) => s + d.media, 0) / risco.length : 0
  const imoValor =
    protetiva.length > 0
      ? protetiva.reduce((s, d) => s + (6 - d.media), 0) / protetiva.length
      : 0

  const igrp: IgrpResult = {
    valor: igrpValor,
    banda: bandaIgrp(igrpValor, thresholds.igrp),
  }
  const imo: ImoResult = {
    valor: imoValor,
    banda: bandaImo(imoValor, thresholds.igrp),
    provisorio: true,
  }

  // Matriz: 4 prob × 3 impacto = 12 células
  const matriz: MatrizCelula[] = []
  for (const prob of [1, 2, 3, 4] as ProbValor[]) {
    for (const imp of [2, 3, 4] as Impacto[]) {
      const dimsNaCelula = dimResults.filter(
        (d) => d.prob_valor === prob && d.impacto === imp
      )
      matriz.push({
        prob,
        impacto: imp,
        n: dimsNaCelula.length,
        dimensionIds: dimsNaCelula.map((d) => d.dimensionId),
      })
    }
  }

  const top = [...dimResults].sort((a, b) => {
    if (b.criticidade !== a.criticidade) return b.criticidade - a.criticidade
    if (b.prob_valor !== a.prob_valor) return b.prob_valor - a.prob_valor
    return a.codigo.localeCompare(b.codigo)
  })

  return {
    insuficiente: false,
    n,
    minN,
    dimensoes: dimResults,
    igrp,
    imo,
    matriz,
    top,
  }
}

/**
 * Estratifica por área. Devolve um Record<areaId, ComputeResult>.
 * Cada área é computada isoladamente, com o mesmo gating N >= minN.
 *
 * Áreas com N < minN devolvem { insuficiente: true, ..., reason: "N insuficiente" }
 * em vez de valores agregados. NUNCA expor valores de áreas pequenas (RGPD,
 * invariante de anonimato).
 */
export function computePorArea(
  responses: Response[],
  answers: Answer[],
  dimensions: Dimension[],
  questions: Question[],
  thresholds: Thresholds,
  options: { minN?: number } = {}
): Record<string, ComputeResult> {
  const result: Record<string, ComputeResult> = {}
  const responsesByArea = new Map<string, Response[]>()
  for (const r of responses) {
    const arr = responsesByArea.get(r.areaId) ?? []
    arr.push(r)
    responsesByArea.set(r.areaId, arr)
  }
  for (const [areaId, areaResponses] of responsesByArea) {
    const ids = new Set(areaResponses.map((r) => r.id))
    const areaAnswers = answers.filter((a) => ids.has(a.responseId))
    result[areaId] = compute(
      areaResponses,
      areaAnswers,
      dimensions,
      questions,
      thresholds,
      options
    )
  }
  return result
}
