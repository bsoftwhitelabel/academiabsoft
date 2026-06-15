import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export interface TrainerSessionRow {
  id: string
  sessionDate: string | null
  startTime: string | null
  endTime: string | null
  durationHours: number | null
  summary: string | null
  planObjetivos: string | null
  planIntroducao: string | null
  planDesenvolvimento: string | null
  planConclusao: string | null
  planAvaliacao: string | null
  trainerSignedAt: string | null
  course_modules: { name: string } | null
  training_actions: {
    id: string
    actionCode: string | null
    format: string | null
    course: { name: string; durationHours: number | null } | null
    clientOrg: { name: string } | null
  } | null
}

// Sem filtro explícito de trainerId: o RLS já restringe às sessões do
// formador autenticado (trainerId = ele, ou via training_action_trainers).
export function useTrainerSessions() {
  return useQuery({
    queryKey: ["trainer", "sessions"],
    queryFn: async (): Promise<TrainerSessionRow[]> => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select(
          `id,sessionDate,startTime,endTime,durationHours,summary,
           planObjetivos,planIntroducao,planDesenvolvimento,planConclusao,
           planAvaliacao,trainerSignedAt,
           course_modules!courseModuleId(name),
           training_actions!trainingActionId(
             id,actionCode,format,
             course:courses!courseId(name,durationHours),
             clientOrg:client_orgs!clientOrgId(name)
           )`
        )
        .order("sessionDate", { ascending: false })
        .order("startTime", { ascending: false })
      if (error) throw error
      return (data ?? []) as unknown as TrainerSessionRow[]
    },
  })
}
