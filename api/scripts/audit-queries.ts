/**
 * Script de auditoria read-only. Executa todas as queries de schema e counts
 * pedidos pelo prompt PROMPT — AUDITORIA TÉCNICA COMPLETA. Apenas SELECT.
 * Saída: JSON único em api/scripts/_audit-output.json
 */
import { config as loadEnv } from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { writeFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

const here = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(here, "..", ".env") })
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

const out: Record<string, unknown> = {}

async function runRpc(name: string, sql: string) {
  // Supabase JS não tem .raw(). Tentamos rpc("exec_sql") se existir, senão erro.
  const { data, error } = await sb.rpc("exec_sql", { sql_text: sql })
  if (error) return { error: error.message, sql }
  return { rows: data, sql, name }
}

// Como exec_sql provavelmente não existe, vamos abordar via PostgREST de outra
// forma: usar as views internas pg_tables, information_schema, etc., não são
// expostas no PostgREST por defeito. Logo o caminho mais portátil é fazer
// SELECT directo às tabelas que existem (counts, samples, etc.).
//
// Para queries de schema (7.1-7.9) vamos tentar abordagem alternativa:
// listar via try/catch as tabelas conhecidas. Se PostgREST não tiver
// permissão para information_schema, marcamos como "NAO APURADO".

// Tabelas conhecidas a partir do schema.prisma (vamos confirmar existência
// fazendo HEAD count em cada uma)
const KNOWN_TABLES = [
  "tenants", "users", "magic_links", "client_orgs",
  "trainers", "trainees",
  "training_areas", "courses", "course_modules",
  "training_plans", "training_actions", "training_action_trainers",
  "training_sessions", "enrollments", "check_ins",
  "document_signatures", "training_documents", "occurrences",
  "certificates", "rooms",
  "inquiries", "waitlist",
  "notification_templates", "notification_logs",
  "questionnaires", "questionnaire_questions",
  "questionnaire_responses", "questionnaire_answers",
  "tenant_financing_systems", "audit_logs",
  "evaluation_campaigns", "approval_requests",  // Possíveis, vamos testar
]

const TENANT_ID = "cmok6xvlq0000pc43lyagc2pb"

const stats = []
for (const table of KNOWN_TABLES) {
  try {
    const { count, error } = await sb
      .from(table)
      .select("*", { count: "exact", head: true })
    if (error) {
      stats.push({ table, exists: false, error: error.message })
    } else {
      stats.push({ table, exists: true, count: count ?? 0 })
    }
  } catch (e) {
    stats.push({ table, exists: false, error: String(e) })
  }
}
out.tableCounts = stats

// Tentar listar tabelas via information_schema (PostgREST geralmente bloqueia)
try {
  const { data, error } = await sb.from("information_schema.tables").select("*").limit(1)
  out.informationSchemaAccess = error ? { ok: false, error: error.message } : { ok: true, sample: data }
} catch (e) {
  out.informationSchemaAccess = { ok: false, error: String(e) }
}

// Tentar via RPC (assume função "exec_sql" registrada — geralmente não está)
const sqlQueries = {
  q71_tables: "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name",
  q72_columns: "SELECT table_name, column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position",
  q73_fks: "SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public'",
  q74_indexes: "SELECT schemaname, tablename, indexname, indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename",
  q75_enums: "SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid ORDER BY t.typname, e.enumsortorder",
  q76_rls: "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public'",
  q77_policies: "SELECT schemaname, tablename, policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname='public' ORDER BY tablename",
  q78_triggers: "SELECT trigger_name, event_manipulation, event_object_table, action_statement FROM information_schema.triggers WHERE trigger_schema='public'",
  q79_functions: "SELECT routine_name, routine_type, data_type FROM information_schema.routines WHERE specific_schema='public' AND routine_type IN ('FUNCTION', 'PROCEDURE')",
}

const sqlResults: Record<string, unknown> = {}
for (const [key, sql] of Object.entries(sqlQueries)) {
  try {
    const r = await sb.rpc("exec_sql", { sql_text: sql })
    if (r.error) sqlResults[key] = { ok: false, error: r.error.message }
    else sqlResults[key] = { ok: true, data: r.data }
  } catch (e) {
    sqlResults[key] = { ok: false, error: String(e) }
  }
}
out.sqlQueries = sqlResults

// Samples (mascara emails/telefones/ids parciais)
function mask(v: string | null | undefined): string | null {
  if (!v) return v ?? null
  if (typeof v !== "string") return v
  if (v.length <= 4) return "***"
  return v.slice(0, 3) + "***" + v.slice(-2)
}

