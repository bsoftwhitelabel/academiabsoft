import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export interface SessionSummaryInput {
  sessionId: string
  summary: string | null
  // Se vier, assina (PNG data URI) e marca trainerSignedAt = now.
  signaturePngBase64?: string
}

export function useUpdateSessionSummary() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SessionSummaryInput) => {
      const update: Record<string, unknown> = { summary: input.summary }
      if (input.signaturePngBase64) {
        update.trainerSignatureUrl = input.signaturePngBase64
        update.trainerSignedAt = new Date().toISOString()
      }
      const { error } = await supabase
        .from("training_sessions")
        .update(update)
        .eq("id", input.sessionId)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["trainer", "session", vars.sessionId] })
      qc.invalidateQueries({ queryKey: ["trainer", "sessions"] })
    },
  })
}
