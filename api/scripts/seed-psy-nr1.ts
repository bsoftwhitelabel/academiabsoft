/**
 * Seed idempotente do instrumento NR-1 Modelo A para o módulo Saúde Mental.
 *
 * Lê api/seed/instrumento_nr1_seed.json e insere via service role:
 *   - psy_instruments (1 linha)
 *   - psy_dimensions (34 linhas)
 *   - psy_questions (102 linhas)
 *   - psy_thresholds (linhas de classificacao/igrp/criticidade)
 *   - psy_action_plans (1 placeholder por dimensão, texto vazio)
 *
 * REGRA DE SUBSTITUIÇÃO DOS ACTION PLANS (LER ANTES DE INSERIR TEXTOS REAIS):
 *   As linhas com classificacao='placeholder' (uma por dimensão, texto vazio)
 *   inseridas por este seed são TEMPORÁRIAS. Quando os textos reais chegarem,
 *   o seed dos planos reais DEVE, por dimensão:
 *     1. APAGAR primeiro a(s) linha(s) placeholder dessa dimensão.
 *     2. SÓ DEPOIS inserir as linhas reais, uma por classificação relevante
 *        (favoravel, atencao, risco, elevado).
 *   NUNCA misturar placeholder com reais na mesma dimensão.
 *   NUNCA fazer upsert que sobreponha placeholder a real sem apagar.
 *   Usar o helper `seedActionPlans(sb, dimensionId, mapaPorClassificacao)`
 *   em api/scripts/lib/seed-action-plans.ts. Este helper faz delete-then-
 *   insert por dimensão e é o caminho único oficial para esta substituição.
 *
 * Idempotente: upsert com ignoreDuplicates=true (equivalente a ON CONFLICT
 * DO NOTHING). Correr 2x não altera dados. Para versões novas, criar nova
 * version no JSON (gera novo instrumentId determinístico).
 *
 * Pré-requisitos:
 *   1. Migração v11 aplicada e validada no Supabase SQL Editor.
 *   2. api/.env com SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PSY_SEED_TENANT_ID.
 *
 * Como correr:
 *   cd api
 *   npx tsx scripts/seed-psy-nr1.ts --dry-run   # mostra o que ia inserir
 *   npx tsx scripts/seed-psy-nr1.ts             # insere
 */
import { config as loadEnv } from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

const here = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(here, "..", ".env") })

const DRY_RUN = process.argv.includes("--dry-run")

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TENANT_ID = process.env.PSY_SEED_TENANT_ID
const CREATED_BY = process.env.PSY_SEED_CREATED_BY ?? null

function bail(msg: string): never {
  console.error(`[seed-psy-nr1] ERRO: ${msg}`)
  process.exit(1)
}

if (!SUPABASE_URL) bail("Falta SUPABASE_URL em api/.env")
if (!SUPABASE_SERVICE_ROLE_KEY) bail("Falta SUPABASE_SERVICE_ROLE_KEY em api/.env")
if (!TENANT_ID) {
  bail(
    "Falta PSY_SEED_TENANT_ID em api/.env. Define com o ID do tenant alvo (ex: PSY_SEED_TENANT_ID=cmok6xvlq0000pc43lyagc2pb)."
  )
}

const seedPath = resolve(here, "..", "seed", "instrumento_nr1_seed.json")
const seed = JSON.parse(readFileSync(seedPath, "utf-8"))

// ----------------------------------------------------------------------------
// Pré-validação contra a fonte
// ----------------------------------------------------------------------------
function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}

const errors: string[] = []
if (!seed?.instrument?.version) errors.push("instrument.version em falta")
if (!seed?.instrument?.etiqueta_validacao) errors.push("instrument.etiqueta_validacao em falta")
if (!Array.isArray(seed.dimensions) || seed.dimensions.length !== 34) {
  errors.push(`Esperadas 34 dimensions, obtidas ${seed.dimensions?.length}`)
}
if (!Array.isArray(seed.questions) || seed.questions.length !== 102) {
  errors.push(`Esperadas 102 questions, obtidas ${seed.questions?.length}`)
}
const invQ = (seed.questions ?? []).filter((q: any) => q.direcao === "Inversa").length
if (invQ !== 56) errors.push(`Esperadas 56 perguntas Inversa, obtidas ${invQ}`)
const protD = (seed.dimensions ?? []).filter((d: any) => d.tipo === "Protetiva").length
if (protD !== 17) errors.push(`Esperadas 17 dimensões Protetiva, obtidas ${protD}`)

