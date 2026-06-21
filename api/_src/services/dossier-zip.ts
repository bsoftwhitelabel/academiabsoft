import { createRequire } from "node:module"
import pLimit from "p-limit"
import { getSupabaseAdmin } from "./supabase.js"
import { withBrowser, renderPdfBuffer } from "./puppeteer.js"
import {
  uploadBufferToStorage,
  listOldZips,
  signExisting,
  deleteFile,
} from "./storage.js"
import { slugify } from "./slug.js"
import { TEMPLATES, type TemplateData } from "../templates/registry.js"
import { SECCOES_DTP } from "../templates/separadora.js"

// archiver é CJS; createRequire evita o problema de interop de default
// export sob o loader ESM do Node (tsx).
interface ArchiverLike {
  on(event: "data", cb: (chunk: Buffer) => void): void
  on(event: "warning", cb: (err: { code?: string }) => void): void
  on(event: "error", cb: (err: unknown) => void): void
  on(event: "end", cb: () => void): void
  append(source: Buffer, opts: { name: string }): void
  finalize(): Promise<void>
}
const nodeRequire = createRequire(import.meta.url)
const archiver = nodeRequire("archiver") as (
  format: string,
  options?: { zlib?: { level?: number } }
) => ArchiverLike

const CACHE_MS = 24 * 60 * 60 * 1000
const CONCURRENCY = 3

export interface DossierStats {
  totalFiles: number
  sizeBytes: number
  generatedAt: string
  fromCache: boolean
  sections: { number: number; name: string; fileCount: number }[]
  errors: { itemPath: string; error: string }[]
}

interface PlanItem {
  path: string
  template: string
  data: TemplateData
  section: number | null // 0 = raiz (checklist); 1-9 = secção
}

function fdate(iso: string | null): string {
  if (!iso) return "sem-data"
  const d = new Date(iso)
  return isNaN(d.getTime()) ? "sem-data" : d.toISOString().slice(0, 10)
}
function ftime(t: string | null): string {
  return t ? t.replace(":", "h") : "sh"
}
function trainerNameOf(
  tr: { users?: { firstName?: string | null; lastName?: string | null } | null } | null | undefined
): string | null {
  const u = tr?.users
  if (!u) return null
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || null
}

