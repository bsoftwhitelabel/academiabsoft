/**
 * Seed de RESPOSTAS FICTÍCIAS para uma campanha demo do módulo Saúde Mental.
 *
 * Objectivo: ter dados realistas para mostrar Acompanhamento, Resultados e
 * Diagnóstico no demo, com N>=5 por área para o gating não bloquear.
 *
 * Convenção: tudo o que este script cria fica marcado com prefixo "[DEMO]"
 * no nome do client_org, para ser facilmente identificável e limpável.
 *
 * INVARIANTE A1 (anonimato): as respostas são inseridas SEM tokenId, email,
 * IP, userAgent. Builders enforçam as chaves permitidas. NÃO criamos tokens
 * em psy_dispatch_tokens; este script simula respostas anónimas em massa
 * para o demo, sem replay do fluxo público real.
 *
 * Uso:
 *   cd api
 *   npx tsx scripts/seed-psy-fixture-responses.ts             # cria/preenche
 *   npx tsx scripts/seed-psy-fixture-responses.ts --clean     # apaga só demo
 *   npx tsx scripts/seed-psy-fixture-responses.ts --reset     # clean + recria
 */
import { config as loadEnv } from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { createClient } from "@supabase/supabase-js"
import cuid from "cuid"
import {
  buildPsyAnswerRows,
  buildPsyResponseRow,
} from "../_src/psy/builders.js"

