import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { newId, now } from "@/lib/db-helpers"

export interface ToggleCheckInInput {
  sessionId: string
  traineeId: string
  isPresent: boolean
  currentUserId: string | null
}

// Modelo A: INSERT marca presença, DELETE remove. Idempotente via UNIQUE
// (sessionId, traineeId): repetir INSERT devolve 23505 e tratamos como
// "já estava marcado". registeredById é o cuid de users.id (não authUserId).
export function useToggleCheckIn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ToggleCheckInInput) => {
      if (input.isPresent) {
        const row = {
          id: newId(),
          sessionId: input.sessionId,
          traineeId: input.traineeId,
          status: "MANUAL" as const,
          isManual: true,
          registeredById: input.currentUserId,
          checkedInAt: now(),
        }
        const { error } = await supabase.from("check_ins").insert(row)
        if (error && error.code !== "23505") throw error
      } else {
        const { error } = await supabase
          .from("check_ins")
          .delete()
          .eq("sessionId", input.sessionId)
          .eq("traineeId", input.traineeId)
        if (error) throw error
      }
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["trainer", "session-checkins", vars.sessionId],
      })
    },
  })
}
