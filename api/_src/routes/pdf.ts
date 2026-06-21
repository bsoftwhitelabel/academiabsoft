import { Hono } from "hono"
import { z } from "zod"
import { assertPdfEnv } from "../env.js"
import { getSupabaseAdmin } from "../services/supabase.js"
import { withPage } from "../services/puppeteer.js"
import { uploadPdfAndSign } from "../services/storage.js"
import { buildDossierZip } from "../services/dossier-zip.js"
import {
  TEMPLATES,
  type TemplateData,
  type FichaIdentificacaoTemplateData,
  type FolhaPresencasTemplateData,
  type RegistoSumariosTemplateData,
  type PlanoSessaoTemplateData,
  type SeparadoraTemplateData,
} from "../templates/registry.js"

const bodySchema = z.object({
  templateCode: z.string().min(1),
  actionId: z.string().min(1),
  // Apenas usados pela separadora (Template 6). Opcionais -> /generate-mass
  // e os outros templates ignoram-nos.
  sectionNumber: z.coerce.number().int().min(1).max(9).optional(),
  sectionName: z.string().optional(),
})

export const pdfRoute = new Hono()

pdfRoute.post("/generate", async (c) => {
  const envErr = assertPdfEnv()
  if (envErr) return c.json({ error: envErr }, 500)

  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await c.req.json())
  } catch {
    return c.json({ error: "Body inválido: { templateCode, actionId }" }, 400)
  }
  const { templateCode, actionId } = parsed

  const render = TEMPLATES[templateCode]
  if (!render) {
    return c.json({ error: `Template '${templateCode}' desconhecido` }, 400)
  }

  try {
    const supabase = getSupabaseAdmin()

    // 1. Dados da acção (service role -> bypassa RLS no servidor).
    const { data: action, error: aErr } = await supabase
      .from("training_actions")
      .select(
        "id,tenantId,actionCode,startDate,endDate,localFormacao," +
          "tipologiaHorario,format,courseId,clientOrgId," +
          "courses(name,durationHours)," +
          "client_orgs(name,logoUrl)," +
          "training_action_trainers(trainers(users(firstName,lastName)))"
      )
      .eq("id", actionId)
      .maybeSingle()
    if (aErr) return c.json({ error: "Erro a ler acção: " + aErr.message }, 500)
    if (!action) return c.json({ error: "Acção não encontrada" }, 404)

    // O cliente supabase-js sem generic devolve uma união que inclui o
    // tipo de erro; normalizamos via unknown para a forma esperada.
    const a = action as unknown as {
      tenantId: string
      actionCode: string | null
      startDate: string | null
      endDate: string | null
      localFormacao: string | null
      tipologiaHorario: string | null
      format: string | null
      courses?: { name?: string; durationHours?: number | null } | null
      client_orgs?: { name?: string; logoUrl?: string | null } | null
      training_action_trainers?: {
        trainers?: {
          users?: { firstName?: string | null; lastName?: string | null } | null
        } | null
      }[]
    }

    // 2. Tenant (logos).
    const { data: tenantRow } = await supabase
      .from("tenants")
      .select("name,logoUrl,dgertLogoUrl")
      .eq("id", a.tenantId)
      .maybeSingle()
    const tenant = tenantRow as unknown as {
      name?: string
      logoUrl?: string | null
      dgertLogoUrl?: string | null
    } | null
    const trainers = (a.training_action_trainers ?? [])
      .map((t) => {
        const u = t.trainers?.users
        return u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : ""
      })
      .filter(Boolean)

    const generatedAt = new Date().toISOString()
    let data: TemplateData

    if (templateCode === "registoSumarios") {
      // 1 PDF por acção: agrega TODAS as sessões ordenadas.
      const { data: sess, error: sErr } = await supabase
        .from("training_sessions")
        .select(
          "sessionDate,startTime,endTime,summary,trainerSignatureUrl," +
            "course_modules(name),trainers(users(firstName,lastName))"
        )
        .eq("trainingActionId", actionId)
        .order("sessionDate", { ascending: true })
        .order("startTime", { ascending: true })
      if (sErr)
        return c.json({ error: "Erro a ler sessões: " + sErr.message }, 500)
      const sessions = (
        (sess ?? []) as unknown as {
          sessionDate: string | null
          startTime: string | null
          endTime: string | null
          summary: string | null
          trainerSignatureUrl: string | null
          course_modules?: { name?: string } | null
          trainers?: {
            users?: {
              firstName?: string | null
              lastName?: string | null
            } | null
          } | null
        }[]
      ).map((s) => {
        const u = s.trainers?.users
        return {
          sessionDate: s.sessionDate,
          startTime: s.startTime,
          endTime: s.endTime,
          summary: s.summary,
          trainerSignatureUrl: s.trainerSignatureUrl,
          moduleName: s.course_modules?.name ?? null,
          trainerName: u
            ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || null
            : null,
        }
      })

      const rs: RegistoSumariosTemplateData = {
        courseName: a.courses?.name ?? null,
        durationHours: a.courses?.durationHours ?? null,
        actionCode: a.actionCode ?? null,
        startDate: a.startDate ?? null,
        endDate: a.endDate ?? null,
        tipologiaHorario: a.tipologiaHorario ?? null,
        format: a.format ?? null,
        clientName: a.client_orgs?.name ?? null,
        clientLogoUrl: a.client_orgs?.logoUrl ?? null,
        tenantName: tenant?.name ?? "Entidade Formadora",
        tenantLogoUrl: tenant?.logoUrl ?? null,
        sessions,
        generatedAt,
      }
      data = rs
    } else if (templateCode === "separadora") {
      // Separadora de secção (Template 6). sectionNumber/sectionName vêm
      // do body; contexto (curso/acção/tenant) da acção já carregada.
      const sectionNumber = parsed.sectionNumber
      const sectionName = parsed.sectionName
      if (!sectionNumber || !sectionName) {
        return c.json(
          {
            error:
              "separadora requer sectionNumber (1-9) e sectionName no body",
          },
          400
        )
      }
      const sep: SeparadoraTemplateData = {
        sectionNumber,
        sectionName,
        courseName: a.courses?.name ?? null,
        actionCode: a.actionCode ?? null,
        tenantName: tenant?.name ?? "Entidade Formadora",
        tenantLogoUrl: tenant?.logoUrl ?? null,
        generatedAt,
      }
      data = sep
    } else {
      data = {
        courseName: a.courses?.name ?? "—",
        durationHours: a.courses?.durationHours ?? null,
        actionCode: (a.actionCode as string | null) ?? null,
        startDate: (a.startDate as string | null) ?? null,
        endDate: (a.endDate as string | null) ?? null,
        localFormacao: (a.localFormacao as string | null) ?? null,
        tipologiaHorario: (a.tipologiaHorario as string | null) ?? null,
        trainers,
        clientName: a.client_orgs?.name ?? null,
        clientLogoUrl: a.client_orgs?.logoUrl ?? null,
        tenantName: tenant?.name ?? "Entidade Formadora",
        tenantLogoUrl: tenant?.logoUrl ?? null,
        dgertLogoUrl: tenant?.dgertLogoUrl ?? null,
        generatedAt,
      }
    }

    // 3. Render + PDF (Chromium local).
    const { html, footerHtml } = render(data)
    const pdf = await withPage(async (page) => {
      await page.setContent(html, { waitUntil: "networkidle0" })
      return page.pdf({
        format: "A4",
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: "<span></span>",
        footerTemplate: footerHtml,
        margin: { top: "2cm", bottom: "2cm", left: "2cm", right: "2cm" },
      })
    })

    // 4. Upload + URL assinado.
    const { url, path } = await uploadPdfAndSign({
      tenantId: a.tenantId,
      actionId,
      templateCode,
      bytes: new Uint8Array(pdf),
    })
    return c.json({ url, path })
  } catch (e) {
    return c.json(
      { error: e instanceof Error ? e.message : "Erro inesperado" },
      500
    )
  }
})

