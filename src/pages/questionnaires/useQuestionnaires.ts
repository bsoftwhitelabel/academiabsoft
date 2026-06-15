import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type {
  Questionnaire,
  QuestionnaireContext,
  QuestionnaireTargetRole,
} from "@/types/domain"

export interface QuestionnaireWithCount extends Questionnaire {
  questionCount: number
}

export interface QuestionnairesFilter {
  targetRole?: QuestionnaireTargetRole
  context?: QuestionnaireContext
}

// PostgREST: embed count via questionnaire_questions(count) devolve
// [{ count: N }]; normalizamos para um número.
interface RawRow extends Questionnaire {
  questionnaire_questions: Array<{ count: number }>
}

export function useQuestionnaires(filter: QuestionnairesFilter = {}) {
  return useQuery({
    queryKey: ["questionnaires", filter],
    queryFn: async (): Promise<QuestionnaireWithCount[]> => {
      let q = supabase
        .from("questionnaires")
        .select(`*, questionnaire_questions(count)`)
        .order("name")
      if (filter.targetRole) q = q.eq("targetRole", filter.targetRole)
      if (filter.context) q = q.eq("context", filter.context)
      const { data, error } = await q
      if (error) throw error
      const rows = (data ?? []) as unknown as RawRow[]
      return rows.map((r) => ({
        id: r.id,
        tenantId: r.tenantId,
        name: r.name,
        format: r.format,
        targetRole: r.targetRole,
        context: r.context,
        questionCount: r.questionnaire_questions?.[0]?.count ?? 0,
      }))
    },
  })
}
