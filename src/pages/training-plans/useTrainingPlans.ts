import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { withDbDefaults } from "@/lib/db-helpers"
import type { TrainingPlan } from "@/types/domain"

export interface TrainingPlanInput {
  name: string
  year: number | null
  startDate: string | null
  endDate: string | null
  isInternal: boolean
  budget: number | null
  status: string
}

export function useTrainingPlans() {
  return useQuery({
    queryKey: ["training_plans", "list"],
    queryFn: async (): Promise<TrainingPlan[]> => {
      const { data, error } = await supabase
        .from("training_plans")
        .select("*")
        .order("year", { ascending: false })
      if (error) throw error
      return (data ?? []) as TrainingPlan[]
    },
  })
}

export function useUpsertTrainingPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id?: string
      tenantId: string
      input: TrainingPlanInput
    }) => {
      if (args.id) {
        const { error } = await supabase
          .from("training_plans")
          .update(args.input)
          .eq("id", args.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("training_plans")
          .insert(withDbDefaults({ ...args.input, tenantId: args.tenantId }))
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training_plans"] })
    },
  })
}

export function useDeleteTrainingPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("training_plans")
        .delete()
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training_plans"] })
    },
  })
}
