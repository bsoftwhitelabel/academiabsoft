import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUpdateQuestionnaire } from "./useQuestionnaireMutations"
import type { Questionnaire } from "@/types/domain"

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  targetRole: z.enum(["TRAINEE", "TRAINER"]),
  context: z.enum(["ACTION", "SESSION"]),
  format: z.enum(["PRESENCIAL", "ELEARNING"]),
})
type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  questionnaire: Questionnaire
}

export function QuestionnaireForm({ open, onOpenChange, questionnaire }: Props) {
  const update = useUpdateQuestionnaire()
  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: questionnaire.name,
      targetRole: questionnaire.targetRole,
      context: questionnaire.context,
      format: questionnaire.format,
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      await update.mutateAsync({ id: questionnaire.id, input: values })
      toast.success("Questionário atualizado")
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gravar")
    }
  }

  const err = form.formState.errors
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Editar Questionário</SheetTitle>
          <SheetDescription>
            Altera os metadados base. As perguntas geres na lista por baixo.
          </SheetDescription>
        </SheetHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 pt-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...form.register("name")} />
            {err.name && (
              <p className="text-xs text-destructive">{err.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Destinatário</Label>
            <Select
              value={form.watch("targetRole")}
              onValueChange={(v) =>
                form.setValue("targetRole", v as FormValues["targetRole"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRAINEE">Formando</SelectItem>
                <SelectItem value="TRAINER">Formador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Contexto</Label>
            <Select
              value={form.watch("context")}
              onValueChange={(v) =>
                form.setValue("context", v as FormValues["context"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTION">Acção</SelectItem>
                <SelectItem value="SESSION">Sessão</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Formato</Label>
            <Select
              value={form.watch("format")}
              onValueChange={(v) =>
                form.setValue("format", v as FormValues["format"], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                <SelectItem value="ELEARNING">E-Learning</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? "A gravar..." : "Gravar"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
