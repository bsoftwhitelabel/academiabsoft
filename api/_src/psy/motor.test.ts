/**
 * Testes do motor do módulo Saúde Mental.
 *
 * Dois grupos:
 *   1. Propriedades unitárias (orient, pontuacaoFromMedia, classificarPontuacao,
 *      probValorFromPontuacao, prioridadeFromCriticidade, fronteiras dos cortes,
 *      bandas IGRP e IMO, gating N>=5).
 *   2. Golden vectors do oráculo (motor_golden_vectors.json). Carregado em
 *      runtime; se não estiver presente, os testes golden saltam.
 *
 * Correr a partir de api/: npm run test:psy
 *
 * NOTA sobre gating: os casos do oráculo têm 1 a 2 respondentes para validar
 * fórmulas. Em produção, gating N>=5 deve sempre aplicar. Nos testes usamos
 * minN: 1 para isolar a verificação das fórmulas.
 */
import { test } from "node:test"
import { strict as assert } from "node:assert"
import { readFileSync, existsSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import {
  bandaIgrp,
  bandaImo,
  classificarPontuacao,
  compute,
  computePorArea,
  orient,
  pontuacaoFromMedia,
  prioridadeFromCriticidade,
  probValorFromPontuacao,
  round,
  type Answer,
  type Dimension,
  type DimensionResult,
  type Question,
  type Response,
  type Thresholds,
} from "./motor.js"

const T_CLASS = { favoravel_ate: 25, atencao_ate: 50, risco_ate: 75 }
const T_IGRP = { z1: 2, z2: 3, z3: 4 }
const T_CRIT = { p3_min: 4, p2_min: 8, p1_min: 12 }
const THRESHOLDS: Thresholds = {
  classificacao: T_CLASS,
  igrp: T_IGRP,
  criticidade: T_CRIT,
}

const EPS = 1e-4

// ============================================================================
// 1. Propriedades unitárias
// ============================================================================

test("orient: Risco + Direta não inverte (v=3 → 3)", () => {
  assert.equal(orient(3, "Risco", "Direta"), 3)
})
test("orient: Risco + Inversa inverte (v=3 → 3, v=1 → 5, v=5 → 1)", () => {
  assert.equal(orient(3, "Risco", "Inversa"), 3)
  assert.equal(orient(1, "Risco", "Inversa"), 5)
  assert.equal(orient(5, "Risco", "Inversa"), 1)
})
test("orient: Protetiva + Direta inverte (v=1 → 5, v=5 → 1)", () => {
  assert.equal(orient(1, "Protetiva", "Direta"), 5)
  assert.equal(orient(5, "Protetiva", "Direta"), 1)
})
test("orient: Protetiva + Inversa não inverte (v=2 → 2)", () => {
  assert.equal(orient(2, "Protetiva", "Inversa"), 2)
})

test("pontuacaoFromMedia: media=1 → 0, media=3 → 50, media=5 → 100", () => {
  assert.equal(pontuacaoFromMedia(1), 0)
  assert.equal(pontuacaoFromMedia(3), 50)
  assert.equal(pontuacaoFromMedia(5), 100)
})
test("pontuacaoFromMedia: arredonda a 1 casa (10/3 → 58.3)", () => {
  assert.equal(pontuacaoFromMedia(10 / 3), 58.3)
})

test("classificarPontuacao fronteiras: 25=Favorável, 25.1=Atenção, 50=Atenção, 50.1=Risco, 75=Risco, 75.1=Risco Elevado", () => {
  assert.equal(classificarPontuacao(25, T_CLASS), "Favorável")
  assert.equal(classificarPontuacao(25.1, T_CLASS), "Atenção")
  assert.equal(classificarPontuacao(50, T_CLASS), "Atenção")
  assert.equal(classificarPontuacao(50.1, T_CLASS), "Risco")
  assert.equal(classificarPontuacao(75, T_CLASS), "Risco")
  assert.equal(classificarPontuacao(75.1, T_CLASS), "Risco Elevado")
  assert.equal(classificarPontuacao(0, T_CLASS), "Favorável")
  assert.equal(classificarPontuacao(100, T_CLASS), "Risco Elevado")
})

test("probValorFromPontuacao fronteiras: 25→1, 25.1→2, 50→2, 50.1→3, 75→3, 75.1→4", () => {
  assert.equal(probValorFromPontuacao(25, T_CLASS), 1)
  assert.equal(probValorFromPontuacao(25.1, T_CLASS), 2)
  assert.equal(probValorFromPontuacao(50, T_CLASS), 2)
  assert.equal(probValorFromPontuacao(50.1, T_CLASS), 3)
  assert.equal(probValorFromPontuacao(75, T_CLASS), 3)
  assert.equal(probValorFromPontuacao(75.1, T_CLASS), 4)
})

test("prioridadeFromCriticidade fronteiras: 3=P4, 4=P3, 7=P3, 8=P2, 11=P2, 12=P1, 16=P1", () => {
  assert.equal(prioridadeFromCriticidade(3, T_CRIT), "P4")
  assert.equal(prioridadeFromCriticidade(4, T_CRIT), "P3")
  assert.equal(prioridadeFromCriticidade(7, T_CRIT), "P3")
  assert.equal(prioridadeFromCriticidade(8, T_CRIT), "P2")
  assert.equal(prioridadeFromCriticidade(11, T_CRIT), "P2")
  assert.equal(prioridadeFromCriticidade(12, T_CRIT), "P1")
  assert.equal(prioridadeFromCriticidade(16, T_CRIT), "P1")
})

test("bandaIgrp: alto é MAU, labels Baixo/Médio/Alto/Muito Alto", () => {
  assert.equal(bandaIgrp(2, T_IGRP), "Baixo")
  assert.equal(bandaIgrp(2.5, T_IGRP), "Médio")
  assert.equal(bandaIgrp(3, T_IGRP), "Médio")
  assert.equal(bandaIgrp(4, T_IGRP), "Alto")
  assert.equal(bandaIgrp(4.5, T_IGRP), "Muito Alto")
})

test("bandaImo: maturidade, alto é BOM, labels próprios provisórios", () => {
  assert.equal(bandaImo(1, T_IGRP), "Maturidade Baixa")
  assert.equal(bandaImo(2, T_IGRP), "Maturidade Baixa")
  assert.equal(bandaImo(2.5, T_IGRP), "Maturidade Média")
  assert.equal(bandaImo(3, T_IGRP), "Maturidade Média")
  assert.equal(bandaImo(4, T_IGRP), "Maturidade Alta")
  assert.equal(bandaImo(4.5, T_IGRP), "Maturidade Muito Alta")
  assert.equal(bandaImo(5, T_IGRP), "Maturidade Muito Alta")
})

test("round: 58.333... → 58.3, 58.35 → 58.4, half-away-from-zero padrão JS", () => {
  assert.equal(round(58.333333, 1), 58.3)
  assert.equal(round(58.35, 1), 58.4)
  assert.equal(round(58.36, 1), 58.4)
})

// ----------------------------------------------------------------------------
// Gating N>=5
// ----------------------------------------------------------------------------

test("compute: N=4 < minN=5 devolve insuficiente", () => {
  const responses: Response[] = Array.from({ length: 4 }, (_, i) => ({
    id: `r${i}`,
    areaId: "a1",
  }))
  const res = compute(responses, [], [], [], THRESHOLDS)
  assert.equal(res.insuficiente, true)
  if (res.insuficiente) {
    assert.equal(res.n, 4)
    assert.equal(res.minN, 5)
    assert.equal(res.reason, "N insuficiente")
  }
})

test("compute: N=5 = minN=5 não é insuficiente (sem answers devolve dimensoes vazio)", () => {
  const responses: Response[] = Array.from({ length: 5 }, (_, i) => ({
    id: `r${i}`,
    areaId: "a1",
  }))
  const res = compute(responses, [], [], [], THRESHOLDS)
  assert.equal(res.insuficiente, false)
  if (!res.insuficiente) {
    assert.equal(res.n, 5)
    assert.equal(res.dimensoes.length, 0)
  }
})

test("compute: valor fora de 1..5 lança Error", () => {
  const responses: Response[] = Array.from({ length: 5 }, (_, i) => ({
    id: `r${i}`,
    areaId: "a1",
  }))
  const answers: Answer[] = [{ responseId: "r0", questionId: "q1", valor: 7 }]
  assert.throws(
    () => compute(responses, answers, [], [], THRESHOLDS),
    /valor=7/
  )
})

test("computePorArea: área pequena devolve insuficiente, área grande computa", () => {
  const responses: Response[] = [
    ...Array.from({ length: 5 }, (_, i) => ({ id: `rA${i}`, areaId: "areaA" })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: `rB${i}`, areaId: "areaB" })),
  ]
  const res = computePorArea(responses, [], [], [], THRESHOLDS)
  assert.equal(res["areaA"].insuficiente, false)
  assert.equal(res["areaB"].insuficiente, true)
})

