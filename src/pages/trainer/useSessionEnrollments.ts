import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export interface SessionEnrollmentRow {
  id: string
  status: string | null
  // Nesta BD os nomes do formando estão na própria tabela trainees
  // (trainees.userId é maioritariamente null; padrão já usado em
  // folha/registo). Por isso embed direto, não via users.
  trainee: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string | null
  } | null
}

export function useSessionEnrollments(trainingActionId: string | undefined) {
  return useQuery({
    queryKey: ["trainer", "session-enrollments", trainingActionId],
    enabled: !!trainingActionId,
    queryFn: async (): Promise<SessionEnrollmentRow[]> => {
      const { data, error } = await supabase
        .from("enrollments")
        .select(
          `id,status,
           trainee:trainees!traineeId(id,firstName,lastName,email)`
        )
        .eq("trainingActionId", trainingActionId as string)
        .neq("status", "CANCELLED")
      if (error) throw error
      return (data ?? []) as unknown as SessionEnrollmentRow[]
    },
  })
}
