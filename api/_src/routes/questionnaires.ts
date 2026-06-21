import { Hono } from "hono"
import { z } from "zod"
import cuid from "cuid"
import { getSupabaseAdmin } from "../services/supabase.js"
import { assertPdfEnv } from "../env.js"
import { getClientIp, rateLimit } from "../middleware/rate-limit.js"

export const questionnaireRoutes = new Hono()

// Aceita base64url de ~22 chars (gerador interno) ou tokens de teste
// alfanuméricos. Rejeita lixo (espaços, slashes, etc.).
const TOKEN_RE = /^[A-Za-z0-9_-]{10,64}$/

const answerSchema = z.object({
  questionId: z.string().min(1),
  scaleValue: z.number().nullable().optional(),
  textValue: z.string().max(5000).nullable().optional(),
})

const postBodySchema = z.object({
  answers: z.array(answerSchema).min(1),
})

type Question = {
  id: string
  type: "SCALE" | "TEXT"
  scaleMin: number | null
  scaleMax: number | null
  isRequired: boolean
}

function expired(expiresAt: string | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() < Date.now()
}

questionnaireRoutes.get("/:token", rateLimit(30, "get"), async (c) => {
  const token = c.req.param("token")
  if (!TOKEN_RE.test(token)) {
    return c.json({ error: "Token invalido" }, 400)
  }
  const envErr = assertPdfEnv()
  if (envErr) return c.json({ error: envErr }, 500)

  const sb = getSupabaseAdmin()

  const { data: response, error: rErr } = await sb
    .from("questionnaire_responses")
    .select(
      "id, questionnaireId, trainingActionId, traineeId, trainerId, respondedAt, expiresAt"
    )
    .eq("token", token)
    .maybeSingle()
  if (rErr) return c.json({ error: rErr.message }, 500)
  if (!response) return c.json({ error: "Token nao encontrado" }, 404)

  if (response.respondedAt) {
    return c.json({ status: "done", respondedAt: response.respondedAt })
  }
  if (expired(response.expiresAt)) {
    return c.json({ status: "expired" }, 410)
  }

  const { data: questionnaire, error: qErr } = await sb
    .from("questionnaires")
    .select("id, name, format, targetRole, context")
    .eq("id", response.questionnaireId)
    .maybeSingle()
  if (qErr) return c.json({ error: qErr.message }, 500)
  if (!questionnaire) return c.json({ error: "Questionario inexistente" }, 404)

  const { data: questions, error: qsErr } = await sb
    .from("questionnaire_questions")
    .select("id, text, type, scaleMin, scaleMax, order, isRequired")
    .eq("questionnaireId", response.questionnaireId)
    .order("order", { ascending: true })
  if (qsErr) return c.json({ error: qsErr.message }, 500)

  let respondentName = "Respondente"
  if (response.traineeId) {
    const { data: t } = await sb
      .from("trainees")
      .select("firstName, lastName")
      .eq("id", response.traineeId)
      .maybeSingle()
    if (t) respondentName = `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() || respondentName
  } else if (response.trainerId) {
    const { data: tr } = await sb
      .from("trainers")
      .select("firstName, lastName, userId")
      .eq("id", response.trainerId)
      .maybeSingle()
    if (tr) {
      const direct = `${tr.firstName ?? ""} ${tr.lastName ?? ""}`.trim()
      if (direct) {
        respondentName = direct
      } else if (tr.userId) {
        const { data: u } = await sb
          .from("users")
          .select("firstName, lastName")
          .eq("id", tr.userId)
          .maybeSingle()
        if (u) {
          const viaUser = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
          if (viaUser) respondentName = viaUser
        }
      }
    }
  }

  let action: { actionCode: string } | null = null
  if (response.trainingActionId) {
    const { data: a } = await sb
      .from("training_actions")
      .select("actionCode")
      .eq("id", response.trainingActionId)
      .maybeSingle()
    if (a?.actionCode) action = { actionCode: a.actionCode }
  }

  return c.json({
    status: "pending",
    respondentName,
    questionnaire,
    questions: questions ?? [],
    action,
  })
})

questionnaireRoutes.post("/:token", rateLimit(3, "post"), async (c) => {
  const token = c.req.param("token")
  if (!TOKEN_RE.test(token)) {
    return c.json({ error: "Token invalido" }, 400)
  }
  const envErr = assertPdfEnv()
  if (envErr) return c.json({ error: envErr }, 500)

  const raw = await c.req.json().catch(() => null)
  if (!raw) return c.json({ error: "JSON invalido" }, 400)
  const parsed = postBodySchema.safeParse(raw)
  if (!parsed.success) {
    return c.json(
      { error: "Body invalido", details: parsed.error.format() },
      400
    )
  }

  const sb = getSupabaseAdmin()

  const { data: response, error: rErr } = await sb
    .from("questionnaire_responses")
    .select("id, questionnaireId, respondedAt, expiresAt")
    .eq("token", token)
    .maybeSingle()
  if (rErr) return c.json({ error: rErr.message }, 500)
  if (!response) return c.json({ error: "Token nao encontrado" }, 404)
  if (response.respondedAt) {
    return c.json(
      { error: "Ja respondido", respondedAt: response.respondedAt },
      409
    )
  }
  if (expired(response.expiresAt)) {
    return c.json({ error: "Token expirado" }, 410)
  }

  const { data: rawQuestions, error: qsErr } = await sb
    .from("questionnaire_questions")
    .select("id, type, scaleMin, scaleMax, isRequired")
    .eq("questionnaireId", response.questionnaireId)
  if (qsErr) return c.json({ error: qsErr.message }, 500)
  const questions = (rawQuestions ?? []) as Question[]
  const qMap = new Map(questions.map((q) => [q.id, q]))

  const errors: string[] = []
  const seen = new Set<string>()
  for (const ans of parsed.data.answers) {
    if (seen.has(ans.questionId)) {
      errors.push(`Pergunta ${ans.questionId} duplicada no payload`)
      continue
    }
    seen.add(ans.questionId)
    const q = qMap.get(ans.questionId)
    if (!q) {
      errors.push(`Pergunta desconhecida: ${ans.questionId}`)
      continue
    }
    if (q.type === "SCALE") {
      if (ans.scaleValue == null) {
        if (q.isRequired)
          errors.push(`Pergunta ${q.id} requer scaleValue`)
        continue
      }
      const v = ans.scaleValue
      const min = q.scaleMin ?? 1
      const max = q.scaleMax ?? 5
      if (!Number.isInteger(v)) {
        errors.push(`Pergunta ${q.id} scaleValue tem de ser inteiro`)
      } else if (v < min || v > max) {
        errors.push(
          `Pergunta ${q.id} scaleValue fora do intervalo ${min}-${max}`
        )
      }
    } else if (q.type === "TEXT") {
      const t = ans.textValue
      if ((!t || t.length === 0) && q.isRequired) {
        errors.push(`Pergunta ${q.id} requer textValue`)
      } else if (t && t.length > 5000) {
        errors.push(`Pergunta ${q.id} textValue excede 5000 caracteres`)
      }
    }
  }

  for (const q of questions) {
    if (!q.isRequired) continue
    if (!seen.has(q.id)) errors.push(`Falta resposta obrigatoria a ${q.id}`)
  }

  if (errors.length) {
    return c.json({ error: "Validacao", details: errors }, 400)
  }

  const now = new Date().toISOString()
  const rows = parsed.data.answers.map((ans) => ({
    id: cuid(),
    responseId: response.id,
    questionId: ans.questionId,
    scaleValue: ans.scaleValue ?? null,
    textValue: ans.textValue ?? null,
  }))
  const { error: insErr } = await sb.from("questionnaire_answers").insert(rows)
  if (insErr) return c.json({ error: insErr.message }, 500)

  const { error: updErr } = await sb
    .from("questionnaire_responses")
    .update({
      respondedAt: now,
      respondentIp: getClientIp(c),
      respondentUserAgent: c.req.header("user-agent") ?? null,
    })
    .eq("id", response.id)
  if (updErr) return c.json({ error: updErr.message }, 500)

  return c.json({ ok: true, respondedAt: now })
})
