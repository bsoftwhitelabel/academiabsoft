import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { withDbDefaults, newId } from "@/lib/db-helpers"
import type {
  TrainingAction,
  TrainingSession,
  Enrollment,
} from "@/types/domain"

export interface ActionFilters {
  clientOrgId?: string
  status?: string
  from?: string
  to?: string
  trainerId?: string
}

// Shape com embeds PostgREST para a listagem.
export interface TrainingActionRow extends TrainingAction {
  courses: { name: string; durationHours: number | null } | null
  client_orgs: { name: string } | null
  training_action_trainers: {
    trainerId: string
    role: string | null
    trainers: { users: { firstName: string | null; lastName: string | null } | null } | null
  }[]
}

const LIST_SELECT =
  "*,courses(name,durationHours),client_orgs(name)," +
  "training_action_trainers(trainerId,role,trainers(users(firstName,lastName)))"

export function useTrainingActions(filters: ActionFilters) {
  return useQuery({
    queryKey: ["training_actions", filters],
    queryFn: async (): Promise<TrainingActionRow[]> => {
      let q = supabase
        .from("training_actions")
        .select(LIST_SELECT)
        .order("startDate", { ascending: false })
        .limit(500)
      if (filters.clientOrgId) q = q.eq("clientOrgId", filters.clientOrgId)
      if (filters.status) q = q.eq("status", filters.status)
      if (filters.from) q = q.gte("startDate", filters.from)
      if (filters.to) q = q.lte("startDate", filters.to)
      const { data, error } = await q
      if (error) throw error
      let rows = (data ?? []) as unknown as TrainingActionRow[]
      if (filters.trainerId) {
        rows = rows.filter((r) =>
          r.training_action_trainers?.some(
            (t) => t.trainerId === filters.trainerId
          )
        )
      }
      return rows
    },
  })
}

export function useTrainingAction(id: string | undefined) {
  return useQuery({
    queryKey: ["training_action", id],
    enabled: !!id,
    queryFn: async (): Promise<TrainingActionRow | null> => {
      const { data, error } = await supabase
        .from("training_actions")
        .select(LIST_SELECT)
        .eq("id", id as string)
        .maybeSingle()
      if (error) throw error
      return (data as unknown as TrainingActionRow) ?? null
    },
  })
}

export interface ActionInput {
  courseId: string
  clientOrgId: string | null
  planId: string | null
  contractId: string
  actionCode: string | null
  actionNumber: number | null
  startDate: string
  endDate: string
  format: string
  roomId: string | null
  maxTrainees: number | null
  minTrainees: number | null
  entidadeFormadora: string | null
  iniciativaFormacao: string | null
  tipologiaHorario: string | null
  localFormacao: string | null
}

export interface SessionDraft {
  courseModuleId: string | null
  sessionType: string | null
  sessionDate: string
  startTime: string
  endTime: string
  durationHours: number
  trainerId: string | null
  roomId?: string | null
}

export function useUpsertTrainingAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id?: string
      tenantId: string
      input: ActionInput
      sessions?: SessionDraft[]
    }) => {
      let actionId = args.id
      if (args.id) {
        const { error } = await supabase
          .from("training_actions")
          .update(args.input)
          .eq("id", args.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from("training_actions")
          .insert(
            withDbDefaults({ ...args.input, tenantId: args.tenantId })
          )
          .select("id")
          .single()
        if (error) throw error
        actionId = data.id as string
      }
      // Sessões só na criação (cronograma inicial).
      if (!args.id && actionId && args.sessions?.length) {
        const rows = args.sessions.map((s) =>
          withDbDefaults({
            trainingActionId: actionId as string,
            trainerId: s.trainerId,
            courseModuleId: s.courseModuleId,
            sessionType: s.sessionType,
            sessionDate: s.sessionDate,
            startTime: s.startTime,
            endTime: s.endTime,
            durationHours: s.durationHours,
          })
        )
        const { error } = await supabase
          .from("training_sessions")
          .insert(rows)
        if (error) throw error
      }
      return actionId
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training_action"] }),
  })
}

export function useDeleteTrainingAction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("training_actions")
        .delete()
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["training_action"] }),
  })
}

// ---- Sessões ----
export function useActionSessions(actionId: string | undefined) {
  return useQuery({
    queryKey: ["training_sessions", actionId],
    enabled: !!actionId,
    queryFn: async () => {
      // moduleId removido na migration v3: embed simples (1 só FK).
      const { data, error } = await supabase
        .from("training_sessions")
        .select("*,course_modules(name)")
        .eq("trainingActionId", actionId as string)
        .order("sessionDate")
      if (error) throw error
      return (data ?? []) as unknown as (TrainingSession & {
        course_modules: { name: string } | null
      })[]
    },
  })
}

export interface SessionInput {
  sessionDate: string
  startTime: string
  endTime: string
  durationHours: number
  trainerId: string | null
  courseModuleId: string | null
  sessionType: string | null
}

export function useUpsertSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id?: string
      trainingActionId: string
      input: SessionInput
    }) => {
      if (args.id) {
        const { error } = await supabase
          .from("training_sessions")
          .update(args.input)
          .eq("id", args.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from("training_sessions")
          .insert(
            withDbDefaults({
              ...args.input,
              trainingActionId: args.trainingActionId,
            })
          )
        if (error) throw error
      }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["training_sessions"] }),
  })
}

export function useDeleteSession() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("training_sessions")
        .delete()
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["training_sessions"] }),
  })
}

// ---- Inscrições (enrollments) ----
export function useActionEnrollments(actionId: string | undefined) {
  return useQuery({
    queryKey: ["enrollments", actionId],
    enabled: !!actionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select("*,trainees(firstName,lastName,email)")
        .eq("trainingActionId", actionId as string)
      if (error) throw error
      return (data ?? []) as unknown as (Enrollment & {
        trainees: {
          firstName: string | null
          lastName: string | null
          email: string | null
        } | null
      })[]
    },
  })
}

export function useAddEnrollment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      trainingActionId: string
      traineeId: string
    }) => {
      // enrollments não tem updatedAt; status é enum EnrollmentStatus (v3).
      const { error } = await supabase.from("enrollments").insert({
        id: newId(),
        trainingActionId: args.trainingActionId,
        traineeId: args.traineeId,
        status: "PENDING",
        enrolledAt: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["enrollments"] }),
  })
}

export function useUpdateEnrollmentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; status: string }) => {
      const { error } = await supabase
        .from("enrollments")
        .update({ status: args.status })
        .eq("id", args.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["enrollments"] }),
  })
}

export function useDeleteEnrollment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("enrollments")
        .delete()
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["enrollments"] }),
  })
}
