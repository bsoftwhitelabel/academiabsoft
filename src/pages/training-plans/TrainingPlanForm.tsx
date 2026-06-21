import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { useDefaultTenantId } from "@/hooks/useDefaultTenant"
import { useTenantStore } from "@/stores/tenant.store"
import { useUpsertTrainingPlan } from "./useTrainingPlans"
import { CurrencyInput } from "./CurrencyInput"

const schema = z
  .object({
    name: z.string().min(1, "Nome obrigatório"),
    year: z.coerce
      .number({ message: "Ano numérico obrigatório" })
      .int()
      .min(2000)
      .max(2100),
    startDate: z.string().optional().or(z.literal("")),
    endDate: z.string().optional().or(z.literal("")),
    budget: z.coerce.number().nonnegative("Orçamento >= 0").nullable().optional(),
    isInternal: z.boolean(),
  })
  .refine(
    (v) => {
      if (v.startDate && v.endDate) return v.startDate <= v.endDate
      return true
    },
    { message: "Data fim tem de ser >= data início", path: ["endDate"] }
  )

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TrainingPlanForm({ open, onOpenChange }: Props) {
  const userQ = useCurrentUser()
  const defaultTenant = useDefaultTenantId()
  const tenant = useTenantStore((s) => s.tenant)
  const entityName = tenant?.name?.trim() || "tua entidade"
  const upsert = useUpsertTrainingPlan()

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      year: new Date().getFullYear(),
      startDate: "",
      endDate: "",
      budget: null,
      isInternal: false,
    },
  })

  useEffect(() => {
    if (open) form.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const isInternal = form.watch("isInternal")
  const budget = form.watch("budget")
  const budgetNum =
    typeof budget === "number"
      ? budget
      : budget == null || budget === ""
        ? null
        : Number(budget)

  async function onSubmit(values: FormValues) {
    const tenantId = userQ.data?.tenantId ?? defaultTenant.data
    if (!tenantId) {
      toast.error("Sem tenant resolvido para criar o plano")
      return
    }
    try {
      await upsert.mutateAsync({
        tenantId,
        input: {
          name: values.name,
          year: values.year,
          startDate: values.startDate
            ? new Date(values.startDate).toISOString()
            : null,
          endDate: values.endDate
            ? new Date(values.endDate).toISOString()
            : null,
          isInternal: values.isInternal,
          budget: values.budget ?? null,
          status: "DRAFT",
        },
      })
      toast.success("Plano criado")
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gravar")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Plano de Formação</DialogTitle>
          <DialogDescription>
            Define o âmbito, datas e orçamento do plano. Podes editar tudo depois
            de criar.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Plano</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Ex: Plano 2026 — Decathlon"
            />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Ano</Label>
              <Input
                id="year"
                type="number"
                inputMode="numeric"
                {...form.register("year")}
              />
              {form.formState.errors.year && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.year.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Orçamento Estimado</Label>
              <CurrencyInput
                id="budget"
                value={budgetNum}
                onValueChange={(n) =>
                  form.setValue("budget", n, { shouldValidate: true })
                }
              />
              {form.formState.errors.budget && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.budget.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de início</Label>
              <Input id="startDate" type="date" {...form.register("startDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data de fim</Label>
              <Input id="endDate" type="date" {...form.register("endDate")} />
              {form.formState.errors.endDate && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <label className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3 cursor-pointer">
            <Checkbox
              id="isInternal"
              checked={isInternal}
              onCheckedChange={(v) => form.setValue("isInternal", v === true)}
            />
            <div>
              <p className="text-sm font-medium text-foreground">Plano Interno</p>
              <p className="text-xs text-muted-foreground">
                Marca quando o plano é executado pelos colaboradores da{" "}
                {entityName}, e não para empresas clientes.
              </p>
            </div>
          </label>

          <div className="flex items-start gap-2 rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              O plano é criado em estado <strong>Rascunho</strong>. Podes
              publicá-lo ou enviá-lo para revisão na página de edição.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
