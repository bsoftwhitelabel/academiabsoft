import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { FormModal } from "@/components/forms/FormModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useDefaultTenantId } from "@/hooks/useDefaultTenant"
import { useUpsertTrainingPlan } from "./useTrainingPlans"
import type { TrainingPlan } from "@/types/domain"

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  year: z.coerce.number().int().min(2000).max(2100),
  startDate: z.string().min(1, "Data início obrigatória"),
  endDate: z.string().min(1, "Data fim obrigatória"),
  isInternal: z.boolean(),
  budget: z.coerce.number().nonnegative().nullable(),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : ""
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: TrainingPlan | null
}

export function TrainingPlanForm({ open, onOpenChange, plan }: Props) {
  const tenant = useDefaultTenantId()
  const upsert = useUpsertTrainingPlan()

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: plan?.name ?? "",
      year: plan?.year ?? new Date().getFullYear(),
      startDate: toDateInput(plan?.startDate ?? null),
      endDate: toDateInput(plan?.endDate ?? null),
      isInternal: plan?.isInternal ?? false,
      budget: plan?.budget ?? null,
    },
  })

  async function onSubmit(values: FormValues) {
    const tenantId = plan?.tenantId ?? tenant.data
    if (!tenantId) {
      toast.error("Sem tenant resolvido para criar o plano")
      return
    }
    try {
      await upsert.mutateAsync({
        id: plan?.id,
        tenantId,
        input: {
          name: values.name,
          year: values.year,
          startDate: new Date(values.startDate).toISOString(),
          endDate: new Date(values.endDate).toISOString(),
          isInternal: values.isInternal,
          budget: values.budget,
          status: plan?.status ?? "DRAFT",
        },
      })
      toast.success(plan ? "Plano atualizado" : "Plano criado")
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gravar")
    }
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={plan ? "Editar Plano de Formação" : "Novo Plano de Formação"}
      className="max-w-lg"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="year">Ano</Label>
            <Input id="year" type="number" {...form.register("year")} />
          </div>
          <div className="flex items-end gap-2 pb-2">
            <Checkbox
              id="isInternal"
              checked={form.watch("isInternal")}
              onCheckedChange={(v) =>
                form.setValue("isInternal", v === true)
              }
            />
            <Label htmlFor="isInternal">Plano interno</Label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Data início</Label>
            <Input id="startDate" type="date" {...form.register("startDate")} />
            {form.formState.errors.startDate && (
              <p className="text-xs text-destructive">
                {form.formState.errors.startDate.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Data fim</Label>
            <Input id="endDate" type="date" {...form.register("endDate")} />
            {form.formState.errors.endDate && (
              <p className="text-xs text-destructive">
                {form.formState.errors.endDate.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget">Orçamento</Label>
          <Input
            id="budget"
            type="number"
            step="0.01"
            {...form.register("budget")}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
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
