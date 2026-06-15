import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { FormModal } from "@/components/forms/FormModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateQuestion,
  useUpdateQuestion,
} from "./useQuestionnaireMutations"
import type { QuestionnaireQuestion } from "@/types/domain"

const schema = z
  .object({
    text: z.string().min(1, "Texto obrigatório"),
    type: z.enum(["SCALE", "TEXT"]),
    scaleMin: z.coerce.number().int().min(0),
    scaleMax: z.coerce.number().int().min(0),
    isRequired: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.type === "SCALE") {
      if (v.scaleMin < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Min da escala tem de ser ≥ 1",
          path: ["scaleMin"],
        })
      }
      if (v.scaleMax <= v.scaleMin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Max tem de ser maior que Min",
          path: ["scaleMax"],
        })
      }
    }
  })

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  questionnaireId: string
  question: QuestionnaireQuestion | null
  nextOrder: number
}

export function QuestionForm({
  open,
  onOpenChange,
  questionnaireId,
  question,
  nextOrder,
}: Props) {
  const create = useCreateQuestion()
  const update = useUpdateQuestion()
  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    values: {
      text: question?.text ?? "",
      type: (question?.type as "SCALE" | "TEXT") ?? "SCALE",
      scaleMin: question?.scaleMin ?? 1,
      scaleMax: question?.scaleMax ?? 4,
      isRequired: question?.isRequired ?? true,
    },
  })

  const type = form.watch("type")
  const isPending = create.isPending || update.isPending

  async function onSubmit(values: FormValues) {
    // Para TEXT zeramos a escala (convenção).
    const payload = {
      text: values.text,
      type: values.type,
      scaleMin: values.type === "TEXT" ? 0 : values.scaleMin,
      scaleMax: values.type === "TEXT" ? 0 : values.scaleMax,
      isRequired: values.isRequired,
      order: question?.order ?? nextOrder,
    }
    try {
      if (question) {
        await update.mutateAsync({
          id: question.id,
          questionnaireId,
          input: payload,
        })
        toast.success("Pergunta atualizada")
      } else {
        await create.mutateAsync({
          questionnaireId,
          input: payload,
        })
        toast.success("Pergunta criada")
      }
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gravar")
    }
  }

  const err = form.formState.errors
  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={question ? "Editar Pergunta" : "Nova Pergunta"}
      className="max-w-lg"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="text">Texto da pergunta</Label>
          <Textarea
            id="text"
            rows={3}
            placeholder="Ex.: A duração da formação foi adequada?"
            {...form.register("text")}
          />
          {err.text && (
            <p className="text-xs text-destructive">{err.text.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            value={type}
            onValueChange={(v) =>
              form.setValue("type", v as "SCALE" | "TEXT", {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SCALE">Escala numérica</SelectItem>
              <SelectItem value="TEXT">Resposta aberta</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {type === "SCALE" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scaleMin">Min</Label>
              <Input
                id="scaleMin"
                type="number"
                {...form.register("scaleMin")}
              />
              {err.scaleMin && (
                <p className="text-xs text-destructive">
                  {err.scaleMin.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="scaleMax">Max</Label>
              <Input
                id="scaleMax"
                type="number"
                {...form.register("scaleMax")}
              />
              {err.scaleMax && (
                <p className="text-xs text-destructive">
                  {err.scaleMax.message}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Checkbox
            id="isRequired"
            checked={form.watch("isRequired")}
            onCheckedChange={(v) => form.setValue("isRequired", v === true)}
          />
          <Label htmlFor="isRequired" className="text-sm font-normal">
            Pergunta obrigatória
          </Label>
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "A gravar..." : "Gravar"}
          </Button>
        </div>
      </form>
    </FormModal>
  )
}
