import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { newId } from "@/lib/db-helpers"
import { generateResponseToken } from "@/lib/token"

export interface CreateCampaignInput {
  trainingActionId: string
  questionnaireId: string
}

export interface CreateCampaignResult {
  created: number
  skipped: number
}

interface NewResponseRow {
  id: string
  questionnaireId: string
  trainingActionId: string
  traineeId: string | null
  trainerId: string | null
  token: string
  respondedAt: null
}

export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      input: CreateCampaignInput
    ): Promise<CreateCampaignResult> => {
      // 1) Resolver targetRole do questionário
      const { data: q, error: qErr } = await supabase
        .from("questionnaires")
        .select("id,targetRole")
        .eq("id", input.questionnaireId)
        .maybeSingle()
      if (qErr) throw qErr
      if (!q) throw new Error("Questionário não encontrado")

      // 2) Quais responses já existem (não duplica)
      const { data: exist, error: eErr } = await supabase
        .from("questionnaire_responses")
        .select("traineeId,trainerId")
        .eq("trainingActionId", input.trainingActionId)
        .eq("questionnaireId", input.questionnaireId)
      if (eErr) throw eErr
      const existingTrainees = new Set(
        (exist ?? []).map((r) => r.traineeId).filter(Boolean) as string[]
      )
      const existingTrainers = new Set(
        (exist ?? []).map((r) => r.trainerId).filter(Boolean) as string[]
      )

      // 3) Lista de candidatos
      const rows: NewResponseRow[] = []
      if (q.targetRole === "TRAINEE") {
        const { data: enrs, error: enErr } = await supabase
          .from("enrollments")
          .select("traineeId")
          .eq("trainingActionId", input.trainingActionId)
          .neq("status", "CANCELLED")
        if (enErr) throw enErr
        const traineeIds = Array.from(
          new Set((enrs ?? []).map((e) => e.traineeId).filter(Boolean) as string[])
        )
        for (const tid of traineeIds) {
          if (existingTrainees.has(tid)) continue
          rows.push({
            id: newId(),
            questionnaireId: input.questionnaireId,
            trainingActionId: input.trainingActionId,
            traineeId: tid,
            trainerId: null,
            token: generateResponseToken(),
            respondedAt: null,
          })
        }
        return await bulkInsertAndReport(rows, traineeIds.length)
      }

      // TRAINER
      const { data: tats, error: tErr } = await supabase
        .from("training_action_trainers")
        .select("trainerId")
        .eq("trainingActionId", input.trainingActionId)
      if (tErr) throw tErr
      const trainerIds = Array.from(
        new Set((tats ?? []).map((x) => x.trainerId).filter(Boolean) as string[])
      )
      for (const tid of trainerIds) {
        if (existingTrainers.has(tid)) continue
        rows.push({
          id: newId(),
          questionnaireId: input.questionnaireId,
          trainingActionId: input.trainingActionId,
          traineeId: null,
          trainerId: tid,
          token: generateResponseToken(),
          respondedAt: null,
        })
      }
      return await bulkInsertAndReport(rows, trainerIds.length)
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["action", vars.trainingActionId, "campaigns"],
      })
      qc.invalidateQueries({
        queryKey: ["action", vars.trainingActionId, "campaign", vars.questionnaireId],
      })
    },
  })
}

async function bulkInsertAndReport(
  rows: NewResponseRow[],
  totalCandidates: number
): Promise<CreateCampaignResult> {
  const skipped = totalCandidates - rows.length
  if (rows.length === 0) return { created: 0, skipped }
  const { error } = await supabase.from("questionnaire_responses").insert(rows)
  if (error) throw error
  return { created: rows.length, skipped }
}

export interface DeleteCampaignInput {
  trainingActionId: string
  questionnaireId: string
}

export function useDeleteCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: DeleteCampaignInput) => {
      // Bloqueia se houver respostas já submetidas
      const { data: submitted, error: sErr } = await supabase
        .from("questionnaire_responses")
        .select("id", { count: "exact" })
        .eq("trainingActionId", input.trainingActionId)
        .eq("questionnaireId", input.questionnaireId)
        .not("respondedAt", "is", null)
      if (sErr) throw sErr
      const n = submitted?.length ?? 0
      if (n > 0) {
        throw new Error(
          `Há ${n} resposta(s) já submetida(s). Apague-as individualmente via dashboard se necessário.`
        )
      }
      // Apaga eventuais answers órfãs (FK) — se a tabela existir como questionnaire_answers
      // ligada a response, é melhor o admin apagar via dashboard. Como pendentes
      // não têm answers, vamos directo ao delete das responses.
      const { error } = await supabase
        .from("questionnaire_responses")
        .delete()
        .eq("trainingActionId", input.trainingActionId)
        .eq("questionnaireId", input.questionnaireId)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({
        queryKey: ["action", vars.trainingActionId, "campaigns"],
      })
      qc.invalidateQueries({
        queryKey: ["action", vars.trainingActionId, "campaign", vars.questionnaireId],
      })
    },
  })
}