if (errors.length) {
  for (const e of errors) console.error(`[seed-psy-nr1] FALHA DE VALIDAÇÃO: ${e}`)
  process.exit(1)
}

// ----------------------------------------------------------------------------
// Construção das linhas com IDs determinísticos
// ----------------------------------------------------------------------------
const version = seed.instrument.version as string
const etiquetaValidacao = seed.instrument.etiqueta_validacao as string
const instrumentId = `psy_inst_${slug(TENANT_ID)}_${slug(version)}`

const dimensions = seed.dimensions.map((d: any) => ({
  id: `${instrumentId}_${d.code}`,
  instrumentId,
  codigo: d.code,
  nome: d.nome,
  bloco: d.bloco ?? null,
  // Normaliza "Complementar II" do JSON para o CHECK constraint "ComplementarII".
  grupo: d.grupo === "Complementar II" ? "ComplementarII" : d.grupo,
  tipo: d.tipo,
  impacto: d.impacto,
  ordem: d.ordem,
}))

const dimensionIdByCode = new Map<string, string>()
for (const d of dimensions) dimensionIdByCode.set(d.codigo, d.id)

const questions = seed.questions.map((q: any) => {
  const dimId = dimensionIdByCode.get(q.dimension)
  if (!dimId) {
    throw new Error(`Pergunta ${q.code} refere dimension ${q.dimension} inexistente`)
  }
  return {
    id: `${dimId}_${q.code}`,
    dimensionId: dimId,
    codigo: q.code,
    texto: q.texto,
    direcao: q.direcao,
    ordem: q.ordem,
  }
})

// Thresholds: classificacao tem chave "acima" com valor string "Risco Elevado";
// ignoramos não-numéricos (o "acima" é implícito = resto > risco_ate).
type Threshold = {
  id: string
  instrumentId: string
  tipo: "classificacao" | "igrp" | "criticidade"
  chave: string
  valor: number
}
const thresholdRows: Threshold[] = []

function pushNumericThresholds(tipo: Threshold["tipo"], src: Record<string, unknown>) {
  for (const [chave, valor] of Object.entries(src)) {
    if (typeof valor === "number") {
      thresholdRows.push({
        id: `${instrumentId}_thr_${tipo}_${slug(chave)}`,
        instrumentId,
        tipo,
        chave,
        valor,
      })
    }
  }
}
pushNumericThresholds("classificacao", seed.thresholds.classificacao ?? {})
pushNumericThresholds("igrp", seed.thresholds.igrp ?? {})
pushNumericThresholds("criticidade", seed.thresholds.criticidade ?? {})

// Action plans: 1 placeholder por dimensão. NÃO inventar textos.
const actionPlans = dimensions.map((d) => ({
  id: `${d.id}_ap_placeholder`,
  dimensionId: d.id,
  classificacao: "placeholder",
  texto: "",
}))

// ----------------------------------------------------------------------------
// Resumo + (opcional) dry run
// ----------------------------------------------------------------------------
console.log(`[seed-psy-nr1] Versão: ${version}`)
console.log(`[seed-psy-nr1] Etiqueta validação: ${etiquetaValidacao}`)
console.log(`[seed-psy-nr1] Instrument ID: ${instrumentId}`)
console.log(`[seed-psy-nr1] Tenant ID: ${TENANT_ID}`)
console.log(
  `[seed-psy-nr1] Pré-validação OK: 34 dimensões (${protD} Protetiva, ${34 - protD} Risco), 102 perguntas (${invQ} Inversa, ${102 - invQ} Direta).`
)
console.log(`[seed-psy-nr1] A inserir:`)
console.log(`  psy_instruments:  1`)
console.log(`  psy_dimensions:   ${dimensions.length}`)
console.log(`  psy_questions:    ${questions.length}`)
console.log(`  psy_thresholds:   ${thresholdRows.length}`)
console.log(`  psy_action_plans: ${actionPlans.length}  (todos texto vazio, a redigir)`)

