import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { withDbDefaults, withId } from "@/lib/db-helpers"

// Fábrica de hooks CRUD genérica para os submódulos de Gestão.
export interface CrudOptions {
  table: string
  queryKey: string
  orderBy: string
  ascending?: boolean
  // Tabelas com coluna tenantId recebem-na na criação.
  injectTenant?: boolean
  // true = tabela tem coluna updatedAt (usa withDbDefaults).
  // false/omisso = sem updatedAt (usa withId; enviar updatedAt dá 42703).
  hasUpdatedAt?: boolean
}

export function createCrudHooks<T extends { id: string }>(opts: CrudOptions) {
  const {
    table,
    queryKey,
    orderBy,
    ascending = true,
    injectTenant,
    hasUpdatedAt,
  } = opts

  function useList() {
    return useQuery({
      queryKey: [queryKey, "list"],
      queryFn: async (): Promise<T[]> => {
        const { data, error } = await supabase
          .from(table)
          .select("*")
          .order(orderBy, { ascending })
          .limit(2000)
        if (error) throw error
        return (data ?? []) as T[]
      },
    })
  }

  function useUpsert() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (args: {
        id?: string
        tenantId?: string
        input: Record<string, unknown>
      }) => {
        if (args.id) {
          const { error } = await supabase
            .from(table)
            .update(args.input)
            .eq("id", args.id)
          if (error) throw error
        } else {
          const base =
            injectTenant && args.tenantId
              ? { ...args.input, tenantId: args.tenantId }
              : args.input
          const payload = hasUpdatedAt
            ? withDbDefaults(base)
            : withId(base)
          const { error } = await supabase.from(table).insert(payload)
          if (error) throw error
        }
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
    })
  }

  function useRemove() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from(table).delete().eq("id", id)
        if (error) throw error
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: [queryKey] }),
    })
  }

  return { useList, useUpsert, useRemove }
}