const here = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(here, "..", ".env") })

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TENANT_ID = process.env.PSY_SEED_TENANT_ID

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("[fixture] falta SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}
if (!TENANT_ID) {
  console.error("[fixture] falta PSY_SEED_TENANT_ID")
  process.exit(1)
}

const DRY = process.argv.includes("--dry-run")
const CLEAN = process.argv.includes("--clean") || process.argv.includes("--reset")
const RESET = process.argv.includes("--reset")
const ONLY_CLEAN = process.argv.includes("--clean") && !RESET

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const DEMO_CLIENT_NAME = "[DEMO] Metalúrgica Atlântico"
const DEMO_AREAS: Array<{ area: string; esperados: number; bias: number }> = [
  { area: "Produção", esperados: 12, bias: 3.7 },
  { area: "Administrativo", esperados: 8, bias: 2.8 },
  { area: "Logística", esperados: 7, bias: 4.0 },
  { area: "Manutenção", esperados: 6, bias: 3.4 },
]
const RESP_PCT_BY_AREA: Record<string, number> = {
  Produção: 0.83,        // 10/12
  Administrativo: 1.0,   // 8/8
  Logística: 0.71,       // 5/7
  Manutenção: 0.83,      // 5/6
}

// ----------------------------------------------------------------------------
// CLEAN: apaga tudo o que tem prefixo [DEMO]
// ----------------------------------------------------------------------------
async function cleanDemo(): Promise<{
  responses: number
  campaigns: number
  areas: number
  tokens: number
  orgs: number
}> {
  let stats = { responses: 0, campaigns: 0, areas: 0, tokens: 0, orgs: 0 }

  // 1. Encontrar todas as orgs [DEMO]
  const { data: orgsRaw } = await sb
    .from("client_orgs")
    .select("id, name")
    .eq("tenantId", TENANT_ID)
    .like("name", "[DEMO]%")
  const orgs = (orgsRaw ?? []) as Array<{ id: string; name: string }>
  if (orgs.length === 0) return stats

  // 2. Campanhas dessas orgs (já é tenant-scoped)
  const orgIds = orgs.map((o) => o.id)
  const { data: campsRaw } = await sb
    .from("psy_campaigns")
    .select("id")
    .eq("tenantId", TENANT_ID)
    .in("clientOrgId", orgIds)
  const camps = (campsRaw ?? []) as Array<{ id: string }>
  const campIds = camps.map((c) => c.id)

  if (campIds.length > 0) {
    // 3. Apagar respostas (CASCADE apaga answers)
    const { data: dRes } = await sb
      .from("psy_responses")
      .delete()
      .in("campaignId", campIds)
      .select("id")
    stats.responses = dRes?.length ?? 0

    // 4. Apagar tokens
    const { data: dTk } = await sb
      .from("psy_dispatch_tokens")
      .delete()
      .in("campaignId", campIds)
      .select("id")
    stats.tokens = dTk?.length ?? 0

    // 5. Apagar áreas
    const { data: dAr } = await sb
      .from("psy_campaign_areas")
      .delete()
      .in("campaignId", campIds)
      .select("id")
    stats.areas = dAr?.length ?? 0

    // 6. Apagar campanhas
    const { data: dCp } = await sb
      .from("psy_campaigns")
      .delete()
      .in("id", campIds)
      .select("id")
    stats.campaigns = dCp?.length ?? 0
  }

  // 7. Apagar orgs (só se não tiverem outras campanhas; já apagámos as nossas)
  if (RESET || ONLY_CLEAN) {
    const { data: dOr } = await sb
      .from("client_orgs")
      .delete()
      .in("id", orgIds)
      .select("id")
    stats.orgs = dOr?.length ?? 0
  }

  return stats
}

// ----------------------------------------------------------------------------
// SEED
// ----------------------------------------------------------------------------
type DimRow = {
  id: string
  codigo: string
  nome: string
  grupo: string
  tipo: "Risco" | "Protetiva"
}
type QuestionRow = {
  id: string
  dimensionId: string
  direcao: "Direta" | "Inversa"
}

async function loadInstrumentForTenant(): Promise<{
  instrumentId: string
  versao: string
  dimensionsByGroup: Map<string, DimRow[]>
  questionsByDim: Map<string, QuestionRow[]>
}> {
  const { data: instRaw, error: eI } = await sb
    .from("psy_instruments")
    .select("id, versao")
    .eq("tenantId", TENANT_ID)
    .order("criadoEm", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (eI) throw new Error(`psy_instruments: ${eI.message}`)
  if (!instRaw) {
    throw new Error("Sem instrumento para este tenant. Correr seed-psy-nr1 primeiro.")
  }
  const inst = instRaw as { id: string; versao: string }

  const { data: dimsRaw, error: eD } = await sb
    .from("psy_dimensions")
    .select("id, codigo, nome, grupo, tipo")
    .eq("instrumentId", inst.id)
  if (eD) throw new Error(`psy_dimensions: ${eD.message}`)
  const dims = (dimsRaw ?? []) as DimRow[]
  const dimensionsByGroup = new Map<string, DimRow[]>()
  for (const d of dims) {
    const k = d.grupo
    const arr = dimensionsByGroup.get(k) ?? []
    arr.push(d)
    dimensionsByGroup.set(k, arr)
  }

  const { data: qsRaw, error: eQ } = await sb
    .from("psy_questions")
    .select("id, dimensionId, direcao")
    .in("dimensionId", dims.map((d) => d.id))
  if (eQ) throw new Error(`psy_questions: ${eQ.message}`)
  const questionsByDim = new Map<string, QuestionRow[]>()
  for (const q of (qsRaw ?? []) as QuestionRow[]) {
    const arr = questionsByDim.get(q.dimensionId) ?? []
    arr.push(q)
    questionsByDim.set(q.dimensionId, arr)
  }

  return {
    instrumentId: inst.id,
    versao: inst.versao,
    dimensionsByGroup,
    questionsByDim,
  }
}

function dimensionsForComprimento(
  byGroup: Map<string, DimRow[]>,
  comprimento: "curto" | "medio" | "longo"
): DimRow[] {
  const groups =
    comprimento === "longo"
      ? ["Essencial", "Complementar", "ComplementarII"]
      : comprimento === "medio"
        ? ["Essencial", "Complementar"]
        : ["Essencial"]
  return groups.flatMap((g) => byGroup.get(g) ?? [])
}

/** Random integer [min, max] inclusive, com PRNG mulberry32 determinístico. */
function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function clampInt(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(v)))
}

