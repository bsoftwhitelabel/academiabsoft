import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { withDbDefaults } from "@/lib/db-helpers"
import type { Course } from "@/types/domain"

export interface CourseFilters {
  areaId?: string
  format?: string
}

// courses tem updatedAt. NOT NULL sem default: name, slug, durationHours, format.
export interface CourseInput {
  name: string
  slug: string
  code: string | null
  sigla: string | null
  durationHours: number
  areaId: string | null
  format: string
  status: string | null
  shortDescription: string | null
}

export function useCourses(filters: CourseFilters) {
  return useQuery({
    queryKey: ["courses", filters],
    queryFn: async (): Promise<Course[]> => {
      let q = supabase.from("courses").select("*").order("name").limit(500)
      if (filters.areaId) q = q.eq("areaId", filters.areaId)
      if (filters.format) q = q.eq("format", filters.format)
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Course[]
    },
  })
}

export function useUpsertCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id?: string
      tenantId: string
      input: CourseInput
    }) => {
      // courses.status é NOT NULL COM default na BD: omitir quando vazio
      // (deixa o default aplicar). Enviar null explícito viola o NOT NULL.
      const clean: Record<string, unknown> = { ...args.input }
      if (clean.status == null) delete clean.status

      if (args.id) {
        const { error } = await supabase
          .from("courses")
          .update(clean)
          .eq("id", args.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("courses")
          .insert(withDbDefaults({ ...clean, tenantId: args.tenantId }))
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  })
}

export function useDeleteCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["courses"] }),
  })
}
