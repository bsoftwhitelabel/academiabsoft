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

export function useCourse(id: string | undefined) {
  return useQuery({
    queryKey: ["course", id],
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async (): Promise<Course | null> => {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("id", id as string)
        .maybeSingle()
      if (error) throw error
      return (data as Course) ?? null
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
    }): Promise<Course> => {
      // courses.status é NOT NULL COM default na BD: omitir quando vazio
      // (deixa o default aplicar). Enviar null explícito viola o NOT NULL.
      const clean: Record<string, unknown> = { ...args.input }
      if (clean.status == null) delete clean.status

      if (args.id) {
        const { data, error } = await supabase
          .from("courses")
          .update(clean)
          .eq("id", args.id)
          .select("*")
          .single()
        if (error) throw error
        return data as Course
      }
      const { data, error } = await supabase
        .from("courses")
        .insert(withDbDefaults({ ...clean, tenantId: args.tenantId }))
        .select("*")
        .single()
      if (error) throw error
      return data as Course
    },
    onSuccess: (row) => {
      // Escrita imediata no cache individual + refetch de segurança.
      // Igual ao padrão dos planos: evita "reabrir com dados antigos".
      qc.setQueryData(["course", row.id], row)
      qc.invalidateQueries({ queryKey: ["course", row.id] })
      qc.invalidateQueries({ queryKey: ["courses"] })
    },
  })
}

export function useDeleteCourse() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id)
      if (error) throw error
      return id
    },
    onSuccess: (id) => {
      qc.removeQueries({ queryKey: ["course", id] })
      qc.invalidateQueries({ queryKey: ["courses"] })
    },
  })
}
