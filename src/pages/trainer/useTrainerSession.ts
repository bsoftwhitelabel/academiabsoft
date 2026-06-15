import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export interface TrainerSessionDetail {
  id: string
  trainerId: string | null
  trainingActionId: string
  sessionDate: string | null
  startTime: string | null
  endTime: string | null
  durationHours: number | null
  sessionType: string | null
  summary: string | null
  trainerSignatureUrl: string | null
  trainerSignedAt: string | null
  planObjetivos: string | null
  planIntroducao: string | null
  planDesenvolvimento: string | null
  planConclusao: string | null
  planAvaliacao: string | null
  didacticResources: string[] | null
  course_modules: { id: string; name: string; description: string | null } | null
  training_actions: {
    id: string
    actionCode: string | null
    format: string | null
    startDate: string | null
    endDate: string | null
    tipologiaHorario: string | null
    localFormacao: string | null
    course: { id: string; name: string; durationHours: number | null } | null
    clientOrg: { id: string; name: string } | null
  } | null
}

export function useTrainerSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ["trainer", "session", sessionId],
    enabled: !!sessionId,
    queryFn: async (): Promise<TrainerSessionDetail> => {
      const { data, error } = await supabase
        .from("training_sessions")
        .select(
          `*,
           course_modules!courseModuleId(id,name,description),
           training_actions!trainingActionId(
             id,actionCode,format,startDate,endDate,
             tipologiaHorario,localFormacao,
             course:courses!courseId(id,name,durationHours),
             clientOrg:client_orgs!clientOrgId(id,name)
           )`
        )
        .eq("id", sessionId as string)
        .maybeSingle()
      if (error) throw error
      if (!data) throw new Error("Sessão não encontrada ou sem acesso")
      return data as unknown as TrainerSessionDetail
    },
  })
}