// Geração em massa: 1 PDF por formando inscrito na acção (Ficha de
// Identificação). Reaproveita 1 browser/1 página para N formandos (rápido).
pdfRoute.post("/generate-mass", async (c) => {
  const envErr = assertPdfEnv()
  if (envErr) return c.json({ error: envErr }, 500)

  let parsed: z.infer<typeof bodySchema>
  try {
    parsed = bodySchema.parse(await c.req.json())
  } catch {
    return c.json({ error: "Body inválido: { templateCode, actionId }" }, 400)
  }
  const { templateCode, actionId } = parsed

  const render = TEMPLATES[templateCode]
  if (!render) {
    return c.json({ error: `Template '${templateCode}' desconhecido` }, 400)
  }

  try {
    const supabase = getSupabaseAdmin()

    // 1. Acção + curso + cliente (contexto do cabeçalho).
    const { data: action, error: aErr } = await supabase
      .from("training_actions")
      .select(
        "id,tenantId,actionCode,courseId,clientOrgId," +
          "courses(name),client_orgs(name,logoUrl)"
      )
      .eq("id", actionId)
      .maybeSingle()
    if (aErr) return c.json({ error: "Erro a ler acção: " + aErr.message }, 500)
    if (!action) return c.json({ error: "Acção não encontrada" }, 404)
    const a = action as unknown as {
      tenantId: string
      actionCode: string | null
      courses?: { name?: string } | null
      client_orgs?: { name?: string; logoUrl?: string | null } | null
    }

    // 2. Tenant (nome + logo da entidade formadora).
    const { data: tenantRow } = await supabase
      .from("tenants")
      .select("name,logoUrl")
      .eq("id", a.tenantId)
      .maybeSingle()
    const tenant = tenantRow as unknown as {
      name?: string
      logoUrl?: string | null
    } | null

    // Contexto partilhado pelo cabeçalho de qualquer template.
    const generatedAt = new Date().toISOString()
    const actionCtx = {
      courseName: a.courses?.name ?? null,
      actionCode: a.actionCode ?? null,
      clientName: a.client_orgs?.name ?? null,
      clientLogoUrl: a.client_orgs?.logoUrl ?? null,
      tenantName: tenant?.name ?? "Entidade Formadora",
      tenantLogoUrl: tenant?.logoUrl ?? null,
    }
    const PDF_OPTS = {
      format: "A4" as const,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      margin: { top: "2cm", bottom: "2cm", left: "2cm", right: "2cm" },
    }

    type MassItem =
      | {
          kind: "ficha"
          traineeId: string
          traineeName: string
          url?: string
          error?: string
        }
      | {
          kind: "folha" | "plano"
          sessionId: string
          sessionDate: string | null
          startTime: string | null
          moduleLabel: string
          url?: string
          error?: string
        }
    const pdfs: MassItem[] = []

    if (templateCode === "fichaIdentificacao") {
      // 1 PDF por formando inscrito.
      const { data: enr, error: eErr } = await supabase
        .from("enrollments")
        .select("traineeId,trainees(id,firstName,lastName)")
        .eq("trainingActionId", actionId)
      if (eErr)
        return c.json({ error: "Erro a ler inscrições: " + eErr.message }, 500)
      const enrollments = (enr ?? []) as unknown as {
        traineeId: string
        trainees?: {
          firstName?: string | null
          lastName?: string | null
        } | null
      }[]
      if (enrollments.length === 0) {
        return c.json({ error: "A acção não tem formandos inscritos" }, 400)
      }

      await withPage(async (page) => {
        for (const row of enrollments) {
          const t = row.trainees
          const traineeName =
            `${t?.firstName ?? ""} ${t?.lastName ?? ""}`.trim() || "Formando"
          try {
            const data: FichaIdentificacaoTemplateData = {
              traineeName,
              ...actionCtx,
              generatedAt,
            }
            const { html, footerHtml } = render(data as TemplateData)
            await page.setContent(html, { waitUntil: "networkidle0" })
            const pdf = await page.pdf({
              ...PDF_OPTS,
              footerTemplate: footerHtml,
            })
            const { url } = await uploadPdfAndSign({
              tenantId: a.tenantId,
              actionId,
              templateCode,
              fileBase: `${templateCode}_${row.traineeId}`,
              bytes: new Uint8Array(pdf),
            })
            pdfs.push({
              kind: "ficha",
              traineeId: row.traineeId,
              traineeName,
              url,
            })
          } catch (err) {
            pdfs.push({
              kind: "ficha",
              traineeId: row.traineeId,
              traineeName,
              error: err instanceof Error ? err.message : "Erro ao gerar",
            })
          }
        }
      })
    } else if (templateCode === "folhaPresenca") {
      // 1 PDF por SESSÃO, com todos os formandos (status != CANCELLED).
      const { data: sess, error: sErr } = await supabase
        .from("training_sessions")
        .select(
          "id,sessionDate,startTime,endTime,sessionType," +
            "course_modules(name),trainers(users(firstName,lastName))"
        )
        .eq("trainingActionId", actionId)
        .order("sessionDate")
        .order("startTime")
      if (sErr)
        return c.json({ error: "Erro a ler sessões: " + sErr.message }, 500)
      const sessions = (sess ?? []) as unknown as {
        id: string
        sessionDate: string | null
        startTime: string | null
        endTime: string | null
        sessionType: string | null
        course_modules?: { name?: string } | null
        trainers?: {
          users?: { firstName?: string | null; lastName?: string | null } | null
        } | null
      }[]
      if (sessions.length === 0) {
        return c.json({ error: "A acção não tem sessões" }, 400)
      }

      const { data: enr, error: eErr } = await supabase
        .from("enrollments")
        .select("status,trainees(id,firstName,lastName)")
        .eq("trainingActionId", actionId)
      if (eErr)
        return c.json({ error: "Erro a ler inscrições: " + eErr.message }, 500)
      const trainees = (
        (enr ?? []) as unknown as {
          status: string | null
          trainees?: {
            id?: string
            firstName?: string | null
            lastName?: string | null
          } | null
        }[]
      )
        .filter((e) => e.status !== "CANCELLED")
        .map((e) => ({
          id: e.trainees?.id ?? "",
          name:
            `${e.trainees?.firstName ?? ""} ${e.trainees?.lastName ?? ""}`.trim() ||
            "Formando",
        }))

      const TYPE_LABEL: Record<string, string> = {
        TEORICA: "Teórica",
        PRATICA: "Prática",
        MISTA: "Mista",
      }

      await withPage(async (page) => {
        for (const s of sessions) {
          const u = s.trainers?.users
          const trainerName = u
            ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || null
            : null
          const moduleName = s.course_modules?.name ?? null
          const typeLabel = s.sessionType
            ? (TYPE_LABEL[s.sessionType] ?? s.sessionType)
            : null
          const moduleLabel = `${moduleName ?? "Sessão"}${
            typeLabel ? ` (${typeLabel})` : ""
          }`
          try {
            const data: FolhaPresencasTemplateData = {
              ...actionCtx,
              sessionDate: s.sessionDate,
              startTime: s.startTime,
              endTime: s.endTime,
              sessionType: s.sessionType,
              moduleName,
              trainerName,
              trainees,
              generatedAt,
            }
            const { html, footerHtml } = render(data as TemplateData)
            await page.setContent(html, { waitUntil: "networkidle0" })
            const pdf = await page.pdf({
              ...PDF_OPTS,
              footerTemplate: footerHtml,
            })
            const { url } = await uploadPdfAndSign({
              tenantId: a.tenantId,
              actionId,
              templateCode,
              fileBase: `${templateCode}_${s.id}`,
              bytes: new Uint8Array(pdf),
            })
            pdfs.push({
              kind: "folha",
              sessionId: s.id,
              sessionDate: s.sessionDate,
              startTime: s.startTime,
              moduleLabel,
              url,
            })
          } catch (err) {
            pdfs.push({
              kind: "folha",
              sessionId: s.id,
              sessionDate: s.sessionDate,
              startTime: s.startTime,
              moduleLabel,
              error: err instanceof Error ? err.message : "Erro ao gerar",
            })
          }
        }
      })
    } else if (templateCode === "planoSessao") {
      // 1 PDF por SESSÃO: plano pedagógico (6 secções).
      const { data: sess, error: sErr } = await supabase
        .from("training_sessions")
        .select(
          "id,sessionDate,startTime,endTime,sessionType,didacticResources," +
            "planObjetivos,planIntroducao,planDesenvolvimento," +
            "planConclusao,planAvaliacao," +
            "course_modules(name),trainers(users(firstName,lastName))"
        )
        .eq("trainingActionId", actionId)
        .order("sessionDate")
        .order("startTime")
      if (sErr)
        return c.json({ error: "Erro a ler sessões: " + sErr.message }, 500)
      const sessions = (sess ?? []) as unknown as {
        id: string
        sessionDate: string | null
        startTime: string | null
        endTime: string | null
        sessionType: string | null
        didacticResources: string[] | null
        planObjetivos: string | null
        planIntroducao: string | null
        planDesenvolvimento: string | null
        planConclusao: string | null
        planAvaliacao: string | null
        course_modules?: { name?: string } | null
        trainers?: {
          users?: { firstName?: string | null; lastName?: string | null } | null
        } | null
      }[]
      if (sessions.length === 0) {
        return c.json({ error: "A acção não tem sessões" }, 400)
      }

      const TYPE_LABEL: Record<string, string> = {
        TEORICA: "Teórica",
        PRATICA: "Prática",
        MISTA: "Mista",
      }

      await withPage(async (page) => {
        for (const s of sessions) {
          const u = s.trainers?.users
          const trainerName = u
            ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || null
            : null
          const moduleName = s.course_modules?.name ?? null
          const typeLabel = s.sessionType
            ? (TYPE_LABEL[s.sessionType] ?? s.sessionType)
            : null
          const moduleLabel = `${moduleName ?? "Sessão"}${
            typeLabel ? ` (${typeLabel})` : ""
          }`
          try {
            const data: PlanoSessaoTemplateData = {
              ...actionCtx,
              sessionDate: s.sessionDate,
              startTime: s.startTime,
              endTime: s.endTime,
              sessionType: s.sessionType,
              moduleName,
              trainerName,
              objetivos: s.planObjetivos,
              introducao: s.planIntroducao,
              desenvolvimento: s.planDesenvolvimento,
              conclusao: s.planConclusao,
              avaliacao: s.planAvaliacao,
              recursos: s.didacticResources,
              generatedAt,
            }
            const { html, footerHtml } = render(data as TemplateData)
            await page.setContent(html, { waitUntil: "networkidle0" })
            const pdf = await page.pdf({
              ...PDF_OPTS,
              footerTemplate: footerHtml,
            })
            const { url } = await uploadPdfAndSign({
              tenantId: a.tenantId,
              actionId,
              templateCode,
              fileBase: `${templateCode}_${s.id}`,
              bytes: new Uint8Array(pdf),
            })
            pdfs.push({
              kind: "plano",
              sessionId: s.id,
              sessionDate: s.sessionDate,
              startTime: s.startTime,
              moduleLabel,
              url,
            })
          } catch (err) {
            pdfs.push({
              kind: "plano",
              sessionId: s.id,
              sessionDate: s.sessionDate,
              startTime: s.startTime,
              moduleLabel,
              error: err instanceof Error ? err.message : "Erro ao gerar",
            })
          }
        }
      })
    } else {
      return c.json(
        { error: `Template '${templateCode}' não suporta geração em massa` },
        400
      )
    }

    return c.json({
      action: {
        id: actionId,
        code: a.actionCode ?? null,
        name: a.courses?.name ?? null,
      },
      total: pdfs.length,
      pdfs,
    })
  } catch (e) {
    return c.json(
      { error: e instanceof Error ? e.message : "Erro inesperado" },
      500
    )
  }
})

// Dossier Completo: monta 1 ZIP com Checklist + 9 separadoras + planos +
// fichas + registo de sumários + folhas. Cache de 24h por acção.
const dossierBodySchema = z.object({ actionId: z.string().min(1) })

pdfRoute.post("/generate-dossier", async (c) => {
  const envErr = assertPdfEnv()
  if (envErr) return c.json({ error: envErr }, 500)

  let actionId: string
  try {
    actionId = dossierBodySchema.parse(await c.req.json()).actionId
  } catch {
    return c.json({ error: "Body inválido: { actionId }" }, 400)
  }

  try {
    const result = await buildDossierZip(actionId)
    return c.json(result)
  } catch (e) {
    return c.json(
      { error: e instanceof Error ? e.message : "Erro ao montar dossier" },
      500
    )
  }
})
