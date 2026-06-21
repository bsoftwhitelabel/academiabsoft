/**
 * Helper para semear linhas de psy_action_plans por dimensão.
 *
 * Garantia: delete-then-insert ATÓMICO POR DIMENSÃO. Apaga todas as linhas
 * existentes para a `dimensionId` dada e insere as novas a partir do mapa
 * `mapaPorClassificacao`. Nunca deixa placeholder e reais misturados na
 * mesma dimensão.
 *
 * Uso típico:
 *
 *   import { seedActionPlans } from "./lib/seed-action-plans.js"
 *
 *   // Substituir placeholder pelas linhas reais de uma dimensão:
 *   await seedActionPlans(sb, dimensionId, {
 *     favoravel: "Texto recomendado quando classificação favorável...",
 *     atencao:   "Texto recomendado em zona de atenção...",
 *     risco:     "Texto recomendado quando risco...",
 *     elevado:   "Texto recomendado em risco elevado...",
 *   })
 *
 *   // Reverter para placeholder (raro, mas suportado):
 *   await seedActionPlans(sb, dimensionId, { placeholder: "" })
 *
 * Limitação: PostgREST/supabase-js não expõe transacções, logo existe uma
 * janela curta entre o DELETE e o INSERT em que a dimensão fica sem linhas.
 * Aceitável para seed/migration. Para uso em produção ao vivo, mover para
 * uma RPC em PL/pgSQL com transacção.
 */

import type { SupabaseClient } from "@supabase/supabase-js"

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}

export type ActionPlanMap = Record<string, string>

export type SeedActionPlansResult = {
  dimensionId: string
  deletedCount: number
  insertedCount: number
  classificacoes: string[]
}

/**
 * Apaga todas as linhas de psy_action_plans da `dimensionId` indicada e
 * insere uma linha por entrada de `mapaPorClassificacao`. Cada entrada
 * vira um registo com `classificacao = key` e `texto = value`.
 *
 * IDs determinísticos: `${dimensionId}_ap_${slug(classificacao)}`.
 *
 * Lança `Error` se qualquer passo do supabase-js retornar erro.
 */
export async function seedActionPlans(
  sb: SupabaseClient,
  dimensionId: string,
  mapaPorClassificacao: ActionPlanMap
): Promise<SeedActionPlansResult> {
  if (!dimensionId || typeof dimensionId !== "string") {
    throw new Error("seedActionPlans: dimensionId obrigatório (string não vazia)")
  }

  // 1) DELETE de tudo o que existe para esta dimensão. select() obriga PostgREST
  //    a devolver as linhas apagadas, permitindo contar.
  const del = await sb
    .from("psy_action_plans")
    .delete()
    .eq("dimensionId", dimensionId)
    .select("id")
  if (del.error) {
    throw new Error(
      `seedActionPlans(${dimensionId}): delete falhou: ${del.error.message}`
    )
  }
  const deletedCount = del.data?.length ?? 0

  const entries = Object.entries(mapaPorClassificacao)
  if (entries.length === 0) {
    return { dimensionId, deletedCount, insertedCount: 0, classificacoes: [] }
  }

  // 2) INSERT das novas linhas. Mesmo dimensão, classificacao = key da entrada.
  const rows = entries.map(([classificacao, texto]) => ({
    id: `${dimensionId}_ap_${slug(classificacao)}`,
    dimensionId,
    classificacao,
    texto,
  }))
  const ins = await sb.from("psy_action_plans").insert(rows).select("id")
  if (ins.error) {
    throw new Error(
      `seedActionPlans(${dimensionId}): insert falhou: ${ins.error.message}`
    )
  }
  const insertedCount = ins.data?.length ?? 0

  return {
    dimensionId,
    deletedCount,
    insertedCount,
    classificacoes: entries.map(([k]) => k),
  }
}
