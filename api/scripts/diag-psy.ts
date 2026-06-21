/**
 * Diagnóstico READ-ONLY do estado da BD para o módulo psy.
 *
 * NÃO faz nada além de SELECT/HEAD count. NÃO aplica migrações, NÃO corre
 * seed, NÃO insere/actualiza/apaga nada. Service role do api/.env.
 *
 * Limitação conhecida: o PostgREST do Supabase NÃO expõe `pg_catalog` nem
 * `information_schema` por defeito. Triggers, CHECKs e GRANTs não podem
 * ser confirmados directamente daqui. Reportamos o que conseguimos via
 * tentativas e indicamos queries SQL para o utilizador correr no Studio.
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
  console.error("[diag-psy] ERRO: falta SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY em api/.env")
  process.exit(1)
}

const sb = createClient(url, key, { auth: { persistSession: false } })

const PSY_TABLES = [
  "psy_instruments",
  "psy_dimensions",
  "psy_questions",
  "psy_thresholds",
  "psy_action_plans",
  "psy_campaigns",
  "psy_campaign_areas",
  "psy_dispatch_tokens",
  "psy_responses",
  "psy_answers",
] as const

// ----------------------------------------------------------------------------
// 1 + 2: tabelas existem e contagens
// ----------------------------------------------------------------------------
console.log("=== 1+2. TABELAS psy_* e contagens ===\n")
type RowStatus = { tabela: string; existe: boolean; linhas: number | "—"; erro: string | null }
const rows: RowStatus[] = []
for (const t of PSY_TABLES) {
  const { count, error } = await sb
    .from(t)
    .select("*", { count: "exact", head: true })
  if (error) {
    const code = (error as { code?: string }).code ?? ""
    const ausente = /relation .* does not exist/i.test(error.message) ||
      code === "42P01" ||
      code === "PGRST205" ||
      code === "PGRST204"
    rows.push({
      tabela: t,
      existe: !ausente && false,
      linhas: "—",
      erro: ausente ? "(tabela não existe)" : `${code} ${error.message}`,
    })
  } else {
    rows.push({ tabela: t, existe: true, linhas: count ?? 0, erro: null })
  }
}
console.table(rows)

// ----------------------------------------------------------------------------
// 3 + 4: introspecção (triggers, CHECKs, grants)
// ----------------------------------------------------------------------------
console.log("\n=== 3+4. INTROSPECÇÃO via PostgREST ===\n")
console.log("Tentativas a tabelas de catálogo (esperado: maioria bloqueadas):\n")

// 3a. Triggers de truncate (qualified schema)
console.log("3a. Triggers psy_*trunc* via information_schema.triggers:")
{
  const r = await sb
    // @ts-expect-error: .schema é suportado mas tipos podem ser estritos a 'public'
    .schema("information_schema")
    .from("triggers")
    .select("trigger_name, event_manipulation, action_timing, event_object_table")
    .eq("trigger_schema", "public")
    .like("trigger_name", "psy_%trunc%")
  if (r.error) {
    console.log(`  ERRO: ${(r.error as { code?: string }).code ?? ""} ${r.error.message}`)
  } else {
    console.log(`  encontradas ${r.data?.length ?? 0} linhas:`)
    console.table(r.data ?? [])
  }
}

// 3b. CHECK do comprimento do token
console.log("\n3b. CHECK psy_dispatch_tokens_token_min_length via information_schema.table_constraints:")
{
  const r = await sb
    // @ts-expect-error
    .schema("information_schema")
    .from("table_constraints")
    .select("constraint_name, constraint_type, table_name")
    .eq("table_schema", "public")
    .eq("table_name", "psy_dispatch_tokens")
    .eq("constraint_type", "CHECK")
  if (r.error) {
    console.log(`  ERRO: ${(r.error as { code?: string }).code ?? ""} ${r.error.message}`)
  } else {
    console.log(`  encontradas ${r.data?.length ?? 0} linhas`)
    console.table(r.data ?? [])
  }
}

// 4. Grants para 'authenticated' nas 3 tabelas sensíveis
console.log("\n4. Grants para 'authenticated' em psy_responses/psy_answers/psy_dispatch_tokens:")
{
  const r = await sb
    // @ts-expect-error
    .schema("information_schema")
    .from("role_table_grants")
    .select("grantee, table_name, privilege_type")
    .eq("table_schema", "public")
    .eq("grantee", "authenticated")
    .in("table_name", ["psy_responses", "psy_answers", "psy_dispatch_tokens"])
  if (r.error) {
    console.log(`  ERRO: ${(r.error as { code?: string }).code ?? ""} ${r.error.message}`)
  } else {
    console.log(`  encontradas ${r.data?.length ?? 0} linhas (esperado APÓS v12: 0):`)
    console.table(r.data ?? [])
  }
}

// 5. Comparação: também ver grants das tabelas de definição (psy_dimensions etc)
console.log("\n5. Grants em tabelas de definição (psy_dimensions/questions/thresholds/instruments) p/ contexto:")
{
  const r = await sb
    // @ts-expect-error
    .schema("information_schema")
    .from("role_table_grants")
    .select("grantee, table_name, privilege_type")
    .eq("table_schema", "public")
    .eq("grantee", "authenticated")
    .in("table_name", [
      "psy_instruments",
      "psy_dimensions",
      "psy_questions",
      "psy_thresholds",
      "psy_action_plans",
      "psy_campaigns",
      "psy_campaign_areas",
    ])
  if (r.error) {
    console.log(`  ERRO: ${(r.error as { code?: string }).code ?? ""} ${r.error.message}`)
  } else {
    console.log(`  encontradas ${r.data?.length ?? 0} linhas:`)
    console.table(r.data ?? [])
  }
}

// ----------------------------------------------------------------------------
// SQL sugerido para o utilizador correr no Supabase SQL Editor se quiser
// confirmar pontos 3 e 4.
// ----------------------------------------------------------------------------
console.log("\n=== QUERIES SQL para o utilizador correr no Supabase SQL Editor ===")
console.log(`
-- 3a. Triggers de truncate
SELECT trigger_name, event_manipulation, action_timing, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public' AND trigger_name LIKE 'psy_%trunc%'
ORDER BY trigger_name, event_manipulation;

-- 3b. CHECK de comprimento do token
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.psy_dispatch_tokens'::regclass
  AND conname  = 'psy_dispatch_tokens_token_min_length';

-- 4. Grants de SELECT para 'authenticated' nas 3 tabelas sensíveis
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee = 'authenticated'
  AND table_name IN ('psy_responses', 'psy_answers', 'psy_dispatch_tokens')
ORDER BY table_name, privilege_type;
-- Esperado APÓS v12 aplicada: 0 linhas.
`)
