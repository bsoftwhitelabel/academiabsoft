import { config as loadEnv } from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { createClient } from "@supabase/supabase-js"

const here = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(here, "..", ".env") })

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error("FALTA SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}
const sb = createClient(url, key, { auth: { persistSession: false } })

// Tenta seleccionar cada coluna v10 isoladamente; relata existência.
const cols = ["expiresAt", "respondentIp", "respondentUserAgent"]
const result: Record<string, boolean | string> = {}
for (const col of cols) {
  const { error } = await sb
    .from("questionnaire_responses")
    .select(col)
    .limit(1)
  if (error) {
    result[col] = error.message.includes("does not exist") ? false : error.message
  } else {
    result[col] = true
  }
}
console.log(JSON.stringify({ v10_columns: result }, null, 2))
