import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export interface SessionPlanInput {
  sessionId: string
  planObjetivos: string | null
  planIntroducao: string | null
  planDesenvolvimento: string | null
  planConclusao: string | null
  planAvaliacao: string | null
  didacticResources: string[] | null
}

export function useUpdateSessionPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SessionPlanInput) => {
      const { error } = await supabase
        .from("training_sessions")
        .update({
          planObjetivos: input.planObjetivos,
          planIntroducao: input.planIntroducao,
          planDesenvolvimento: input.planDesenvolvimento,
          planConclusao: input.planConclusao,
          planAvaliacao: input.planAvaliacao,
          didacticResources: input.didacticResources,
        })
        .eq("id", input.sessionId)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["trainer", "session", vars.sessionId] })
      qc.invalidateQueries({ queryKey: ["trainer", "sessions"] })
    },
  })
}
