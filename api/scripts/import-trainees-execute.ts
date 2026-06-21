import { config as loadEnv } from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"
import cuid from "cuid"

const here = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(here, "..", ".env") })
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

const TENANT_ID = "cmok6xvlq0000pc43lyagc2pb"
const PLAN_PATH = resolve(here, "_import-plan.json")
const SNAP_PATH = resolve(here, "_bd-snapshot.json")

type Plan = {
  stats: Record<string, unknown>
  newClientOrgs: Array<{ name: string; domainsCovered: string[] }>
  trainees: Array<{
    firstName: string
    lastName: string
    email: string
    gender: string | null
    birthDate: string | null
    nationality: string | null
    country: string
    nif: string | null
    idType: string | null
    idNumber: string | null
    address: string | null
    postalCode: string | null
    city: string | null
    phone: string | null
    jobTitle: string | null
    gdprConsent: boolean
    clientOrgName: string | null
  }>
}

type Snap = {
  existingOrgs: Array<{ id: string; name: string; nameLc: string }>
}

const plan: Plan = JSON.parse(readFileSync(PLAN_PATH, "utf-8"))
const snap: Snap = JSON.parse(readFileSync(SNAP_PATH, "utf-8"))
const dryRun = process.argv.includes("--dry-run")

const nowIso = new Date().toISOString()

// 1) Criar client_orgs novos (idempotente: skip se nome já existe)
const orgNameToId = new Map<string, string>(snap.existingOrgs.map((o) => [o.nameLc, o.id]))
const newOrgs: Array<{ id: string; tenantId: string; name: string; isActive: boolean; createdAt: string; updatedAt: string }> = []
for (const o of plan.newClientOrgs) {
  const lc = o.name.toLowerCase()
  if (orgNameToId.has(lc)) continue
  const id = cuid()
  newOrgs.push({
    id,
    tenantId: TENANT_ID,
    name: o.name,
    isActive: true,
    createdAt: nowIso,
    updatedAt: nowIso,
  })
  orgNameToId.set(lc, id)
}

console.log(`[plan] newClientOrgs to create: ${newOrgs.length}`)
console.log(`[plan] trainees to insert: ${plan.trainees.length}`)
console.log(`[plan] dry-run: ${dryRun}`)

if (newOrgs.length && !dryRun) {
  const { error } = await sb.from("client_orgs").insert(newOrgs)
  if (error) {
    console.error("FATAL inserir client_orgs:", error.message)
    process.exit(1)
  }
  console.log(`[ok] client_orgs inseridas: ${newOrgs.length}`)
}

// 2) Bulk insert trainees em batches de 100
const trainees = plan.trainees.map((t) => ({
  id: cuid(),
  tenantId: TENANT_ID,
  clientOrgId: t.clientOrgName ? (orgNameToId.get(t.clientOrgName.toLowerCase()) ?? null) : null,
  firstName: t.firstName,
  lastName: t.lastName,
  gender: t.gender,
  birthDate: t.birthDate,
  nationality: t.nationality,
  country: t.country,
  nif: t.nif,
  idType: t.idType,
  idNumber: t.idNumber,
  email: t.email,
  phone: t.phone,
  address: t.address,
  postalCode: t.postalCode,
  city: t.city,
  jobTitle: t.jobTitle,
  gdprConsent: t.gdprConsent,
  gdprConsentAt: t.gdprConsent ? nowIso : null,
  isActive: true,
  createdAt: nowIso,
  updatedAt: nowIso,
}))

if (dryRun) {
  console.log("[dry-run] sample trainee #1:", JSON.stringify(trainees[0], null, 2))
  process.exit(0)
}

const BATCH = 100
let inserted = 0
let failed = 0
for (let i = 0; i < trainees.length; i += BATCH) {
  const batch = trainees.slice(i, i + BATCH)
  const { error } = await sb.from("trainees").insert(batch)
  if (error) {
    failed += batch.length
    console.error(`[ERR] batch ${i}-${i + batch.length}: ${error.message}`)
    // Não abortamos — continuamos com o próximo batch para isolar problemas
  } else {
    inserted += batch.length
    if ((i / BATCH) % 5 === 0) console.log(`  ... ${inserted} / ${trainees.length}`)
  }
}

console.log(JSON.stringify({
  ok: failed === 0,
  client_orgs_created: newOrgs.length,
  trainees_inserted: inserted,
  trainees_failed: failed,
}))
