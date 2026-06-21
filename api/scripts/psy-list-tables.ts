/**
 * Read-only: lista todas as tabelas existentes no schema public que comecem
 * por 'psy_'. Confirma o estado real da BD via Postgres directo.
 */
import { config as loadEnv } from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import postgres from "postgres"

const here = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(here, "..", ".env") })

const conn = process.env.DATABASE_URL
if (!conn) {
  console.error("Falta DATABASE_URL em api/.env")
  process.exit(1)
}

const sql = postgres(conn, { ssl: { rejectUnauthorized: false }, prepare: false, max: 1 })

try {
  const rows = await sql`
    SELECT tablename FROM pg_tables
    WHERE schemaname='public' AND tablename LIKE 'psy_%'
    ORDER BY tablename
  `
  console.log(`Tabelas public.psy_* existentes: ${rows.length}`)
  for (const r of rows) console.log(`  - ${r.tablename}`)

  const v10 = await sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema='public' AND table_name='questionnaire_responses'
      AND column_name IN ('expiresAt', 'respondentIp', 'respondentUserAgent')
    ORDER BY column_name
  `
  console.log(`\nv10 colunas em questionnaire_responses: ${v10.length}/3`)
  for (const r of v10) console.log(`  - ${r.column_name}`)
} finally {
  await sql.end({ timeout: 5 })
}
