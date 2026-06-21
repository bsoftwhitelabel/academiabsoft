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

export function useTrainingPlan(id: string | undefined) {
  return useQuery({
    queryKey: ["training_plan", id],
    enabled: !!id,
    // Vindo da lista depois de gravar, não queremos servir cache obsoleto.
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async (): Promise<TrainingPlan | null> => {
      const { data, error } = await supabase
        .from("training_plans")
        .select("*")
        .eq("id", id as string)
        .maybeSingle()
      if (error) throw error
      return (data as TrainingPlan) ?? null
    },
  })
}

export interface PlanAuditLog {
  id: string
  action: string | null
  createdAt: string | null
  users: { firstName: string | null; lastName: string | null; email: string | null } | null
}

export function usePlanAuditLogs(planId: string | undefined) {
  return useQuery({
    queryKey: ["audit_logs", "TrainingPlan", planId],
    enabled: !!planId,
    queryFn: async (): Promise<PlanAuditLog[]> => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action, createdAt, users(firstName, lastName, email)")
        .eq("resource", "TrainingPlan")
        .eq("resourceId", planId as string)
        .order("createdAt", { ascending: false })
        .limit(10)
      if (error) {
        // Sem permissão RLS é caso esperado: não rebenta a UI, devolve vazio.
        return []
      }
      return (data ?? []) as unknown as PlanAuditLog[]
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
    }): Promise<TrainingPlan> => {
      if (args.id) {
        const { data, error } = await supabase
          .from("training_plans")
          .update(args.input)
          .eq("id", args.id)
          .select("*")
          .single()
        if (error) throw error
        return data as TrainingPlan
      }
      const { data, error } = await supabase
        .from("training_plans")
        .insert(withDbDefaults({ ...args.input, tenantId: args.tenantId }))
        .select("*")
        .single()
      if (error) throw error
      return data as TrainingPlan
    },
    onSuccess: (row) => {
      // Escrita imediata no cache da query individual para que qualquer
      // página de edição aberta veja já os valores frescos.
      qc.setQueryData(["training_plan", row.id], row)
      // Refetch de segurança para garantir consistência com a BD.
      qc.invalidateQueries({ queryKey: ["training_plan", row.id] })
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
      return id
    },
    onSuccess: (id) => {
      // Remove definitivamente o cache individual do plano apagado.
      qc.removeQueries({ queryKey: ["training_plan", id] })
      qc.invalidateQueries({ queryKey: ["training_plans"] })
    },
  })
}
