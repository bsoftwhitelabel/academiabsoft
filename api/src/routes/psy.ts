/**
 * Endpoint de agregados do módulo Saúde Mental.
 *
 * INVARIANTE: este endpoint devolve EXCLUSIVAMENTE agregados já gated
 * (N >= minN, default 5). NUNCA devolve psy_responses nem psy_answers
 * individuais ao cliente.
 *
 * Pipeline:
 *   1. requireAuth: valida JWT Supabase, resolve tenantId em c.var.user.
 *   2. Lê psy_campaigns (id, tenantId, instrumentId). Exige
 *      campaign.tenantId === user.tenantId; senão 403.
 *   3. Lê psy_dimensions, psy_questions, psy_thresholds desse instrumento.
 *   4. Lê psy_responses (id, areaId apenas, sem token, sem identidade) e
 *      psy_answers (responseId, questionId, valor) via service role.
 *   5. Corre motor.compute() e motor.computePorArea().
 *   6. Devolve { meta, geral, por_area }. Sem userId, sem email no payload.
 *
 * LOGS: este handler NÃO emite logs com identificadores do utilizador.
 */
import cuid from "cuid"
import { Hono } from "hono"
import { z } from "zod"
import type { SupabaseClient } from "@supabase/supabase-js"
import { env } from "../env.js"
import { requireAuth } from "../middleware/auth.js"
import { getSupabaseAdmin } from "../services/supabase.js"
import {
  compute,
  computePorArea,
  type Answer,
  type Dimension,
  type Question,
  type Response,
  type Thresholds,
} from "../psy/motor.js"
import { generateToken } from "../psy/tokens.js"

export const psyRoutes = new Hono()

type ThresholdRow = { tipo: string; chave: string; valor: number | string }

function buildThresholds(rows: ThresholdRow[]): Thresholds {
  const find = (tipo: string, chave: string): number => {
    const r = rows.find((x) => x.tipo === tipo && x.chave === chave)
    if (!r) throw new Error(`Threshold ausente: ${tipo}/${chave}`)
    return Number(r.valor)
  }
  return {
    classificacao: {
      favoravel_ate: find("classificacao", "favoravel_ate"),
      atencao_ate: find("classificacao", "atencao_ate"),
      risco_ate: find("classificacao", "risco_ate"),
    },
    igrp: {
      z1: find("igrp", "z1"),
      z2: find("igrp", "z2"),
      z3: find("igrp", "z3"),
    },
    criticidade: {
      p3_min: find("criticidade", "p3_min"),
      p2_min: find("criticidade", "p2_min"),
      p1_min: find("criticidade", "p1_min"),
    },
  }
}

// ----------------------------------------------------------------------------
// GET /api/psy/instrument
// Devolve instrumento + dimensões + perguntas (count) + thresholds do tenant.
// Frontend mostra na página de Configuração. Os textos das perguntas em si
// não vão por defeito (a UI mostra contagens); só metadados de dimensão.
// ----------------------------------------------------------------------------
type InstrumentRow = {
  id: string
  tenantId: string
  versao: string
  etiqueta_validacao: string
  estado: string
  criadoEm: string
}

