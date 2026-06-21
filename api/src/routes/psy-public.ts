/**
 * Endpoint público de recolha de respostas psy (formando responde via link).
 *
 * - SEM auth (link público).
 * - SEM IP/userAgent persistidos. Rate limit em memória, nunca em BD.
 * - INVARIANTE A1: psy_responses NUNCA inclui tokenId/email/IP/UA. O token é
 *   marcado usado em transacção separada da gravação da resposta.
 *
 * Caminhos:
 *   GET  /api/q/psy/:token   devolve perguntas; não grava nada
 *   POST /api/q/psy/:token   submete respostas; uso único
 */
import { Hono } from "hono"
import { z } from "zod"
import { rateLimit } from "../middleware/rate-limit.js"
import { getSupabaseAdmin } from "../services/supabase.js"
import { buildPsyAnswerRows, buildPsyResponseRow } from "../psy/builders.js"
import { isValidPsyTokenFormat } from "../psy/tokens.js"

export const psyPublicRoutes = new Hono()

type DispatchTokenRow = {
  id: string
  campaignId: string
  areaId: string
  estado: "pendente" | "enviado" | "usado"
  expiraEm: string | null
  usadoEm: string | null
}

function isExpired(expiraEm: string | null): boolean {
  if (!expiraEm) return false
  return new Date(expiraEm).getTime() < Date.now()
}

// ----------------------------------------------------------------------------
// GET /api/q/psy/:token
// ----------------------------------------------------------------------------
psyPublicRoutes.get("/:token", rateLimit(30, "psy-get"), async (c) => {
  const token = c.req.param("token")
  if (!isValidPsyTokenFormat(token)) {
    return c.json({ error: "Token invalido" }, 400)
  }

  const sb = getSupabaseAdmin()

  const { data: dtRaw, error: e1 } = await sb
    .from("psy_dispatch_tokens")
    .select("id, campaignId, areaId, estado, expiraEm, usadoEm")
    .eq("token", token)
    .maybeSingle()
  if (e1) return c.json({ error: e1.message }, 500)
  const dt = dtRaw as DispatchTokenRow | null
  if (!dt) return c.json({ error: "Token nao encontrado" }, 404)

  if (dt.estado === "usado") {
    return c.json({ status: "done", usadoEm: dt.usadoEm })
  }
  if (isExpired(dt.expiraEm)) {
    return c.json({ status: "expired" }, 410)
  }

  const { data: campRaw, error: e2 } = await sb
    .from("psy_campaigns")
    .select("id, instrumentId, comprimento, estado")
    .eq("id", dt.campaignId)
    .maybeSingle()
  if (e2) return c.json({ error: e2.message }, 500)
  const camp = campRaw as
    | { id: string; instrumentId: string; comprimento: string; estado: string }
    | null
  if (!camp) return c.json({ error: "Campanha nao encontrada" }, 404)
  if (camp.estado === "encerrada") {
    return c.json({ status: "closed" }, 410)
  }

  const { data: instRaw, error: e3 } = await sb
    .from("psy_instruments")
    .select("versao, etiqueta_validacao")
    .eq("id", camp.instrumentId)
    .maybeSingle()
  if (e3) return c.json({ error: e3.message }, 500)
  const inst = instRaw as
    | { versao: string; etiqueta_validacao: string }
    | null

  const { data: dimsRaw, error: e4 } = await sb
    .from("psy_dimensions")
    .select("id, codigo, nome, bloco, grupo, tipo, impacto, ordem")
    .eq("instrumentId", camp.instrumentId)
    .in("grupo", gruposParaComprimento(camp.comprimento))
    .order("ordem", { ascending: true })
  if (e4) return c.json({ error: e4.message }, 500)
  const dimensions = dimsRaw ?? []

  const dimIds = dimensions.map((d) => (d as { id: string }).id)
  let questions: unknown[] = []
  if (dimIds.length > 0) {
    const { data: qs, error: e5 } = await sb
      .from("psy_questions")
      .select("id, dimensionId, codigo, texto, direcao, ordem")
      .in("dimensionId", dimIds)
      .order("ordem", { ascending: true })
    if (e5) return c.json({ error: e5.message }, 500)
    questions = qs ?? []
  }

  return c.json({
    status: "pending",
    comprimento: camp.comprimento,
    instrumentVersao: inst?.versao ?? "",
    etiquetaValidacao: inst?.etiqueta_validacao ?? "",
    dimensions,
    questions,
  })
})

/**
 * Mapeia o comprimento da campanha para os grupos de dimensões aceites:
 *   curto: só Essencial
 *   medio: Essencial + Complementar
 *   longo: Essencial + Complementar + ComplementarII
 * Default conservador (caso de comprimento desconhecido): só Essencial.
 */
function gruposParaComprimento(comprimento: string): string[] {
  if (comprimento === "longo") {
    return ["Essencial", "Complementar", "ComplementarII"]
  }
  if (comprimento === "medio") return ["Essencial", "Complementar"]
  return ["Essencial"]
}

