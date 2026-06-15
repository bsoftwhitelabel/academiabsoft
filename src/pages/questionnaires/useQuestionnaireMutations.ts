import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { newId } from "@/lib/db-helpers"
import type {
  Questionnaire,
  QuestionnaireContext,
  QuestionnaireQuestion,
  QuestionnaireTargetRole,
  QuestionType,
  TrainingFormat,
} from "@/types/domain"

export interface QuestionnaireInput {
  name: string
  format: TrainingFormat
  targetRole: QuestionnaireTargetRole
  context: QuestionnaireContext
}

export interface QuestionInput {
  text: string
  type: QuestionType
  scaleMin: number
  scaleMax: number
  order: number
  isRequired: boolean
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ["questionnaires"] })
}

// questionnaires não tem default no id na BD (Prisma cuid client-side).
export function useCreateQuestionnaire() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      tenantId: string
      input: QuestionnaireInput
    }): Promise<Questionnaire> => {
      const row = { id: newId(), tenantId: args.tenantId, ...args.input }
      const { data, error } = await supabase
        .from("questionnaires")
        .insert(row)
        .select("*")
        .maybeSingle()
      if (error) throw error
      return data as Questionnaire
    },
    onSuccess: () => invalidateAll(qc),
  })
}

export function useUpdateQuestionnaire() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id: string
      input: Partial<QuestionnaireInput>
    }) => {
      const { error } = await supabase
        .from("questionnaires")
        .update(args.input)
        .eq("id", args.id)
      if (error) throw error
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["questionnaire", vars.id] })
      invalidateAll(qc)
    },
  })
}

export function useDeleteQuestionnaire() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      // Bloqueia se já houver respostas (integridade DGERT).
      const { count, error: cErr } = await supabase
        .from("questionnaire_responses")
        .select("id", { count: "exact", head: true })
        .eq("questionnaireId", id)
      if (cErr) throw cErr
      if ((count ?? 0) > 0) {
        throw new Error(
          `Tem ${count} resposta(s) associada(s); não pode ser apagado.`
        )
      }
      // Apaga primeiro as perguntas (sem ON DELETE CASCADE assumido).
      const { error: qErr } = await supabase
        .from("questionnaire_questions")
        .delete()
        .eq("questionnaireId", id)
      if (qErr) throw qErr
      const { error } = await supabase
        .from("questionnaires")
        .delete()
        .eq("id", id)
      if (error) throw error
    },
    onSuccess: () => invalidateAll(qc),
  })
}

export function useCloneQuestionnaire() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      sourceId: string
      tenantId: string
    }): Promise<Questionnaire> => {
      const { data: src, error: sErr } = await supabase
        .from("questionnaires")
        .select(
          `name,format,targetRole,context,questionnaire_questions(text,type,scaleMin,scaleMax,"order",isRequired)`
        )
        .eq("id", args.sourceId)
        .maybeSingle()
      if (sErr) throw sErr
      if (!src) throw new Error("Questionário original não encontrado")
      type SrcShape = QuestionnaireInput & {
        questionnaire_questions: QuestionInput[]
      }
      const s = src as unknown as SrcShape
      const newQId = newId()
      const newName = `${s.name} (cópia)`
      const { error: iErr } = await supabase.from("questionnaires").insert({
        id: newQId,
        tenantId: args.tenantId,
        name: newName,
        format: s.format,
        targetRole: s.targetRole,
        context: s.context,
      })
      if (iErr) throw iErr
      const questions = (s.questionnaire_questions ?? []).map((q) => ({
        id: newId(),
        questionnaireId: newQId,
        text: q.text,
        type: q.type,
        scaleMin: q.scaleMin,
        scaleMax: q.scaleMax,
        order: q.order,
        isRequired: q.isRequired,
      }))
      if (questions.length > 0) {
        const { error: qErr } = await supabase
          .from("questionnaire_questions")
          .insert(questions)
        if (qErr) throw qErr
      }
      return {
        id: newQId,
        tenantId: args.tenantId,
        name: newName,
        format: s.format,
        targetRole: s.targetRole,
        context: s.context,
      }
    },
    onSuccess: () => invalidateAll(qc),
  })
}

export function useCreateQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      questionnaireId: string
      input: QuestionInput
    }): Promise<QuestionnaireQuestion> => {
      const row = {
        id: newId(),
        questionnaireId: args.questionnaireId,
        ...args.input,
      }
      const { data, error } = await supabase
        .from("questionnaire_questions")
        .insert(row)
        .select("*")
        .maybeSingle()
      if (error) throw error
      return data as QuestionnaireQuestion
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({
        queryKey: ["questionnaire", vars.questionnaireId],
      }),
  })
}

export function useUpdateQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id: string
      questionnaireId: string
      input: Partial<QuestionInput>
    }) => {
      const { error } = await supabase
        .from("questionnaire_questions")
        .update(args.input)
        .eq("id", args.id)
      if (error) throw error
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({
        queryKey: ["questionnaire", vars.questionnaireId],
      }),
  })
}

export function useDeleteQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; questionnaireId: string }) => {
      const { error } = await supabase
        .from("questionnaire_questions")
        .delete()
        .eq("id", args.id)
      if (error) throw error
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({
        queryKey: ["questionnaire", vars.questionnaireId],
      }),
  })
}

/** Atualiza coluna order 1..N (drag reorder). */
export function useReorderQuestions() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      questionnaireId: string
      orderedIds: string[]
    }) => {
      for (let i = 0; i < args.orderedIds.length; i++) {
        const { error } = await supabase
          .from("questionnaire_questions")
          .update({ order: i + 1 })
          .eq("id", args.orderedIds[i])
        if (error) throw error
      }
    },
    onSuccess: (_d, vars) =>
      qc.invalidateQueries({
        queryKey: ["questionnaire", vars.questionnaireId],
      }),
  })
}
