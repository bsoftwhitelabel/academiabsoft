import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"
import { useCurrentUser } from "@/hooks/useCurrentUser"

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

// Sessão + tenant resolvidos do utilizador autenticado.
// Os KPIs só correm quando ambos estão disponíveis (evita o "0" silencioso
// durante o boot antes da sessão estabelecer).
function useScope() {
  const session = useAuthStore((s) => s.session)
  const user = useCurrentUser()
  const tenantId = user.data?.tenantId ?? null
  return { enabled: !!session && !!tenantId, tenantId }
}

export function useActiveActionsKpi() {
  const scope = useScope()
  return useQuery({
    queryKey: ["kpi", "active-actions", scope.tenantId],
    enabled: scope.enabled,
    queryFn: () =>
      countWhere(() =>
        supabase
          .from("training_actions")
          .select("*", { count: "exact", head: true })
          .eq("tenantId", scope.tenantId as string)
          .in("status", ["SCHEDULED", "IN_PROGRESS"])
      ),
  })
}

export function useActionsThisMonthKpi() {
  const scope = useScope()
  return useQuery({
    queryKey: ["kpi", "actions-this-month", scope.tenantId],
    enabled: scope.enabled,
    queryFn: () =>
      countWhere(() =>
        supabase
          .from("training_actions")
          .select("*", { count: "exact", head: true })
          .eq("tenantId", scope.tenantId as string)
          .gte("startDate", monthStartISO())
      ),
  })
}

export function useActiveTraineesKpi() {
  const scope = useScope()
  return useQuery({
    queryKey: ["kpi", "active-trainees", scope.tenantId],
    enabled: scope.enabled,
    queryFn: () =>
      countWhere(() =>
        supabase
          .from("trainees")
          .select("*", { count: "exact", head: true })
          .eq("tenantId", scope.tenantId as string)
          .eq("isActive", true)
      ),
  })
}

/**
 * Documentos pendentes de assinatura: linhas de document_signatures
 * ainda sem signedAt. A tabela não tem tenantId directo (filtra via RLS
 * pelo session/action). Mantemos o enabled gating para não devolver 0
 * antes de a sessão propagar.
 */
export function usePendingDocsKpi() {
  const scope = useScope()
  return useQuery({
    queryKey: ["kpi", "pending-docs", scope.tenantId],
    enabled: scope.enabled,
    queryFn: () =>
      countWhere(() =>
        supabase
          .from("document_signatures")
          .select("*", { count: "exact", head: true })
          .is("signedAt", null)
      ),
  })
}
