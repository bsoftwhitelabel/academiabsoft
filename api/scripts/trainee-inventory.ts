import { config as loadEnv } from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { createClient } from "@supabase/supabase-js"

const here = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(here, "..", ".env") })
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const TENANT_ID = "cmok6xvlq0000pc43lyagc2pb"

// 1. Total trainees existentes neste tenant
const { count: total } = await sb
  .from("trainees")
  .select("*", { count: "exact", head: true })
  .eq("tenantId", TENANT_ID)

// 2. Client orgs (procurar Decathlon)
const { data: orgs } = await sb
  .from("client_orgs")
  .select("id, name, nif, isActive")
  .eq("tenantId", TENANT_ID)
  .order("name")

// 3. Amostra de trainees actual + emails para detecção de duplicados
const { data: existing } = await sb
  .from("trainees")
  .select("id, firstName, lastName, email, idNumber, clientOrgId, nif")
  .eq("tenantId", TENANT_ID)
  .limit(2500)

console.log(JSON.stringify({
  tenantId: TENANT_ID,
  totalTrainees: total,
  existingSample: (existing ?? []).slice(0, 5),
  emailsExistentes: (existing ?? []).filter(t => t.email).map(t => t.email.toLowerCase()),
  client_orgs: orgs,
}, null, 2))
