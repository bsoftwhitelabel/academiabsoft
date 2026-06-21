/**
 * Aplica v12_psy_lock_authenticated_select.sql via Postgres directo (pooler),
 * faz NOTIFY pgrst para refrescar o schema cache, e corre as 3 queries de
 * verificação pedidas (triggers, CHECK, grants).
 *
 * NUNCA imprime DATABASE_URL nem outras credenciais.
 */
import { config as loadEnv } from "dotenv"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"
import { readFileSync } from "node:fs"
import postgres from "postgres"
import { splitSqlStatements } from "./lib/split-sql.js"

const here = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(here, "..", ".env") })

const conn = process.env.DATABASE_URL
if (!conn) {
  console.error("Falta DATABASE_URL em api/.env")
  process.exit(1)
}

const migrationsDir = resolve(here, "..", "..", "docs", "migrations")
const v11Path = resolve(migrationsDir, "v11_psy_riscos_psicossociais.sql")
const v12Path = resolve(migrationsDir, "v12_psy_lock_authenticated_select.sql")
const sql11 = readFileSync(v11Path, "utf-8")
const sql12 = readFileSync(v12Path, "utf-8")

const sql = postgres(conn, {
  ssl: { rejectUnauthorized: false },
  prepare: false,
  max: 1,
  idle_timeout: 5,
})

async function runMigration(name: string, text: string) {
  const stmts = splitSqlStatements(text)
  console.log(`  ${stmts.length} statements a executar...`)
  let ok = 0
  for (const stmt of stmts) {
    try {
      await sql.unsafe(stmt)
      ok++
    } catch (e) {
      const err = e as { message?: string; code?: string }
      const head = stmt.replace(/\s+/g, " ").slice(0, 70)
      console.error(`  FALHA (${err.code ?? "?"}) em: ${head}...`)
      console.error(`    ${err.message}`)
      throw e
    }
  }
  console.log(`  ${name}: ${ok}/${stmts.length} statements OK.`)
}

try {
  console.log("=== a aplicar v11 (10 tabelas psy_*, triggers, CHECK, REVOKEs, RLS) ===")
  await runMigration("v11", sql11)

  console.log("\n=== a aplicar v12 (lock SELECT para authenticated) ===")
  await runMigration("v12", sql12)

  console.log("\n=== NOTIFY pgrst, 'reload schema' ===")
  await sql`NOTIFY pgrst, 'reload schema'`
  console.log("notify enviado.")

  console.log("\n=== 3a. Triggers psy_*trunc* ===")
  const rows3a = await sql`
    SELECT trigger_name, event_manipulation, action_timing, event_object_table
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
      AND trigger_name LIKE 'psy_%trunc%'
    ORDER BY trigger_name, event_manipulation
  `
  console.table([...rows3a])

  console.log("\n=== 3b. CHECK psy_dispatch_tokens_token_min_length ===")
  const rows3b = await sql`
    SELECT conname, pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid = 'public.psy_dispatch_tokens'::regclass
      AND conname  = 'psy_dispatch_tokens_token_min_length'
  `
  console.table([...rows3b])

  console.log("\n=== 4. Grants para 'authenticated' nas 3 tabelas sensíveis ===")
  const rows4 = await sql`
    SELECT grantee, table_name, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND grantee = 'authenticated'
      AND table_name IN ('psy_responses', 'psy_answers', 'psy_dispatch_tokens')
    ORDER BY table_name, privilege_type
  `
  if (rows4.length === 0) {
    console.log("0 linhas (esperado pós-v12).")
  } else {
    console.log(`${rows4.length} linhas (NÃO esperado pós-v12):`)
    console.table([...rows4])
  }

  console.log("\n=== Contexto: grants em tabelas de definição (não-sensíveis) ===")
  const rows5 = await sql`
    SELECT grantee, table_name, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public'
      AND grantee = 'authenticated'
      AND table_name IN (
        'psy_instruments','psy_dimensions','psy_questions','psy_thresholds',
        'psy_action_plans','psy_campaigns','psy_campaign_areas'
      )
    ORDER BY table_name, privilege_type
  `
  console.log(`${rows5.length} linhas:`)
  console.table([...rows5])
} finally {
  await sql.end({ timeout: 5 })
}
