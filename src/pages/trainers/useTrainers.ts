import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { withDbDefaults, withId } from "@/lib/db-helpers"
import type { TrainerWithUser } from "@/types/domain"

// Dados pessoais (users) e profissionais (trainers) são gravados separadamente.
export interface TrainerInput {
  // users
  firstName: string | null
  lastName: string | null
  email: string
  phone: string | null
  // trainers
  ccpNumber: string | null
  isExternal: boolean
  eTrainer: boolean
  preferredSchedule: string | null
  yearsExperiencePresential: number
  yearsExperienceDistance: number
  vatRate: number | null
  regions: string[] | null
}

export function useTrainers() {
  return useQuery({
    queryKey: ["trainers", "list"],
    queryFn: async (): Promise<TrainerWithUser[]> => {
      const { data, error } = await supabase
        .from("trainers")
        .select("*,users(*)")
        .order("createdAt", { foreignTable: "users", ascending: false })
        .limit(1000)
      if (error) throw error
      return (data ?? []) as TrainerWithUser[]
    },
  })
}

/** Status de aprovação derivado de users.isActive (não há coluna status). */
export function trainerApprovalStatus(t: TrainerWithUser): "ATIVO" | "PENDENTE" {
  return t.users?.isActive ? "ATIVO" : "PENDENTE"
}

export function useUpsertTrainer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id?: string
      userId?: string
      tenantId: string
      input: TrainerInput
    }) => {
      const { input } = args
      const userPayload = {
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
      }
      const trainerPayload = {
        ccpNumber: input.ccpNumber,
        isExternal: input.isExternal,
        eTrainer: input.eTrainer,
        preferredSchedule: input.preferredSchedule,
        yearsExperiencePresential: input.yearsExperiencePresential,
        yearsExperienceDistance: input.yearsExperienceDistance,
        vatRate: input.vatRate,
        regions: input.regions,
      }

      if (args.id && args.userId) {
        const u = await supabase
          .from("users")
          .update(userPayload)
          .eq("id", args.userId)
        if (u.error) throw u.error
        const t = await supabase
          .from("trainers")
          .update(trainerPayload)
          .eq("id", args.id)
        if (t.error) throw t.error
        return
      }

      // Criação: provisiona o utilizador (PENDENTE = isActive false) e o formador.
      const u = await supabase
        .from("users")
        .insert(
          withDbDefaults({
            ...userPayload,
            tenantId: args.tenantId,
            role: "TRAINER",
            isActive: false,
            // placeholder: autenticação real é gerida pelo Supabase Auth
            passwordHash: "supabase_auth_managed",
          })
        )
        .select("id")
        .single()
      if (u.error) throw u.error
      const t = await supabase.from("trainers").insert(
        withId({
          ...trainerPayload,
          tenantId: args.tenantId,
          userId: u.data.id as string,
        })
      )
      if (t.error) throw t.error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainers"] })
    },
  })
}

/** Aprova o formador: users.isActive PENDENTE > ATIVO. */
export function useApproveTrainer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("users")
        .update({ isActive: true })
        .eq("id", userId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainers"] })
    },
  })
}

export function useDeleteTrainer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trainers").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trainers"] })
    },
  })
}
