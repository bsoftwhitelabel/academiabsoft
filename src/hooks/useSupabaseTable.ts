import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export type Row = Record<string, unknown>

/**
 * Hooks genéricos de leitura. Não referenciam nomes de coluna (regra 3).
 * Usam apenas nomes de tabela confirmados no banco vivo via select('*').
 * Assim que a RLS liberar leitura, as colunas reais aparecem dinamicamente.
 */
export function useTableRows(table: string, limit = 200) {
  return useQuery({
    queryKey: ["table", table, "rows", limit],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .limit(limit)
      if (error) throw error
      return (data ?? []) as Row[]
    },
  })
}

export function useTableCount(table: string) {
  return useQuery({
    queryKey: ["table", table, "count"],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
      if (error) throw error
      return count ?? 0
    },
  })
}
