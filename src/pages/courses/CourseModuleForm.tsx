import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { FormModal } from "@/components/forms/FormModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUpsertCourseModule } from "./useCourseModules"
import type { CourseModule } from "@/types/domain"

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  description: z.string().nullable(),
  durationHours: z.coerce.number().positive("Duração tem de ser > 0"),
  order: z.coerce.number().int().min(1),
})
type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  courseId: string
  module: CourseModule | null
  nextOrder: number
}

export function CourseModuleForm({
  open,
  onOpenChange,
  courseId,
  module,
  nextOrder,
}: Props) {
  const upsert = useUpsertCourseModule()
  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: module?.name ?? "",
      description: module?.description ?? null,
      durationHours: module?.durationHours ?? 0,
      order: module?.order ?? nextOrder,
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      await upsert.mutateAsync({
        id: module?.id,
        courseId,
        input: {
          name: values.name,
          description: values.description || null,
          durationHours: values.durationHours,
          order: values.order,
        },
      })
      toast.success(module ? "Módulo atualizado" : "Módulo criado")
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
      title={module ? "Editar Módulo" : "Novo Módulo"}
      className="max-w-lg"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" {...form.register("name")} />
          {err.name && (
            <p className="text-xs text-destructive">{err.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" {...form.register("description")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="durationHours">Duração (horas)</Label>
            <Input
              id="durationHours"
              type="number"
              step="0.5"
              {...form.register("durationHours")}
            />
            {err.durationHours && (
              <p className="text-xs text-destructive">
                {err.durationHours.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="order">Ordem</Label>
            <Input id="order" type="number" {...form.register("order")} />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={upsert.isPending}>
            {upsert.isPending ? "A gravar..." : "Gravar"}
          </Button>
        </div>
      </form>
    </FormModal>
  )
}
