/**
 * Diagnóstico read-only: identifica utilizadores em public.users sem tenantId.
 *
 * Passos:
 *   1. Lista colunas reais de public.users (snake/camel sem assumir).
 *   2. Lista users + JOIN auth.users por authUserId.
 *   3. Identifica nulls.
 *
 * NÃO escreve. Não imprime DATABASE_URL.
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

const sql = postgres(conn, {
  ssl: { rejectUnauthorized: false },
  prepare: false,
  max: 1,
})

try {
  console.log("=== 1. Colunas reais de public.users ===")
  const cols = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users'
    ORDER BY ordinal_position
  `
  console.table([...cols])

  // Detecta os nomes reais das colunas tenant/authUser (camel ou snake)
  const colNames = cols.map((c) => c.column_name as string)
  const tenantCol = colNames.find((n) =>
    ["tenantId", "tenant_id"].includes(n)
  )
  const authCol = colNames.find((n) =>
    ["authUserId", "auth_user_id", "userId", "user_id"].includes(n)
  )
  const emailCol = colNames.find((n) => n === "email")

  console.log("\nResolução de nomes:")
  console.log(`  tenant column: ${tenantCol ?? "(nenhuma encontrada)"}`)
  console.log(`  auth column:   ${authCol ?? "(nenhuma encontrada)"}`)
  console.log(`  email column:  ${emailCol ?? "(nenhuma encontrada)"}`)

  if (!tenantCol || !authCol || !emailCol) {
    console.error("\nNão consegui identificar colunas críticas. A parar.")
    process.exit(1)
  }

  console.log(
    `\n=== 2. Utilizadores em public.users (JOIN auth.users por ${authCol}) ===`
  )
  // Usa identificadores entre aspas porque podem ser camelCase com letras maiúsculas
  const usersQuery = `
    SELECT
      pu."${emailCol}"   AS email,
      pu."${authCol}"    AS auth_user_id,
      pu."${tenantCol}"  AS tenant_id,
      au.email           AS auth_email,
      au.created_at      AS auth_created_at
    FROM public.users pu
    LEFT JOIN auth.users au ON au.id::text = pu."${authCol}"::text
    ORDER BY pu."${tenantCol}" NULLS FIRST, pu."${emailCol}"
  `
  const users = await sql.unsafe(usersQuery)
  console.table(
    users.map((u) => ({
      email: u.email,
      auth_user_id: u.auth_user_id,
      tenant_id: u.tenant_id,
      auth_email: u.auth_email,
    }))
  )

  console.log("\n=== 3. Utilizadores SEM tenant ===")
  const noTenant = users.filter((u) => u.tenant_id == null)
  if (noTenant.length === 0) {
    console.log("Nenhum. Tudo OK.")
  } else {
    console.table(
      noTenant.map((u) => ({
        email: u.email,
        auth_user_id: u.auth_user_id,
        auth_email: u.auth_email,
      }))
    )
    console.log(`\nTotal sem tenant: ${noTenant.length}`)
  }

  console.log("\n=== 4. Distribuição por tenant ===")
  const byTenant = await sql.unsafe(`
    SELECT COALESCE(pu."${tenantCol}", '(NULL)') AS tenant_id,
           COUNT(*)::int AS users_count
    FROM public.users pu
    GROUP BY pu."${tenantCol}"
    ORDER BY users_count DESC
  `)
  console.table([...byTenant])
} finally {
  await sql.end({ timeout: 5 })
}
