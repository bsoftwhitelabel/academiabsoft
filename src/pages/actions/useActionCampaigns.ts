import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { QuestionnaireTargetRole } from "@/types/domain"

export interface CampaignSummary {
  questionnaireId: string
  questionnaireName: string
  targetRole: QuestionnaireTargetRole
  total: number
  responded: number
  pending: number
}

interface RawResponseAgg {
  questionnaireId: string
  respondedAt: string | null
  questionnaires: {
    name: string
    targetRole: QuestionnaireTargetRole
  } | null
}

// Agregação client-side: o PostgREST não suporta GROUP BY directo.
// O embed `questionnaires(...)` funciona porque o FK
// questionnaire_responses.questionnaireId -> questionnaires.id está
// catalogado.
export function useActionCampaigns(trainingActionId: string | undefined) {
  return useQuery({
    queryKey: ["action", trainingActionId, "campaigns"],
    enabled: !!trainingActionId,
    queryFn: async (): Promise<CampaignSummary[]> => {
      const { data, error } = await supabase
        .from("questionnaire_responses")
        .select(
          `questionnaireId,respondedAt,questionnaires(name,targetRole)`
        )
        .eq("trainingActionId", trainingActionId as string)
      if (error) throw error
      const rows = (data ?? []) as unknown as RawResponseAgg[]
      const map = new Map<string, CampaignSummary>()
      for (const r of rows) {
        const cur = map.get(r.questionnaireId) ?? {
          questionnaireId: r.questionnaireId,
          questionnaireName: r.questionnaires?.name ?? "(sem nome)",
          targetRole: r.questionnaires?.targetRole ?? "TRAINEE",
          total: 0,
          responded: 0,
          pending: 0,
        }
        cur.total += 1
        if (r.respondedAt) cur.responded += 1
        else cur.pending += 1
        map.set(r.questionnaireId, cur)
      }
      return [...map.values()].sort((a, b) =>
        a.questionnaireName.localeCompare(b.questionnaireName)
      )
    },
  })
}

export interface CampaignResponseRow {
  id: string
  token: string
  respondedAt: string | null
  traineeId: string | null
  trainerId: string | null
  trainee: {
    firstName: string | null
    lastName: string | null
    email: string | null
  } | null
  trainer: {
    firstName: string | null
    lastName: string | null
  } | null
}

// Os FKs questionnaire_responses.traineeId -> trainees e .trainerId -> trainers
// NÃO estão catalogados no schema PostgREST (descoberto empiricamente:
// PGRST200). Por isso fazemos join manual: 1 query às responses, depois
// 2 queries lookup às trainees e trainers (com users embed) por id-list.
// Trainer "name" vem por trainers.userId -> users(firstName,lastName).
export function useCampaignResponses(
  trainingActionId: string | undefined,
  questionnaireId: string | undefined
) {
  return useQuery({
    queryKey: ["action", trainingActionId, "campaign", questionnaireId],
    enabled: !!trainingActionId && !!questionnaireId,
    queryFn: async (): Promise<CampaignResponseRow[]> => {
      const { data, error } = await supabase
        .from("questionnaire_responses")
        .select("id,token,respondedAt,traineeId,trainerId")
        .eq("trainingActionId", trainingActionId as string)
        .eq("questionnaireId", questionnaireId as string)
      if (error) throw error
      const rows = data ?? []
      const traineeIds = Array.from(
        new Set(rows.map((r) => r.traineeId).filter(Boolean) as string[])
      )
      const trainerIds = Array.from(
        new Set(rows.map((r) => r.trainerId).filter(Boolean) as string[])
      )

      const [trainees, trainers] = await Promise.all([
        traineeIds.length
          ? supabase
              .from("trainees")
              .select("id,firstName,lastName,email")
              .in("id", traineeIds)
          : Promise.resolve({ data: [], error: null }),
        trainerIds.length
          ? supabase
              .from("trainers")
              .select("id,users(firstName,lastName)")
              .in("id", trainerIds)
          : Promise.resolve({ data: [], error: null }),
      ])
      if (trainees.error) throw trainees.error
      if (trainers.error) throw trainers.error

      const trMap = new Map<
        string,
        { firstName: string | null; lastName: string | null; email: string | null }
      >()
      for (const t of (trainees.data ?? []) as Array<{
        id: string
        firstName: string | null
        lastName: string | null
        email: string | null
      }>) {
        trMap.set(t.id, {
          firstName: t.firstName,
          lastName: t.lastName,
          email: t.email,
        })
      }
      const trnMap = new Map<
        string,
        { firstName: string | null; lastName: string | null }
      >()
      for (const t of (trainers.data ?? []) as Array<{
        id: string
        users: { firstName: string | null; lastName: string | null } | null
      }>) {
        trnMap.set(t.id, {
          firstName: t.users?.firstName ?? null,
          lastName: t.users?.lastName ?? null,
        })
      }

      return rows.map((r) => ({
        id: r.id,
        token: r.token,
        respondedAt: r.respondedAt,
        traineeId: r.traineeId,
        trainerId: r.trainerId,
        trainee: r.traineeId
          ? trMap.get(r.traineeId) ?? null
          : null,
        trainer: r.trainerId ? trnMap.get(r.trainerId) ?? null : null,
      }))
    },
  })
}
