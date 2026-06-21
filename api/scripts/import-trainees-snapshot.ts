import { config as loadEnv } from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { createClient } from "@supabase/supabase-js"
import { writeFileSync } from "node:fs"

const here = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(here, "..", ".env") })
const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const TENANT_ID = "cmok6xvlq0000pc43lyagc2pb"

const { data: trainees } = await sb
  .from("trainees")
  .select("email")
  .eq("tenantId", TENANT_ID)
const { data: orgs } = await sb
  .from("client_orgs")
  .select("id, name")
  .eq("tenantId", TENANT_ID)

const out = {
  tenantId: TENANT_ID,
  existingEmails: (trainees ?? []).map((t: any) => (t.email ?? "").toLowerCase()).filter(Boolean),
  existingOrgs: (orgs ?? []).map((o: any) => ({ id: o.id, name: o.name, nameLc: o.name.toLowerCase() })),
}
const outPath = resolve(here, "_bd-snapshot.json")
writeFileSync(outPath, JSON.stringify(out, null, 2))
console.log(JSON.stringify({
  ok: true,
  outPath,
  existingEmailCount: out.existingEmails.length,
  existingOrgCount: out.existingOrgs.length,
}))