// ============================================================================
// 2. Golden vectors do oráculo
// ============================================================================

type OracleQuestion = { code: string; direcao: "Direta" | "Inversa" }
type OracleDimension = {
  code: string
  tipo: "Risco" | "Protetiva"
  impacto: 2 | 3 | 4
  questions: string[]
}
type OracleResposta = Record<string, number>
type OracleEsperadoDim = {
  media: number
  pontuacao: number
  classificacao: string
  prob_valor: number
  impacto: number
  criticidade: number
  prioridade: string
}
type OracleCaso = {
  respostas: OracleResposta[]
  esperado: {
    dimensoes: Record<string, OracleEsperadoDim>
    IGRP: number
    IMO: number
  }
}
type Oracle = {
  instrument: {
    dimensions: OracleDimension[]
    questions: OracleQuestion[]
  }
  casos: Record<string, OracleCaso>
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const oraclePath = resolve(__dirname, "motor_golden_vectors.json")

function loadOracleOrSkip(): Oracle | null {
  if (!existsSync(oraclePath)) return null
  return JSON.parse(readFileSync(oraclePath, "utf-8")) as Oracle
}

function buildFixtures(oracle: Oracle, caso: OracleCaso) {
  const dimensions: Dimension[] = oracle.instrument.dimensions.map((d, i) => ({
    id: d.code,
    codigo: d.code,
    nome: d.code,
    bloco: null,
    grupo: "Essencial",
    tipo: d.tipo,
    impacto: d.impacto,
    ordem: i + 1,
  }))
  const questions: Question[] = oracle.instrument.questions.map((q, i) => {
    const dim = oracle.instrument.dimensions.find((d) =>
      d.questions.includes(q.code)
    )
    if (!dim) throw new Error(`Pergunta ${q.code} sem dimensão no oráculo`)
    return {
      id: q.code,
      dimensionId: dim.code,
      codigo: q.code,
      direcao: q.direcao,
      ordem: i + 1,
    }
  })
  const responses: Response[] = caso.respostas.map((_, i) => ({
    id: `r${i}`,
    areaId: "a1",
  }))
  const answers: Answer[] = []
  caso.respostas.forEach((mapa, i) => {
    for (const [qcode, valor] of Object.entries(mapa)) {
      answers.push({
        responseId: `r${i}`,
        questionId: qcode,
        valor: valor as number,
      })
    }
  })
  return { dimensions, questions, responses, answers }
}

const oracle = loadOracleOrSkip()
if (!oracle) {
  test("golden vectors: ORÁCULO AUSENTE (motor_golden_vectors.json), testes saltados", () => {
    console.warn(
      `[motor.test] saltei testes golden: ficheiro inexistente em ${oraclePath}`
    )
  })
} else {
  for (const [nome, caso] of Object.entries(oracle.casos)) {
    test(`golden vector: ${nome}`, () => {
      const { dimensions, questions, responses, answers } = buildFixtures(
        oracle,
        caso
      )
      const res = compute(responses, answers, dimensions, questions, THRESHOLDS, {
        minN: 1, // bypass gating para isolar verificação das fórmulas
      })
      assert.equal(res.insuficiente, false, "esperado resultado, não insuficiente")
      if (res.insuficiente) return

      // Por dimensão
      for (const [dimCode, esp] of Object.entries(caso.esperado.dimensoes)) {
        const dim: DimensionResult | undefined = res.dimensoes.find(
          (d) => d.codigo === dimCode
        )
        if (!dim) {
          assert.fail(`dimensão ${dimCode} em falta no resultado`)
        }
        assert.ok(
          Math.abs(dim.media - esp.media) < EPS,
          `${nome}/${dimCode}.media: got ${dim.media} esperado ${esp.media}`
        )
        assert.equal(
          dim.pontuacao,
          esp.pontuacao,
          `${nome}/${dimCode}.pontuacao`
        )
        assert.equal(
          dim.classificacao,
          esp.classificacao,
          `${nome}/${dimCode}.classificacao`
        )
        assert.equal(
          dim.prob_valor,
          esp.prob_valor,
          `${nome}/${dimCode}.prob_valor`
        )
        assert.equal(dim.impacto, esp.impacto, `${nome}/${dimCode}.impacto`)
        assert.equal(
          dim.criticidade,
          esp.criticidade,
          `${nome}/${dimCode}.criticidade`
        )
        assert.equal(
          dim.prioridade,
          esp.prioridade,
          `${nome}/${dimCode}.prioridade`
        )
      }

      // Agregados
      assert.ok(
        Math.abs(res.igrp.valor - caso.esperado.IGRP) < EPS,
        `${nome}.IGRP: got ${res.igrp.valor} esperado ${caso.esperado.IGRP}`
      )
      assert.ok(
        Math.abs(res.imo.valor - caso.esperado.IMO) < EPS,
        `${nome}.IMO: got ${res.imo.valor} esperado ${caso.esperado.IMO}`
      )
      assert.equal(
        res.imo.provisorio,
        true,
        `${nome}.IMO deve estar marcado como provisório`
      )
    })
  }
}