// ----------------------------------------------------------------------------
// POST /api/q/psy/:token
// ----------------------------------------------------------------------------
const submitBody = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        valor: z.number().int().min(1).max(5),
      })
    )
    .min(1)
    .max(1000),
})

psyPublicRoutes.post("/:token", rateLimit(3, "psy-post"), async (c) => {
  const token = c.req.param("token")
  if (!isValidPsyTokenFormat(token)) {
    return c.json({ error: "Token invalido" }, 400)
  }

  const raw = await c.req.json().catch(() => null)
  if (!raw) return c.json({ error: "JSON invalido" }, 400)
  const parsed = submitBody.safeParse(raw)
  if (!parsed.success) {
    return c.json(
      { error: "Body invalido", details: parsed.error.format() },
      400
    )
  }

  const sb = getSupabaseAdmin()

  // 1. Estado actual do token (verificação pré-CAS).
  const { data: dtRaw, error: e1 } = await sb
    .from("psy_dispatch_tokens")
    .select("id, campaignId, areaId, estado, expiraEm")
    .eq("token", token)
    .maybeSingle()
  if (e1) return c.json({ error: e1.message }, 500)
  const dt = dtRaw as DispatchTokenRow | null
  if (!dt) return c.json({ error: "Token nao encontrado" }, 404)
  if (dt.estado === "usado") return c.json({ error: "Token ja usado" }, 409)
  if (isExpired(dt.expiraEm)) {
    return c.json({ error: "Token expirado" }, 410)
  }

  // 2. Campanha e instrumento.
  const { data: campRaw, error: e2 } = await sb
    .from("psy_campaigns")
    .select("id, instrumentId, comprimento, estado")
    .eq("id", dt.campaignId)
    .maybeSingle()
  if (e2) return c.json({ error: e2.message }, 500)
  const camp = campRaw as
    | { id: string; instrumentId: string; comprimento: string; estado: string }
    | null
  if (!camp) return c.json({ error: "Campanha nao encontrada" }, 404)
  if (camp.estado === "encerrada") {
    return c.json({ error: "Campanha encerrada" }, 410)
  }

  const { data: instRaw, error: e3 } = await sb
    .from("psy_instruments")
    .select("versao")
    .eq("id", camp.instrumentId)
    .maybeSingle()
  if (e3) return c.json({ error: e3.message }, 500)
  const instrumentVersao =
    (instRaw as { versao?: string } | null)?.versao ?? ""

  // 3. Validar que todos os questionIds pertencem ao instrumento NO COMPRIMENTO
  // da campanha. Rejeita questionIds de grupos fora (ex: ComplementarII numa
  // campanha de comprimento "curto").
  const { data: dimsRaw, error: e4 } = await sb
    .from("psy_dimensions")
    .select("id")
    .eq("instrumentId", camp.instrumentId)
    .in("grupo", gruposParaComprimento(camp.comprimento))
  if (e4) return c.json({ error: e4.message }, 500)
  const dimIds = (dimsRaw ?? []).map((d) => (d as { id: string }).id)
  const validQuestionIds = new Set<string>()
  if (dimIds.length > 0) {
    const { data: qs, error: e5 } = await sb
      .from("psy_questions")
      .select("id")
      .in("dimensionId", dimIds)
    if (e5) return c.json({ error: e5.message }, 500)
    for (const q of qs ?? []) validQuestionIds.add((q as { id: string }).id)
  }
  for (const a of parsed.data.answers) {
    if (!validQuestionIds.has(a.questionId)) {
      return c.json(
        { error: `Pergunta desconhecida: ${a.questionId}` },
        400
      )
    }
  }

  // 4. COMPARE-AND-SWAP atómico ao nível da linha: só vence quem fizer o
  //    UPDATE com sucesso. Postgres garante atomicidade row-level.
  const { data: claimedRaw, error: e6 } = await sb
    .from("psy_dispatch_tokens")
    .update({ estado: "usado", usadoEm: new Date().toISOString() })
    .eq("id", dt.id)
    .eq("estado", dt.estado)
    .select("id")
  if (e6) return c.json({ error: e6.message }, 500)
  const claimed = claimedRaw ?? []
  if (claimed.length === 0) {
    return c.json({ error: "Token ja usado" }, 409)
  }

  // 5. INSERT psy_responses. Builder garante chaves: id, campaignId,
  //    areaId, instrumentVersao. NUNCA tokenId, email, IP, UA.
  const responseRow = buildPsyResponseRow({
    campaignId: camp.id,
    areaId: dt.areaId,
    instrumentVersao,
  })
  const { error: e7 } = await sb.from("psy_responses").insert(responseRow)
  if (e7) {
    // Token já foi marcado usado. Não tentar rollback (perderia a
    // monotonicidade do estado). Admin pode emitir novo token.
    return c.json({ error: e7.message }, 500)
  }

  // 6. INSERT psy_answers (bulk).
  const answerRows = buildPsyAnswerRows(responseRow.id, parsed.data.answers)
  const { error: e8 } = await sb.from("psy_answers").insert(answerRows)
  if (e8) return c.json({ error: e8.message }, 500)

  return c.json({ ok: true })
})
