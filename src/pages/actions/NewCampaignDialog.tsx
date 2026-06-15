import { useMemo, useState } from "react"
import { toast } from "sonner"
import { useQuery } from "@tanstack/react-query"
import { FormModal } from "@/components/forms/FormModal"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { supabase } from "@/lib/supabase"
import { useQuestionnaires } from "@/pages/questionnaires/useQuestionnaires"
import { useCreateCampaign } from "./useCampaignMutations"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  trainingActionId: string
}

interface Eligibles {
  trainees: number
  trainers: number
}

function useActionEligibles(trainingActionId: string | undefined) {
  return useQuery({
    queryKey: ["action", trainingActionId, "eligibles"],
    enabled: !!trainingActionId,
    queryFn: async (): Promise<Eligibles> => {
      const [enr, tats] = await Promise.all([
        supabase
          .from("enrollments")
          .select("traineeId", { count: "exact", head: false })
          .eq("trainingActionId", trainingActionId as string)
          .neq("status", "CANCELLED"),
        supabase
          .from("training_action_trainers")
          .select("trainerId", { count: "exact", head: false })
          .eq("trainingActionId", trainingActionId as string),
      ])
      if (enr.error) throw enr.error
      if (tats.error) throw tats.error
      const uniqTrainees = new Set(
        (enr.data ?? []).map((x) => x.traineeId).filter(Boolean)
      )
      const uniqTrainers = new Set(
        (tats.data ?? []).map((x) => x.trainerId).filter(Boolean)
      )
      return { trainees: uniqTrainees.size, trainers: uniqTrainers.size }
    },
  })
}

export function NewCampaignDialog({
  open,
  onOpenChange,
  trainingActionId,
}: Props) {
  const list = useQuestionnaires({ context: "ACTION" })
  const eligibles = useActionEligibles(trainingActionId)
  const create = useCreateCampaign()
  const [questionnaireId, setQuestionnaireId] = useState<string>("")

  const selected = useMemo(
    () => list.data?.find((q) => q.id === questionnaireId) ?? null,
    [list.data, questionnaireId]
  )
  const eligibleCount = selected
    ? selected.targetRole === "TRAINEE"
      ? (eligibles.data?.trainees ?? 0)
      : (eligibles.data?.trainers ?? 0)
    : 0
  const eligibleLabel = selected
    ? selected.targetRole === "TRAINEE"
      ? "formandos elegíveis"
      : "formadores elegíveis"
    : ""

  async function handleCreate() {
    if (!questionnaireId) return
    try {
      const res = await create.mutateAsync({
        trainingActionId,
        questionnaireId,
      })
      const parts = [`Campanha criada: ${res.created} novos respondentes`]
      if (res.skipped > 0) parts.push(`${res.skipped} já existiam`)
      toast.success(parts.join(" · "))
      onOpenChange(false)
      setQuestionnaireId("")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar campanha")
    }
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Nova Campanha de Avaliação"
      description="Aplica um questionário-template a esta acção e gera links únicos."
      className="max-w-lg"
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Questionário</Label>
          <Select value={questionnaireId} onValueChange={setQuestionnaireId}>
            <SelectTrigger>
              <SelectValue
                placeholder={
                  list.isLoading
                    ? "A carregar..."
                    : "Escolhe um questionário..."
                }
              />
            </SelectTrigger>
            <SelectContent>
              {(list.data ?? []).map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  {q.name} · {q.targetRole === "TRAINEE" ? "Formando" : "Formador"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Só são listados questionários com contexto "Acção". Sessão fica para fase futura.
          </p>
        </div>

        {selected && (
          <div className="space-y-2 rounded-md border bg-muted/40 p-3 text-sm">
            <p className="font-medium">Esta campanha vai criar links para:</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {selected.targetRole === "TRAINEE" ? "Formandos" : "Formadores"}
              </Badge>
              <span>
                {eligibles.isLoading
                  ? "a contar..."
                  : `${eligibleCount} ${eligibleLabel}`}
              </span>
            </div>
            {selected.targetRole === "TRAINEE" && eligibleCount === 0 && (
              <p className="text-xs text-amber-700">
                Não há inscrições activas. Inscreve formandos primeiro.
              </p>
            )}
            {selected.targetRole === "TRAINER" && eligibleCount === 0 && (
              <p className="text-xs text-amber-700">
                Não há formadores associados a esta acção.
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Se a campanha já existe, só são criados links para quem ainda não tinha (idempotente).
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={
              !questionnaireId ||
              create.isPending ||
              eligibleCount === 0
            }
            onClick={handleCreate}
          >
            {create.isPending ? "A criar..." : "Criar Campanha"}
          </Button>
        </div>
      </div>
    </FormModal>
  )
}