if (DRY_RUN) {
  console.log("[seed-psy-nr1] DRY RUN: nada foi inserido na BD.")
  process.exit(0)
}

// ----------------------------------------------------------------------------
// Inserts idempotentes (upsert com ignoreDuplicates = ON CONFLICT DO NOTHING)
// ----------------------------------------------------------------------------
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

async function upsertTable(table: string, rows: unknown[]) {
  if (rows.length === 0) return
  const { error } = await sb
    .from(table)
    .upsert(rows as never[], { onConflict: "id", ignoreDuplicates: true })
  if (error) throw new Error(`upsert ${table}: ${error.message}`)
}

await upsertTable("psy_instruments", [
  {
    id: instrumentId,
    tenantId: TENANT_ID,
    versao: version,
    estado: "rascunho",
    etiqueta_validacao: etiquetaValidacao,
    criadoPor: CREATED_BY,
  },
])
await upsertTable("psy_dimensions", dimensions)
await upsertTable("psy_questions", questions)
await upsertTable("psy_thresholds", thresholdRows)
await upsertTable("psy_action_plans", actionPlans)

// ----------------------------------------------------------------------------
// Contagens pós-insert para confirmar contra a fonte
// ----------------------------------------------------------------------------
async function countByEq(table: string, col: string, val: string) {
  const { count, error } = await sb
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(col, val)
  if (error) throw new Error(`count ${table} by ${col}: ${error.message}`)
  return count ?? 0
}
async function countByIn(table: string, col: string, vals: string[]) {
  const { count, error } = await sb
    .from(table)
    .select("*", { count: "exact", head: true })
    .in(col, vals)
  if (error) throw new Error(`count ${table} by ${col} IN: ${error.message}`)
  return count ?? 0
}

const dimIds = dimensions.map((d) => d.id)

const cInstrument = await countByEq("psy_instruments", "id", instrumentId)
const cDimensions = await countByEq("psy_dimensions", "instrumentId", instrumentId)
const cQuestions = await countByIn("psy_questions", "dimensionId", dimIds)
const cThresholds = await countByEq("psy_thresholds", "instrumentId", instrumentId)
const cActionPlans = await countByIn("psy_action_plans", "dimensionId", dimIds)

const cProt = await sb
  .from("psy_dimensions")
  .select("*", { count: "exact", head: true })
  .eq("instrumentId", instrumentId)
  .eq("tipo", "Protetiva")
const cInv = await sb
  .from("psy_questions")
  .select("*", { count: "exact", head: true })
  .in("dimensionId", dimIds)
  .eq("direcao", "Inversa")

console.log("\n[seed-psy-nr1] CONTAGENS PÓS-SEED (vs esperado):")
console.log(`  psy_instruments      ${cInstrument}    (esperado 1)`)
console.log(`  psy_dimensions       ${cDimensions}   (esperado 34)`)
console.log(`    dim Protetiva      ${cProt.count ?? 0}   (esperado 17)`)
console.log(`  psy_questions        ${cQuestions}  (esperado 102)`)
console.log(`    perguntas Inversa  ${cInv.count ?? 0}   (esperado 56)`)
console.log(`  psy_thresholds       ${cThresholds}   (esperado ${thresholdRows.length})`)
console.log(`  psy_action_plans     ${cActionPlans}  (esperado 34, texto vazio, a redigir)`)

const ok =
  cInstrument === 1 &&
  cDimensions === 34 &&
  (cProt.count ?? 0) === 17 &&
  cQuestions === 102 &&
  (cInv.count ?? 0) === 56 &&
  cThresholds === thresholdRows.length &&
  cActionPlans === 34

if (!ok) {
  console.error("\n[seed-psy-nr1] AVISO: contagens não batem com o esperado. Revê.")
  process.exit(2)
}

console.log("\n[seed-psy-nr1] OK: contagens batem com a fonte.")
