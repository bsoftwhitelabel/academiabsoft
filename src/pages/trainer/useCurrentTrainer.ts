import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export interface CurrentTrainer {
  id: string
  userId: string
  tenantId: string
  isExternal: boolean
}

// Resolve a linha de `trainers` do utilizador autenticado (quando é TRAINER).
// Necessário para verificar ownership das sessões (trainerId === este.id).
export function useCurrentTrainer() {
  const me = useCurrentUser()
  const userId = me.data?.id
  const isTrainer = me.data?.role === "TRAINER"
  return useQuery({
    queryKey: ["trainer", "current-trainer", userId],
    enabled: !!userId && isTrainer,
    queryFn: async (): Promise<CurrentTrainer | null> => {
      const { data, error } = await supabase
        .from("trainers")
        .select("id,userId,tenantId,isExternal")
        .eq("userId", userId as string)
        .maybeSingle()
      if (error) throw error
      return (data as CurrentTrainer) ?? null
    },
  })
}