async function ensureClientOrg(): Promise<{ id: string; name: string }> {
  const { data: existing } = await sb
    .from("client_orgs")
    .select("id, name")
    .eq("tenantId", TENANT_ID)
    .eq("name", DEMO_CLIENT_NAME)
    .maybeSingle()
  if (existing) return existing as { id: string; name: string }

  if (DRY) {
    console.log(`[fixture] (dry) criaria client_org "${DEMO_CLIENT_NAME}"`)
    return { id: "(dry)", name: DEMO_CLIENT_NAME }
  }
  const id = cuid()
  const now = new Date().toISOString()
  const { error } = await sb.from("client_orgs").insert({
    id,
    tenantId: TENANT_ID,
    name: DEMO_CLIENT_NAME,
    createdAt: now,
    updatedAt: now,
  })
  if (error) throw new Error(`insert client_org: ${error.message}`)
  return { id, name: DEMO_CLIENT_NAME }
}

async function ensureCampaign(
  clientOrgId: string,
  instrumentId: string
): Promise<{ id: string; created: boolean }> {
  const { data: existing } = await sb
    .from("psy_campaigns")
    .select("id")
    .eq("tenantId", TENANT_ID)
    .eq("clientOrgId", clientOrgId)
    .order("criadoEm", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (existing) return { id: (existing as { id: string }).id, created: false }

  if (DRY) {
    console.log(`[fixture] (dry) criaria campanha demo`)
    return { id: "(dry)", created: true }
  }
  const id = cuid()
  const inicio = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  const fim = new Date(Date.now() + 16 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
  const { error } = await sb.from("psy_campaigns").insert({
    id,
    tenantId: TENANT_ID,
    clientOrgId,
    instrumentId,
    comprimento: "medio",
    inicio,
    fim,
    metaAmostragemPct: 75,
    estado: "em_curso",
  })
  if (error) throw new Error(`insert psy_campaigns: ${error.message}`)
  return { id, created: true }
}

async function ensureAreas(campaignId: string): Promise<
  Array<{ id: string; area: string; esperados: number; bias: number }>
> {
  const { data: existing } = await sb
    .from("psy_campaign_areas")
    .select("id, area, esperados")
    .eq("campaignId", campaignId)
  const existingList = (existing ?? []) as Array<{
    id: string
    area: string
    esperados: number
  }>
  if (existingList.length >= DEMO_AREAS.length) {
    return existingList.map((e) => {
      const seed = DEMO_AREAS.find((d) => d.area === e.area)
      return {
        id: e.id,
        area: e.area,
        esperados: e.esperados,
        bias: seed?.bias ?? 3.2,
      }
    })
  }

  if (DRY) {
    console.log(`[fixture] (dry) criaria ${DEMO_AREAS.length} áreas`)
    return DEMO_AREAS.map((a) => ({ id: "(dry)", ...a }))
  }
  const rows = DEMO_AREAS.map((a) => ({
    id: cuid(),
    campaignId,
    area: a.area,
    esperados: a.esperados,
  }))
  const { error } = await sb.from("psy_campaign_areas").insert(rows)
  if (error) throw new Error(`insert psy_campaign_areas: ${error.message}`)
  return rows.map((r, i) => ({
    id: r.id,
    area: r.area,
    esperados: r.esperados,
    bias: DEMO_AREAS[i].bias,
  }))
}

async function seedResponsesForArea(
  campaignId: string,
  areaId: string,
  areaName: string,
  bias: number,
  esperados: number,
  versao: string,
  dimensions: DimRow[],
  questionsByDim: Map<string, QuestionRow[]>
): Promise<{ responses: number; answers: number }> {
  const pct = RESP_PCT_BY_AREA[areaName] ?? 0.85
  const n = Math.max(5, Math.round(esperados * pct))

  // PRNG estável por (campanha, area)
  const seedNum = hashString(`${campaignId}:${areaId}:${areaName}`)
  const rng = makeRng(seedNum)

  let totalAns = 0
  for (let r = 0; r < n; r++) {
    // baseline da resposta deste respondente
    const baseShift = (rng() - 0.5) * 0.8 // -0.4 .. +0.4

    const responseRow = buildPsyResponseRow({
      campaignId,
      areaId,
      instrumentVersao: versao,
    })

    if (DRY) {
      totalAns += dimensions.reduce(
        (s, d) => s + (questionsByDim.get(d.id)?.length ?? 0),
        0
      )
      continue
    }

    const { error: eR } = await sb.from("psy_responses").insert(responseRow)
    if (eR) throw new Error(`insert psy_responses: ${eR.message}`)

    // gera answers para todas as perguntas das dimensões do comprimento
    const answersIn: Array<{ questionId: string; valor: number }> = []
    for (const d of dimensions) {
      // bias por tipo: Risco usa o bias diretamente, Protetiva tendencialmente
      // alta (valor cru alto -> orientado fica baixo -> bom)
      const dimBias = d.tipo === "Risco" ? bias : 4.0
      const qs = questionsByDim.get(d.id) ?? []
      for (const q of qs) {
        // jitter por pergunta
        const jitter = (rng() - 0.5) * 1.6 // -0.8 .. +0.8
        const raw = dimBias + baseShift + jitter
        // direcao Inversa significa que o valor cru responde ao "contrário"
        // Mas como o motor já orienta no compute, aqui gravamos o valor cru
        // como se viesse da UI Likert. A semântica visual da pergunta importa
        // para fixture realista; para simplificar, mantemos valores plausíveis
        // 1..5 sem distinguir Direta/Inversa neste seed.
        const valor = clampInt(raw, 1, 5)
        answersIn.push({ questionId: q.id, valor })
      }
    }
    const answerRows = buildPsyAnswerRows(responseRow.id, answersIn)
    const { error: eA } = await sb.from("psy_answers").insert(answerRows)
    if (eA) throw new Error(`insert psy_answers: ${eA.message}`)

    totalAns += answerRows.length
  }
  return { responses: n, answers: totalAns }
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return h >>> 0
}

// ----------------------------------------------------------------------------
// MAIN
// ----------------------------------------------------------------------------
async function main() {
  console.log(`[fixture] tenant=${TENANT_ID} DRY=${DRY} CLEAN=${CLEAN} RESET=${RESET}`)

  if (CLEAN) {
    console.log(`[fixture] a apagar dados demo (prefixo "${DEMO_CLIENT_NAME.split("]")[0]}]")...`)
    const c = await cleanDemo()
    console.log(`[fixture] limpou: ${JSON.stringify(c)}`)
    if (ONLY_CLEAN) {
      console.log("[fixture] --clean: feito, a sair.")
      return
    }
  }

  const { instrumentId, versao, dimensionsByGroup, questionsByDim } =
    await loadInstrumentForTenant()

  // Comprimento "medio" para o demo. Dimensões usadas:
  const dims = dimensionsForComprimento(dimensionsByGroup, "medio")
  console.log(
    `[fixture] instrumento "${versao}" - ${dims.length} dimensões (medio)`
  )

  const org = await ensureClientOrg()
  console.log(`[fixture] client_org "${org.name}" (id=${org.id})`)

  const camp = await ensureCampaign(org.id, instrumentId)
  console.log(`[fixture] campanha (id=${camp.id}, created=${camp.created})`)

  const areas = await ensureAreas(camp.id)
  console.log(`[fixture] ${areas.length} áreas: ${areas.map((a) => a.area).join(", ")}`)

  // Verifica se já há respostas; se sim, skip (idempotente)
  if (!DRY) {
    const { count } = await sb
      .from("psy_responses")
      .select("*", { count: "exact", head: true })
      .eq("campaignId", camp.id)
    if ((count ?? 0) > 0 && !RESET) {
      console.log(
        `[fixture] já existem ${count} respostas para esta campanha. Usa --reset para recriar.`
      )
      console.log(`[fixture] campaignId: ${camp.id}`)
      return
    }
  }

  console.log(`[fixture] a inserir respostas...`)
  let totalR = 0
  let totalA = 0
  for (const a of areas) {
    const r = await seedResponsesForArea(
      camp.id,
      a.id,
      a.area,
      a.bias,
      a.esperados,
      versao,
      dims,
      questionsByDim
    )
    totalR += r.responses
    totalA += r.answers
    console.log(
      `[fixture]   ${a.area}: ${r.responses} respostas, ${r.answers} answers`
    )
  }
  console.log(`[fixture] TOTAL: ${totalR} respostas, ${totalA} answers`)
  console.log(`[fixture] campaignId: ${camp.id}`)
  console.log(`[fixture] URL admin: /admin/saude-mental/campanhas/${camp.id}`)
}

main().catch((e) => {
  console.error(`[fixture] FALHA: ${e instanceof Error ? e.message : e}`)
  process.exit(1)
})