psyRoutes.get("/instrument", requireAuth, async (c) => {
  const user = c.get("user")
  const sb = getSupabaseAdmin()

  const { data: instRaw, error: ei } = await sb
    .from("psy_instruments")
    .select("id, tenantId, versao, etiqueta_validacao, estado, criadoEm")
    .eq("tenantId", user.tenantId)
    .order("criadoEm", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (ei) return c.json({ error: ei.message }, 500)
  const inst = instRaw as InstrumentRow | null
  if (!inst) return c.json({ error: "Instrumento nao configurado" }, 404)

  const { data: dimsRaw, error: ed } = await sb
    .from("psy_dimensions")
    .select("id, codigo, nome, bloco, grupo, tipo, impacto, ordem")
    .eq("instrumentId", inst.id)
    .order("ordem", { ascending: true })
  if (ed) return c.json({ error: ed.message }, 500)
  const dimensions = (dimsRaw ?? []) as Array<{
    id: string
    codigo: string
    nome: string
    bloco: string | null
    grupo: string
    tipo: string
    impacto: number
    ordem: number
  }>

  // Count perguntas por dimensão
  const dimIds = dimensions.map((d) => d.id)
  const questionCountByDim = new Map<string, number>()
  if (dimIds.length > 0) {
    const { data: qsRaw, error: eq } = await sb
      .from("psy_questions")
      .select("dimensionId")
      .in("dimensionId", dimIds)
    if (eq) return c.json({ error: eq.message }, 500)
    for (const q of qsRaw ?? []) {
      const did = (q as { dimensionId: string }).dimensionId
      questionCountByDim.set(did, (questionCountByDim.get(did) ?? 0) + 1)
    }
  }

  const { data: thrRaw, error: et } = await sb
    .from("psy_thresholds")
    .select("tipo, chave, valor")
    .eq("instrumentId", inst.id)
  if (et) return c.json({ error: et.message }, 500)
  const thresholds = (thrRaw ?? []) as Array<{
    tipo: string
    chave: string
    valor: number
  }>

  return c.json({
    instrument: {
      id: inst.id,
      versao: inst.versao,
      etiquetaValidacao: inst.etiqueta_validacao,
      estado: inst.estado,
      criadoEm: inst.criadoEm,
    },
    dimensions: dimensions.map((d) => ({
      ...d,
      questionCount: questionCountByDim.get(d.id) ?? 0,
    })),
    thresholds,
  })
})

// ----------------------------------------------------------------------------
// GET /api/psy/campaigns
// Lista campanhas do tenant, com nome da empresa cliente, totais de áreas
// e contagem de respostas. Não devolve respostas individuais.
// ----------------------------------------------------------------------------
psyRoutes.get("/campaigns", requireAuth, async (c) => {
  const user = c.get("user")
  const sb = getSupabaseAdmin()

  const { data: campsRaw, error: ec } = await sb
    .from("psy_campaigns")
    .select(
      "id, tenantId, clientOrgId, instrumentId, comprimento, inicio, fim, metaAmostragemPct, estado, criadoEm"
    )
    .eq("tenantId", user.tenantId)
    .order("criadoEm", { ascending: false })
  if (ec) return c.json({ error: ec.message }, 500)
  const camps = (campsRaw ?? []) as Array<{
    id: string
    tenantId: string
    clientOrgId: string
    instrumentId: string
    comprimento: string
    inicio: string | null
    fim: string | null
    metaAmostragemPct: number | null
    estado: string
    criadoEm: string
  }>

  if (camps.length === 0) return c.json({ campaigns: [] })

  const clientIds = Array.from(new Set(camps.map((c) => c.clientOrgId)))
  const { data: orgsRaw, error: eo } = await sb
    .from("client_orgs")
    .select("id, name")
    .in("id", clientIds)
  if (eo) return c.json({ error: eo.message }, 500)
  const orgNameById = new Map<string, string>()
  for (const o of orgsRaw ?? []) {
    orgNameById.set((o as { id: string }).id, (o as { name: string }).name)
  }

  // Para cada campanha, contar áreas (esperados) e respostas
  const campIds = camps.map((c) => c.id)
  const expectedByCamp = new Map<string, number>()
  const responsesByCamp = new Map<string, number>()
  const tokensByCamp = new Map<string, { total: number; usados: number }>()

  const { data: areasRaw, error: ea } = await sb
    .from("psy_campaign_areas")
    .select("campaignId, esperados")
    .in("campaignId", campIds)
  if (ea) return c.json({ error: ea.message }, 500)
  for (const a of areasRaw ?? []) {
    const cid = (a as { campaignId: string }).campaignId
    const esp = (a as { esperados: number }).esperados
    expectedByCamp.set(cid, (expectedByCamp.get(cid) ?? 0) + esp)
  }

  const { data: respsRaw, error: er } = await sb
    .from("psy_responses")
    .select("campaignId")
    .in("campaignId", campIds)
  if (er) return c.json({ error: er.message }, 500)
  for (const r of respsRaw ?? []) {
    const cid = (r as { campaignId: string }).campaignId
    responsesByCamp.set(cid, (responsesByCamp.get(cid) ?? 0) + 1)
  }

  const { data: tksRaw, error: etk } = await sb
    .from("psy_dispatch_tokens")
    .select("campaignId, estado")
    .in("campaignId", campIds)
  if (etk) return c.json({ error: etk.message }, 500)
  for (const t of tksRaw ?? []) {
    const cid = (t as { campaignId: string }).campaignId
    const est = (t as { estado: string }).estado
    const cur = tokensByCamp.get(cid) ?? { total: 0, usados: 0 }
    cur.total++
    if (est === "usado") cur.usados++
    tokensByCamp.set(cid, cur)
  }

  return c.json({
    campaigns: camps.map((c) => ({
      id: c.id,
      clientOrgId: c.clientOrgId,
      clientOrgName: orgNameById.get(c.clientOrgId) ?? "(empresa removida)",
      comprimento: c.comprimento,
      inicio: c.inicio,
      fim: c.fim,
      metaAmostragemPct: c.metaAmostragemPct,
      estado: c.estado,
      criadoEm: c.criadoEm,
      esperados: expectedByCamp.get(c.id) ?? 0,
      respostas: responsesByCamp.get(c.id) ?? 0,
      tokens: tokensByCamp.get(c.id) ?? { total: 0, usados: 0 },
    })),
  })
})

// ----------------------------------------------------------------------------
// POST /api/psy/campaigns
// Cria campanha + áreas, no tenant do utilizador autenticado.
// Body: { clientOrgId, comprimento, inicio?, fim?, metaAmostragemPct?, areas: [{area, esperados}] }
// ----------------------------------------------------------------------------
const createCampaignBody = z.object({
  clientOrgId: z.string().min(1),
  comprimento: z.enum(["curto", "medio", "longo"]),
  inicio: z.string().nullable().optional(),
  fim: z.string().nullable().optional(),
  metaAmostragemPct: z.number().int().min(0).max(100).nullable().optional(),
  areas: z
    .array(
      z.object({
        area: z.string().min(1).max(120),
        esperados: z.number().int().min(0).max(10000),
      })
    )
    .min(1)
    .max(50),
})

psyRoutes.post("/campaigns", requireAuth, async (c) => {
  const user = c.get("user")
  const sb = getSupabaseAdmin()

  const raw = await c.req.json().catch(() => null)
  if (!raw) return c.json({ error: "JSON invalido" }, 400)
  const parsed = createCampaignBody.safeParse(raw)
  if (!parsed.success) {
    return c.json(
      { error: "Body invalido", details: parsed.error.format() },
      400
    )
  }
  const body = parsed.data

  // Validar que client_org pertence ao tenant
  const { data: orgRaw, error: eo } = await sb
    .from("client_orgs")
    .select("id, tenantId")
    .eq("id", body.clientOrgId)
    .maybeSingle()
  if (eo) return c.json({ error: eo.message }, 500)
  const org = orgRaw as { id: string; tenantId: string } | null
  if (!org) return c.json({ error: "Empresa cliente nao encontrada" }, 404)
  if (org.tenantId !== user.tenantId) {
    return c.json({ error: "Acesso negado" }, 403)
  }

  // Buscar instrumento do tenant
  const { data: instRaw, error: ei } = await sb
    .from("psy_instruments")
    .select("id")
    .eq("tenantId", user.tenantId)
    .order("criadoEm", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (ei) return c.json({ error: ei.message }, 500)
  const inst = instRaw as { id: string } | null
  if (!inst) return c.json({ error: "Instrumento nao configurado" }, 400)

  const campaignId = cuid()
  const { error: ec } = await sb.from("psy_campaigns").insert({
    id: campaignId,
    tenantId: user.tenantId,
    clientOrgId: body.clientOrgId,
    instrumentId: inst.id,
    comprimento: body.comprimento,
    inicio: body.inicio ?? null,
    fim: body.fim ?? null,
    metaAmostragemPct: body.metaAmostragemPct ?? null,
    estado: "rascunho",
  })
  if (ec) return c.json({ error: ec.message }, 500)

  const areaRows = body.areas.map((a) => ({
    id: cuid(),
    campaignId,
    area: a.area,
    esperados: a.esperados,
  }))
  const { error: ea } = await sb.from("psy_campaign_areas").insert(areaRows)
  if (ea) return c.json({ error: ea.message }, 500)

  return c.json({ ok: true, campaignId })
})

// ----------------------------------------------------------------------------
// GET /api/psy/campaigns/:campaignId/links
// Devolve, por área, a lista de URLs públicos /q/psy/:token e estado dos
// tokens (pendente/enviado/usado). Para o operador entregar ao RH (Modelo 2).
// ----------------------------------------------------------------------------
psyRoutes.get(
  "/campaigns/:campaignId/links",
  requireAuth,
  async (c) => {
    const user = c.get("user")
    const campaignId = c.req.param("campaignId")
    const sb = getSupabaseAdmin()

    const cr = await loadCampaignForUser(sb, campaignId, user.tenantId)
    if ("error" in cr) return c.json({ error: cr.error }, cr.status)

    const { data: areasRaw, error: ea } = await sb
      .from("psy_campaign_areas")
      .select("id, area, esperados")
      .eq("campaignId", campaignId)
      .order("area")
    if (ea) return c.json({ error: ea.message }, 500)
    const areas = (areasRaw ?? []) as Array<{
      id: string
      area: string
      esperados: number
    }>

    const { data: tksRaw, error: et } = await sb
      .from("psy_dispatch_tokens")
      .select("id, token, areaId, estado, expiraEm, usadoEm")
      .eq("campaignId", campaignId)
      .order("areaId")
    if (et) return c.json({ error: et.message }, 500)
    const tokens = (tksRaw ?? []) as Array<{
      id: string
      token: string
      areaId: string
      estado: "pendente" | "enviado" | "usado"
      expiraEm: string | null
      usadoEm: string | null
    }>

    const base = env.PUBLIC_APP_ORIGIN.replace(/\/+$/, "")
    const tokensByArea = new Map<string, typeof tokens>()
    for (const t of tokens) {
      const arr = tokensByArea.get(t.areaId) ?? []
      arr.push(t)
      tokensByArea.set(t.areaId, arr)
    }

    return c.json({
      areas: areas.map((a) => {
        const list = tokensByArea.get(a.id) ?? []
        return {
          areaId: a.id,
          area: a.area,
          esperados: a.esperados,
          tokens: list.map((t) => ({
            id: t.id,
            estado: t.estado,
            expiraEm: t.expiraEm,
            usadoEm: t.usadoEm,
            url: `${base}/q/psy/${t.token}`,
          })),
          counts: {
            total: list.length,
            pendente: list.filter((t) => t.estado === "pendente").length,
            enviado: list.filter((t) => t.estado === "enviado").length,
            usado: list.filter((t) => t.estado === "usado").length,
          },
        }
      }),
    })
  }
)

psyRoutes.get("/campaigns/:campaignId/agregados", requireAuth, async (c) => {
  const user = c.get("user")
  const campaignId = c.req.param("campaignId")
  if (!campaignId || campaignId.length < 4) {
    return c.json({ error: "campaignId inválido" }, 400)
  }

  const sb = getSupabaseAdmin()

  const { data: camp, error: e1 } = await sb
    .from("psy_campaigns")
    .select("id, tenantId, instrumentId, estado")
    .eq("id", campaignId)
    .maybeSingle()
  if (e1) return c.json({ error: e1.message }, 500)
  if (!camp) return c.json({ error: "Campanha não encontrada" }, 404)

  // Multi-tenant: bloquear acesso cruzado entre tenants. Resposta 403 sem
  // expor detalhes que ajudem enumeração.
  if ((camp as { tenantId?: string }).tenantId !== user.tenantId) {
    return c.json({ error: "Acesso negado" }, 403)
  }

  const { data: dimsRaw, error: e2 } = await sb
    .from("psy_dimensions")
    .select("id, codigo, nome, bloco, grupo, tipo, impacto, ordem")
    .eq("instrumentId", camp.instrumentId)
  if (e2) return c.json({ error: e2.message }, 500)
  const dimensions = (dimsRaw ?? []) as Dimension[]

  const dimIds = dimensions.map((d) => d.id)
  let questions: Question[] = []
  if (dimIds.length > 0) {
    const { data: qs, error: e3 } = await sb
      .from("psy_questions")
      .select("id, dimensionId, codigo, direcao, ordem")
      .in("dimensionId", dimIds)
    if (e3) return c.json({ error: e3.message }, 500)
    questions = (qs ?? []) as Question[]
  }

  const { data: thrRows, error: e4 } = await sb
    .from("psy_thresholds")
    .select("tipo, chave, valor")
    .eq("instrumentId", camp.instrumentId)
  if (e4) return c.json({ error: e4.message }, 500)
  let thresholds: Thresholds
  try {
    thresholds = buildThresholds((thrRows ?? []) as ThresholdRow[])
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return c.json({ error: `Thresholds inválidos: ${msg}` }, 500)
  }

  const { data: respsRaw, error: e5 } = await sb
    .from("psy_responses")
    .select("id, areaId")
    .eq("campaignId", campaignId)
  if (e5) return c.json({ error: e5.message }, 500)
  const responses = (respsRaw ?? []) as Response[]

  let answers: Answer[] = []
  const respIds = responses.map((r) => r.id)
  if (respIds.length > 0) {
    const { data: ans, error: e6 } = await sb
      .from("psy_answers")
      .select("responseId, questionId, valor")
      .in("responseId", respIds)
    if (e6) return c.json({ error: e6.message }, 500)
    answers = (ans ?? []) as Answer[]
  }

  const geral = compute(
    responses,
    answers,
    dimensions,
    questions,
    thresholds
  )
  const por_area = computePorArea(
    responses,
    answers,
    dimensions,
    questions,
    thresholds
  )

  // ATENÇÃO: NUNCA acrescentar `responses` ou `answers` à resposta. Estes
  // dois nomes não devem aparecer no objecto devolvido ao cliente.
  return c.json({
    meta: {
      campaignId: camp.id,
      instrumentId: camp.instrumentId,
      estado: camp.estado,
    },
    geral,
    por_area,
  })
})

// ============================================================================
// Admin: ciclo de vida dos tokens e da campanha. Todos com requireAuth e
// validação cruzada de tenantId.
// ============================================================================

type CampaignRow = {
  id: string
  tenantId: string
  instrumentId: string
  estado: string
}

async function loadCampaignForUser(
  sb: SupabaseClient,
  campaignId: string,
  userTenantId: string
): Promise<
  | { camp: CampaignRow }
  | { error: string; status: 403 | 404 | 500 }
> {
  const { data, error } = await sb
    .from("psy_campaigns")
    .select("id, tenantId, instrumentId, estado")
    .eq("id", campaignId)
    .maybeSingle()
  if (error) return { error: error.message, status: 500 }
  const camp = data as CampaignRow | null
  if (!camp) return { error: "Campanha nao encontrada", status: 404 }
  if (camp.tenantId !== userTenantId) {
    return { error: "Acesso negado", status: 403 }
  }
  return { camp }
}

// ----------------------------------------------------------------------------
// POST /api/psy/campaigns/:campaignId/tokens/generate
// Gera N tokens por área (N = psy_campaign_areas.esperados).
// Body opcional: { expiraEmDias?: number (1..365, default 30) }
// ----------------------------------------------------------------------------
psyRoutes.post(
  "/campaigns/:campaignId/tokens/generate",
  requireAuth,
  async (c) => {
    const user = c.get("user")
    const campaignId = c.req.param("campaignId")
    const sb = getSupabaseAdmin()

    const cr = await loadCampaignForUser(sb, campaignId, user.tenantId)
    if ("error" in cr) return c.json({ error: cr.error }, cr.status)

    let expiraEmDias = 30
    const raw = await c.req.json().catch(() => null)
    if (raw && typeof raw === "object" && raw !== null) {
      const v = (raw as { expiraEmDias?: unknown }).expiraEmDias
      if (typeof v === "number" && v > 0 && v <= 365) {
        expiraEmDias = Math.round(v)
      }
    }
    const expiraEm = new Date(
      Date.now() + expiraEmDias * 24 * 60 * 60 * 1000
    ).toISOString()

    const { data: areasRaw, error: ea } = await sb
      .from("psy_campaign_areas")
      .select("id, area, esperados")
      .eq("campaignId", campaignId)
    if (ea) return c.json({ error: ea.message }, 500)
    const areas = (areasRaw ?? []) as Array<{
      id: string
      area: string
      esperados: number
    }>
    if (areas.length === 0) {
      return c.json({ error: "Campanha sem areas definidas" }, 400)
    }

    type TokenRow = {
      id: string
      campaignId: string
      token: string
      areaId: string
      estado: "pendente"
      emailTemp: null
      expiraEm: string
    }
    const rows: TokenRow[] = []
    const perArea: Record<string, number> = {}
    for (const a of areas) {
      perArea[a.area] = 0
      for (let i = 0; i < a.esperados; i++) {
        rows.push({
          id: cuid(),
          campaignId,
          token: generateToken(),
          areaId: a.id,
          estado: "pendente",
          emailTemp: null,
          expiraEm,
        })
        perArea[a.area]++
      }
    }

    if (rows.length === 0) {
      return c.json({ generated: 0, perArea, expiraEm })
    }

    const { error: ei } = await sb.from("psy_dispatch_tokens").insert(rows)
    if (ei) return c.json({ error: ei.message }, 500)

    return c.json({ generated: rows.length, perArea, expiraEm })
  }
)

// ----------------------------------------------------------------------------
// POST /api/psy/campaigns/:campaignId/tokens/dispatch
// STUB: marca tokens pendentes como enviados e purga emailTemp (set null).
// Envio real (Resend) fica para depois. Depois do dispatch não pode existir
// ligação token-email na BD.
// ----------------------------------------------------------------------------
psyRoutes.post(
  "/campaigns/:campaignId/tokens/dispatch",
  requireAuth,
  async (c) => {
    const user = c.get("user")
    const campaignId = c.req.param("campaignId")
    const sb = getSupabaseAdmin()

    const cr = await loadCampaignForUser(sb, campaignId, user.tenantId)
    if ("error" in cr) return c.json({ error: cr.error }, cr.status)

    const { data, error } = await sb
      .from("psy_dispatch_tokens")
      .update({ estado: "enviado", emailTemp: null })
      .eq("campaignId", campaignId)
      .eq("estado", "pendente")
      .select("id")
    if (error) return c.json({ error: error.message }, 500)

    return c.json({
      dispatched: data?.length ?? 0,
      stub: true,
      note: "Stub: marca enviado e purga emailTemp. Envio real fica para depois.",
    })
  }
)

// ----------------------------------------------------------------------------
// POST /api/psy/campaigns/:campaignId/close
// Encerra a campanha e PURGA os tokens usados (DELETE), eliminando a
// correlação token-resposta no schema. Complemento do hardening R1.
// ----------------------------------------------------------------------------
psyRoutes.post("/campaigns/:campaignId/close", requireAuth, async (c) => {
  const user = c.get("user")
  const campaignId = c.req.param("campaignId")
  const sb = getSupabaseAdmin()

  const cr = await loadCampaignForUser(sb, campaignId, user.tenantId)
  if ("error" in cr) return c.json({ error: cr.error }, cr.status)

  const { error: e1 } = await sb
    .from("psy_campaigns")
    .update({ estado: "encerrada" })
    .eq("id", campaignId)
  if (e1) return c.json({ error: e1.message }, 500)

  const { data: del, error: e2 } = await sb
    .from("psy_dispatch_tokens")
    .delete()
    .eq("campaignId", campaignId)
    .eq("estado", "usado")
    .select("id")
  if (e2) return c.json({ error: e2.message }, 500)

  return c.json({
    closed: true,
    tokensUsadosPurgados: del?.length ?? 0,
  })
})
