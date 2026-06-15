import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

/**
 * Resolve um tenantId para operações de criação. Best effort: usa o
 * primeiro tenant activo. Seleção multi-tenant explícita fica para
 * quando o tenantStore for populado a partir do utilizador autenticado.
 */
export function useDefaultTenantId() {
  return useQuery({
    queryKey: ["default-tenant"],
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase
        .from("tenants")
        .select("id,isActive,createdAt")
        .order("createdAt")
      if (error) throw error
      const list = data ?? []
      const active = list.find((t) => t.isActive) ?? list[0]
      return active?.id ?? null
    },
  })
}