export async function buildDossierZip(actionId: string): Promise<{
  url: string
  path: string
  stats: DossierStats
}> {
  const supabase = getSupabaseAdmin()
  const generatedAt = new Date().toISOString()

  // a) Acção + curso + cliente + formadores
  const { data: action, error: aErr } = await supabase
    .from("training_actions")
    .select(
      "id,tenantId,actionCode,startDate,endDate,localFormacao," +
        "tipologiaHorario,format,courseId,clientOrgId," +
        "courses(name,durationHours),client_orgs(name,logoUrl)," +
        "training_action_trainers(trainers(users(firstName,lastName)))"
    )
    .eq("id", actionId)
    .maybeSingle()
  if (aErr) throw new Error("Erro a ler acção: " + aErr.message)
  if (!action) throw new Error("Acção não encontrada")
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

  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("name,logoUrl")
    .eq("id", a.tenantId)
    .maybeSingle()
  const tenant = tenantRow as unknown as {
    name?: string
    logoUrl?: string | null
  } | null

  // b) Sessões ordenadas
  const { data: sess, error: sErr } = await supabase
    .from("training_sessions")
    .select(
      "id,sessionDate,startTime,endTime,sessionType,summary," +
        "trainerSignatureUrl,didacticResources,planObjetivos," +
        "planIntroducao,planDesenvolvimento,planConclusao,planAvaliacao," +
        "course_modules(name),trainers(users(firstName,lastName))"
    )
    .eq("trainingActionId", actionId)
    .order("sessionDate")
    .order("startTime")
  if (sErr) throw new Error("Erro a ler sessões: " + sErr.message)
  const sessions = (sess ?? []) as unknown as {
    id: string
    sessionDate: string | null
    startTime: string | null
    endTime: string | null
    sessionType: string | null
    summary: string | null
    trainerSignatureUrl: string | null
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

  // c) Inscritos não-cancelados
  const { data: enr, error: eErr } = await supabase
    .from("enrollments")
    .select("status,trainees(id,firstName,lastName)")
    .eq("trainingActionId", actionId)
  if (eErr) throw new Error("Erro a ler inscrições: " + eErr.message)
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

  // Contexto comum do cabeçalho
  const ctx = {
    courseName: a.courses?.name ?? null,
    actionCode: a.actionCode ?? null,
    clientName: a.client_orgs?.name ?? null,
    clientLogoUrl: a.client_orgs?.logoUrl ?? null,
    tenantName: tenant?.name ?? "Entidade Formadora",
    tenantLogoUrl: tenant?.logoUrl ?? null,
  }
  const trainerNames = (a.training_action_trainers ?? [])
    .map((t) => trainerNameOf(t.trainers))
    .filter((n): n is string => !!n)

  // Pastas das 9 secções: "01_Descricao_da_Accao", ...
  const folders = SECCOES_DTP.map(
    (name, i) => `${String(i + 1).padStart(2, "0")}_${slugify(name)}`
  )

  // ---- Plano de items (ordem determinística) ----
  const items: PlanItem[] = []

  items.push({
    path: "00_Checklist.pdf",
    template: "checklist",
    section: 0,
    data: {
      ...ctx,
      courseName: a.courses?.name ?? "—",
      durationHours: a.courses?.durationHours ?? null,
      startDate: a.startDate ?? null,
      endDate: a.endDate ?? null,
      localFormacao: a.localFormacao ?? null,
      tipologiaHorario: a.tipologiaHorario ?? null,
      trainers: trainerNames,
      dgertLogoUrl: null,
      generatedAt,
    } as TemplateData,
  })

  // Separadoras (1 por secção)
  SECCOES_DTP.forEach((name, i) => {
    items.push({
      path: `${folders[i]}/separadora.pdf`,
      template: "separadora",
      section: i + 1,
      data: {
        sectionNumber: i + 1,
        sectionName: name,
        courseName: ctx.courseName,
        actionCode: ctx.actionCode,
        tenantName: ctx.tenantName,
        tenantLogoUrl: ctx.tenantLogoUrl,
        generatedAt,
      } as TemplateData,
    })
  })

  // Planos de sessão -> secção 1
  sessions.forEach((s, idx) => {
    const moduleName = s.course_modules?.name ?? null
    const slug = slugify(moduleName ?? "Sessao")
    items.push({
      path: `${folders[0]}/Planos_de_Sessao/planoSessao_${String(
        idx + 1
      ).padStart(2, "0")}_${slug}_${fdate(s.sessionDate)}.pdf`,
      template: "planoSessao",
      section: 1,
      data: {
        ...ctx,
        sessionDate: s.sessionDate,
        startTime: s.startTime,
        endTime: s.endTime,
        sessionType: s.sessionType,
        moduleName,
        trainerName: trainerNameOf(s.trainers),
        objetivos: s.planObjetivos,
        introducao: s.planIntroducao,
        desenvolvimento: s.planDesenvolvimento,
        conclusao: s.planConclusao,
        avaliacao: s.planAvaliacao,
        recursos: s.didacticResources,
        generatedAt,
      } as TemplateData,
    })
  })

  // Fichas de identificação -> secção 5
  trainees.forEach((t, idx) => {
    items.push({
      path: `${folders[4]}/Fichas_de_Identificacao/ficha_${String(
        idx + 1
      ).padStart(2, "0")}_${slugify(t.name)}.pdf`,
      template: "fichaIdentificacao",
      section: 5,
      data: {
        ...ctx,
        traineeName: t.name,
        generatedAt,
      } as TemplateData,
    })
  })

  // Registo de sumários (1 único) -> secção 6
  items.push({
    path: `${folders[5]}/Registo_de_Sumarios.pdf`,
    template: "registoSumarios",
    section: 6,
    data: {
      ...ctx,
      durationHours: a.courses?.durationHours ?? null,
      startDate: a.startDate ?? null,
      endDate: a.endDate ?? null,
      tipologiaHorario: a.tipologiaHorario ?? null,
      format: a.format ?? null,
      sessions: sessions.map((s) => ({
        sessionDate: s.sessionDate,
        startTime: s.startTime,
        endTime: s.endTime,
        summary: s.summary,
        trainerSignatureUrl: s.trainerSignatureUrl,
        moduleName: s.course_modules?.name ?? null,
        trainerName: trainerNameOf(s.trainers),
      })),
      generatedAt,
    } as TemplateData,
  })

  // Folhas de presença -> secção 6
  sessions.forEach((s, idx) => {
    items.push({
      path: `${folders[5]}/Folhas_de_Presenca/folha_${String(
        idx + 1
      ).padStart(2, "0")}_${fdate(s.sessionDate)}_${ftime(
        s.startTime
      )}.pdf`,
      template: "folhaPresenca",
      section: 6,
      data: {
        ...ctx,
        sessionDate: s.sessionDate,
        startTime: s.startTime,
        endTime: s.endTime,
        sessionType: s.sessionType,
        moduleName: s.course_modules?.name ?? null,
        trainerName: trainerNameOf(s.trainers),
        trainees,
        generatedAt,
      } as TemplateData,
    })
  })

  // sections stats (derivado do plano — determinístico, serve cache e fresh)
  const sections = SECCOES_DTP.map((name, i) => ({
    number: i + 1,
    name,
    fileCount: items.filter((it) => it.section === i + 1).length,
  }))

  // d) Cache: ZIP < 24h desta acção?
  const olds = await listOldZips(a.tenantId, actionId)
  const fresh = olds
    .filter((z) => Date.now() - new Date(z.createdAt).getTime() < CACHE_MS)
    .sort((x, y) => y.createdAt.localeCompare(x.createdAt))[0]
  if (fresh) {
    const url = await signExisting(fresh.path)
    return {
      url,
      path: fresh.path,
      stats: {
        totalFiles: items.length,
        sizeBytes: 0, // não descarregado; ZIP em cache
        generatedAt: fresh.createdAt,
        fromCache: true,
        sections,
        errors: [],
      },
    }
  }

  // e-g) Gera os PDFs (concorrência limitada) e monta o ZIP em memória
  const errors: { itemPath: string; error: string }[] = []
  const buffers = new Array<Buffer | null>(items.length).fill(null)

  await withBrowser(async (browser) => {
    const limit = pLimit(CONCURRENCY)
    await Promise.all(
      items.map((it, i) =>
        limit(async () => {
          try {
            const render = TEMPLATES[it.template]
            if (!render) throw new Error(`template '${it.template}' inexistente`)
            const { html, footerHtml } = render(it.data)
            buffers[i] = await renderPdfBuffer(browser, html, footerHtml)
          } catch (e) {
            errors.push({
              itemPath: it.path,
              error: e instanceof Error ? e.message : "Erro ao gerar",
            })
          }
        })
      )
    )
  })

  const archive = archiver("zip", { zlib: { level: 6 } })
  const chunks: Buffer[] = []
  archive.on("data", (c: Buffer) => chunks.push(c))
  // warnings do archiver são não-fatais (ex.: ENOENT); ignoramos —
  // só fazemos append de buffers em memória, sem ler do disco.
  archive.on("warning", () => {})
  const closed = new Promise<void>((resolve, reject) => {
    archive.on("end", resolve)
    archive.on("error", reject)
  })

  let appended = 0
  items.forEach((it, i) => {
    const buf = buffers[i]
    if (buf) {
      archive.append(buf, { name: it.path })
      appended++
    }
  })
  if (errors.length > 0) {
    const txt =
      "Itens que falharam na geração do Dossier:\n\n" +
      errors.map((e) => `- ${e.itemPath}: ${e.error}`).join("\n") +
      "\n"
    archive.append(Buffer.from(txt, "utf-8"), { name: "_erros.txt" })
    appended++
  }
  await archive.finalize()
  await closed
  const zipBuf = Buffer.concat(chunks)

  // h-i) Upload + signed URL
  const zipPath = `${a.tenantId}/${actionId}/dossier_completo_${Date.now()}.zip`
  const { url, path } = await uploadBufferToStorage(
    zipBuf,
    zipPath,
    "application/zip"
  )

  // j) Limpa ZIPs antigos desta acção (mantém só o novo)
  try {
    const toDelete = (await listOldZips(a.tenantId, actionId)).filter(
      (z) => z.path !== path
    )
    for (const z of toDelete) await deleteFile(z.path)
  } catch {
    // limpeza é best-effort; não falha o pedido
  }

  return {
    url,
    path,
    stats: {
      totalFiles: appended,
      sizeBytes: zipBuf.length,
      generatedAt,
      fromCache: false,
      sections,
      errors,
    },
  }
}
