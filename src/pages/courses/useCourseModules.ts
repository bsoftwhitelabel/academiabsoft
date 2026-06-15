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
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["course_modules"] }),
  })
}

export function useDeleteCourseModule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("course_modules")
        .delete()
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["course_modules"] }),
  })
}

/** Persiste a nova ordem (drag reorder). Atualiza coluna order 1..N. */
export function useReorderCourseModules() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      for (let i = 0; i < orderedIds.length; i++) {
        const { error } = await supabase
          .from("course_modules")
          .update({ order: i + 1 })
          .eq("id", orderedIds[i])
        if (error) throw error
      }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["course_modules"] }),
  })
}
