import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { Questionnaire, QuestionnaireQuestion } from "@/types/domain"

export interface QuestionnaireDetail extends Questionnaire {
  questions: QuestionnaireQuestion[]
}

export function useQuestionnaire(id: string | undefined) {
  return useQuery({
    queryKey: ["questionnaire", id],
    enabled: !!id,
    queryFn: async (): Promise<QuestionnaireDetail | null> => {
      const { data, error } = await supabase
        .from("questionnaires")
        .select(
          `*, questionnaire_questions(id,questionnaireId,text,type,scaleMin,scaleMax,"order",isRequired)`
        )
        .eq("id", id as string)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      type Raw = Questionnaire & {
        questionnaire_questions: QuestionnaireQuestion[]
      }
      const r = data as unknown as Raw
      const questions = [...(r.questionnaire_questions ?? [])].sort(
        (a, b) => a.order - b.order
      )
      return {
        id: r.id,
        tenantId: r.tenantId,
        name: r.name,
        format: r.format,
        targetRole: r.targetRole,
        context: r.context,
        questions,
      }
    },
  })
}
