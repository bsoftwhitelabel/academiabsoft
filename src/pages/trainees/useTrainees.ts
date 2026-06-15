import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { withDbDefaults } from "@/lib/db-helpers"
import type { Trainee } from "@/types/domain"

export type TraineeInput = Partial<Omit<Trainee, "id" | "createdAt" | "updatedAt">>

export function useTrainees(clientOrgId: string | undefined) {
  return useQuery({
    queryKey: ["trainees", clientOrgId],
    enabled: !!clientOrgId,
    queryFn: async (): Promise<Trainee[]> => {
      const { data, error } = await supabase
        .from("trainees")
        .select("*")
        .eq("clientOrgId", clientOrgId as string)
        .order("lastName")
        .limit(2000)
      if (error) throw error
      return (data ?? []) as Trainee[]
    },
  })
}

export function useUpsertTrainee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id?: string
      tenantId: string
      clientOrgId: string
      input: TraineeInput
    }) => {
      if (args.id) {
        const { error } = await supabase
          .from("trainees")
          .update(args.input)
          .eq("id", args.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("trainees").insert(
          withDbDefaults({
            ...args.input,
            tenantId: args.tenantId,
            clientOrgId: args.clientOrgId,
          })
        )
        if (error) throw error
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainees"] })
    },
  })
}

export function useDeleteTrainee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trainees").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainees"] })
    },
  })
}

/** Campos DGERT mínimos. Se algum faltar, mostra badge de pendência. */
export function traineeHasPending(t: Trainee): boolean {
  return !t.nif || !t.birthDate || !t.idNumber
}
