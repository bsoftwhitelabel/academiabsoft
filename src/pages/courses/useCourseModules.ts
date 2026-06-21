import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { withId } from "@/lib/db-helpers"
import type { Course, CourseModule } from "@/types/domain"

export interface CourseModuleInput {
  name: string
  description: string | null
  durationHours: number
  order: number
}

export function useCourseModules(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course_modules", courseId],
    enabled: !!courseId,
    queryFn: async (): Promise<CourseModule[]> => {
      const { data, error } = await supabase
        .from("course_modules")
        .select("*")
        .eq("courseId", courseId as string)
        .order("order")
      if (error) throw error
      return (data ?? []) as CourseModule[]
    },
  })
}

export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course", courseId],
    enabled: !!courseId,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async (): Promise<Course | null> => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId as string)
        .maybeSingle()
      if (error) throw error
      return (data as Course) ?? null
    },
  })
}

/** Quantas ações usam este curso (lock de edição: regra DGERT). */
export function useCourseActionCount(courseId: string | undefined) {
  return useQuery({
    queryKey: ["course_action_count", courseId],
    enabled: !!courseId,
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("training_actions")
        .select("id", { count: "exact", head: true })
        .eq("courseId", courseId as string)
      if (error) throw error
      return count ?? 0
    },
  })
}

/**
 * Recalcula course.durationHours como soma das durações dos módulos.
 * Persiste na BD. Chama-se sempre que um módulo muda.
 */
export async function recalcCourseDuration(courseId: string): Promise<number> {
  const { data, error } = await supabase
    .from("course_modules")
    .select("durationHours")
    .eq("courseId", courseId)
  if (error) throw error
  const total = (data ?? []).reduce(
    (s: number, m: { durationHours: number | null }) =>
      s + (Number(m.durationHours) || 0),
    0
  )
  const { error: upErr } = await supabase
    .from("courses")
    .update({ durationHours: total })
    .eq("id", courseId)
  if (upErr) throw upErr
  return total
}

function invalidateAfterModuleChange(
  qc: ReturnType<typeof useQueryClient>,
  courseId: string
) {
  qc.invalidateQueries({ queryKey: ["course_modules", courseId] })
  qc.invalidateQueries({ queryKey: ["course", courseId] })
  qc.invalidateQueries({ queryKey: ["courses"] })
  qc.invalidateQueries({ queryKey: ["course-aggregates"] })
}

export function useUpsertCourseModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id?: string
      courseId: string
      input: CourseModuleInput
    }) => {
      if (args.id) {
        const { error } = await supabase
          .from("course_modules")
          .update(args.input)
          .eq("id", args.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("course_modules")
          .insert(withId({ ...args.input, courseId: args.courseId }))
        if (error) throw error
      }
      await recalcCourseDuration(args.courseId)
      return args.courseId
    },
    onSuccess: (courseId) => invalidateAfterModuleChange(qc, courseId),
  })
}

export function useDeleteCourseModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; courseId: string }) => {
      const { error } = await supabase
        .from("course_modules")
        .delete()
        .eq("id", args.id)
      if (error) throw error
      await recalcCourseDuration(args.courseId)
      return args.courseId
    },
    onSuccess: (courseId) => invalidateAfterModuleChange(qc, courseId),
  })
}

/** Persiste a nova ordem (drag reorder / setas). Atualiza order 1..N. */
export function useReorderCourseModules() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { orderedIds: string[]; courseId: string }) => {
      for (let i = 0; i < args.orderedIds.length; i++) {
        const { error } = await supabase
          .from("course_modules")
          .update({ order: i + 1 })
          .eq("id", args.orderedIds[i])
        if (error) throw error
      }
      // Reorder não altera a duração total mas mantém o invariante.
      await recalcCourseDuration(args.courseId)
      return args.courseId
    },
    onSuccess: (courseId) => invalidateAfterModuleChange(qc, courseId),
  })
}