async function sampleTable(table: string, cols: string, maskFields: string[] = []) {
  const { data, error } = await sb.from(table).select(cols).limit(3)
  if (error) return { table, error: error.message }
  const rows = (data ?? []).map((r: Record<string, unknown>) => {
    const c = { ...r }
    for (const f of maskFields) {
      if (typeof c[f] === "string") c[f] = mask(c[f] as string)
    }
    return c
  })
  return { table, rows }
}

const samples: unknown[] = []
samples.push(await sampleTable("tenants", "id, name, slug, isActive, primaryColor"))
samples.push(await sampleTable("users", "id, email, role, tenantId, firstName, lastName, isActive", ["email"]))
samples.push(await sampleTable("trainees", "id, firstName, lastName, email, nif, clientOrgId, tenantId", ["email", "nif"]))
samples.push(await sampleTable("trainers", "id, userId, tenantId, ccpNumber, isExternal"))
samples.push(await sampleTable("training_actions", "id, actionCode, courseId, clientOrgId, status, startDate, endDate, tenantId"))
samples.push(await sampleTable("training_sessions", "id, trainingActionId, sessionDate, startTime, endTime, durationHours"))
samples.push(await sampleTable("enrollments", "id, trainingActionId, traineeId, status, enrolledAt"))
samples.push(await sampleTable("courses", "id, name, slug, status, format, durationHours, tenantId"))
samples.push(await sampleTable("course_modules", "id, courseId, name, order, durationHours"))
samples.push(await sampleTable("training_plans", "id, name, year, status, tenantId"))
samples.push(await sampleTable("client_orgs", "id, name, tenantId, isActive, nif"))
samples.push(await sampleTable("contracts", "id, clientOrgId, startDate, endDate, value"))
samples.push(await sampleTable("questionnaires", "id, tenantId, name, format, targetRole, context"))
samples.push(await sampleTable("questionnaire_questions", "id, questionnaireId, type, scaleMin, scaleMax, order, isRequired"))
samples.push(await sampleTable("questionnaire_responses", "id, questionnaireId, trainingActionId, traineeId, trainerId, respondedAt, expiresAt, respondentIp", ["respondentIp"]))
samples.push(await sampleTable("questionnaire_answers", "id, responseId, questionId, scaleValue, textValue"))
samples.push(await sampleTable("check_ins", "id, sessionId, traineeId, status, checkedInAt, isManual"))
out.samples = samples

// Distribuições / agregados úteis (via PostgREST limitado: usamos selects largos + agg client-side)
async function distrib(table: string, field: string, limit = 5000): Promise<Record<string, number>> {
  const { data, error } = await sb.from(table).select(field).limit(limit)
  if (error) return { __error: -1, __msg: 0 } as unknown as Record<string, number>
  const buckets: Record<string, number> = {}
  for (const r of (data ?? []) as Record<string, unknown>[]) {
    const v = String(r[field] ?? "(null)")
    buckets[v] = (buckets[v] ?? 0) + 1
  }
  return buckets
}

out.distributions = {
  users_role: await distrib("users", "role"),
  training_actions_status: await distrib("training_actions", "status"),
  enrollments_status: await distrib("enrollments", "status"),
  trainees_country: await distrib("trainees", "country"),
  trainees_isActive: await distrib("trainees", "isActive"),
  courses_status: await distrib("courses", "status"),
  courses_format: await distrib("courses", "format"),
  trainees_clientOrgIdNullCount: await (async () => {
    const { count } = await sb.from("trainees").select("*", { count: "exact", head: true }).is("clientOrgId", null)
    return count
  })(),
}

// Tenants completos (devem ser poucos)
const { data: tenantsAll } = await sb.from("tenants").select("id, name, slug, isActive, primaryColor, dgertCode, platformName")
out.tenantsAll = tenantsAll

// Dashboard counter para Secção 24
async function dashboardChecks() {
  const r1 = await sb.from("training_actions").select("*", { count: "exact", head: true }).in("status", ["SCHEDULED", "IN_PROGRESS"])
  const r2 = await sb.from("training_actions").select("*", { count: "exact", head: true }).in("status", ["SCHEDULED", "IN_PROGRESS"]).eq("tenantId", TENANT_ID)
  const r3 = await sb.from("training_actions").select("*", { count: "exact", head: true })
  const r4 = await sb.from("training_actions").select("status").limit(5000)
  const statusBuckets: Record<string, number> = {}
  for (const r of (r4.data ?? []) as { status: string }[]) statusBuckets[r.status ?? "(null)"] = (statusBuckets[r.status ?? "(null)"] ?? 0) + 1
  return {
    activeAll: r1.count,
    activeOportoForteOnly: r2.count,
    totalAll: r3.count,
    statusBuckets,
  }
}
out.dashboard = await dashboardChecks()

const outPath = resolve(here, "_audit-output.json")
writeFileSync(outPath, JSON.stringify(out, null, 2))
console.log("WROTE:", outPath, "bytes:", JSON.stringify(out).length)
