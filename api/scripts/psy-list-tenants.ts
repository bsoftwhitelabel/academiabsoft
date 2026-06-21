/**
 * Read-only: lista os tenants (id, name) via service role. Para escolher
 * o PSY_SEED_TENANT_ID. Nada de escrita.
 */
import { config as loadEnv } from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { createClient } from "@supabase/supabase-js"

const here = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(here, "..", ".env") })

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("Falta SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em api/.env")
  process.exit(1)
}

const sb = createClient(url, key, { auth: { persistSession: false } })

const { data, error } = await sb.from("tenants").select("id, name").order("name")
if (error) {
  console.error("Erro a ler tenants:", error.message)
  process.exit(1)
}
console.table(data ?? [])
console.log(`total: ${data?.length ?? 0}`)
