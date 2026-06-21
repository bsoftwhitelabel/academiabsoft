import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export interface CourseAggregate {
  completion: {
    /** rácio 0..1. null = sem inscrições. */
    rate: number | null
    total: number
    completed: number
  }
  rating: {
    /** média 1..N. null = sem respostas SCALE. */
    avg: number | null
    count: number
  }
}

export type CourseAggregatesMap = Record<string, CourseAggregate>

/**
 * Agrega, para um conjunto de cursos:
 *  - Taxa de conclusão = COMPLETED / total de enrollments das actions do curso
 *  - Média de avaliação = média de scaleValue de questionnaire_answers
 *    ligadas a responses respondidas em actions do curso
 *
 * Tudo client-side em 4 queries IN(...). Aceitável para listas de centenas
 * de cursos; para milhares, evoluir para view materializada na BD.
 */
export function useCourseAggregates(courseIds: string[]) {
  const key = [...courseIds].sort().join(",")
  return useQuery({
    queryKey: ["course-aggregates", key],
    enabled: courseIds.length > 0,
    queryFn: async (): Promise<CourseAggregatesMap> => {
      const result: CourseAggregatesMap = {}
      for (const cid of courseIds) {
        result[cid] = {
          completion: { rate: null, total: 0, completed: 0 },
          rating: { avg: null, count: 0 },
        }
      }

      // 1) Actions por curso
      const { data: actions, error: aErr } = await supabase
        .from("training_actions")
        .select("id, courseId")
        .in("courseId", courseIds)
      if (aErr) throw aErr
      const actionToCourse = new Map<string, string>()
      for (const a of (actions ?? []) as { id: string; courseId: string }[]) {
        actionToCourse.set(a.id, a.courseId)
      }
      const actionIds = Array.from(actionToCourse.keys())
      if (actionIds.length === 0) return result

      // 2) Enrollments → taxa de conclusão por curso
      const { data: enrolls } = await supabase
        .from("enrollments")
        .select("status, trainingActionId")
        .in("trainingActionId", actionIds)
      for (const e of (enrolls ?? []) as {
        status: string | null
        trainingActionId: string
      }[]) {
        const cid = actionToCourse.get(e.trainingActionId)
        if (!cid) continue
        const c = result[cid].completion
        c.total++
        if (e.status === "COMPLETED") c.completed++
      }
      for (const cid of courseIds) {
        const c = result[cid].completion
        c.rate = c.total > 0 ? c.completed / c.total : null
      }

      // 3) Responses (respondidas) por curso
      const { data: responses } = await supabase
        .from("questionnaire_responses")
        .select("id, trainingActionId, respondedAt")
        .in("trainingActionId", actionIds)
        .not("respondedAt", "is", null)
      const responseToCourse = new Map<string, string>()
      for (const r of (responses ?? []) as {
        id: string
        trainingActionId: string
      }[]) {
        const cid = actionToCourse.get(r.trainingActionId)
        if (cid) responseToCourse.set(r.id, cid)
      }
      const responseIds = Array.from(responseToCourse.keys())
      if (responseIds.length === 0) return result

      // 4) Answers SCALE → média por curso
      const { data: answers } = await supabase
        .from("questionnaire_answers")
        .select("responseId, scaleValue")
        .in("responseId", responseIds)
        .not("scaleValue", "is", null)

      const sums: Record<string, { sum: number; n: number }> = {}
      for (const a of (answers ?? []) as {
        responseId: string
        scaleValue: number | null
      }[]) {
        const cid = responseToCourse.get(a.responseId)
        if (!cid || a.scaleValue == null) continue
        if (!sums[cid]) sums[cid] = { sum: 0, n: 0 }
        sums[cid].sum += a.scaleValue
        sums[cid].n += 1
      }
      for (const cid of courseIds) {
        const s = sums[cid]
        if (s && s.n > 0) {
          result[cid].rating.avg = s.sum / s.n
          result[cid].rating.count = s.n
        }
      }
      return result
    },
  })
}
