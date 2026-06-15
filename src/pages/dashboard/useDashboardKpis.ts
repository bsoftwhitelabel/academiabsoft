import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

function monthStartISO(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}

async function countWhere(
  build: () => PromiseLike<{ count: number | null; error: unknown }>
): Promise<number> {
  const { count, error } = await build()
  if (error) throw error
  return count ?? 0
}

export function useActiveActionsKpi() {
  return useQuery({
    queryKey: ["kpi", "active-actions"],
    queryFn: () =>
      countWhere(() =>
        supabase
          .from("training_actions")
          .select("*", { count: "exact", head: true })
          .in("status", ["SCHEDULED", "IN_PROGRESS"])
      ),
  })
}

export function useActionsThisMonthKpi() {
  return useQuery({
    queryKey: ["kpi", "actions-this-month"],
    queryFn: () =>
      countWhere(() =>
        supabase
          .from("training_actions")
          .select("*", { count: "exact", head: true })
          .gte("startDate", monthStartISO())
      ),
  })
}

export function useActiveTraineesKpi() {
  return useQuery({
    queryKey: ["kpi", "active-trainees"],
    queryFn: () =>
      countWhere(() =>
        supabase
          .from("trainees")
          .select("*", { count: "exact", head: true })
          .eq("isActive", true)
      ),
  })
}

/**
 * Documentos pendentes de assinatura: linhas de document_signatures
 * ainda sem signedAt. Coluna signedAt confirmada por introspecção.
 */
export function usePendingDocsKpi() {
  return useQuery({
    queryKey: ["kpi", "pending-docs"],
    queryFn: () =>
      countWhere(() =>
        supabase
          .from("document_signatures")
          .select("*", { count: "exact", head: true })
          .is("signedAt", null)
      ),
  })
}
