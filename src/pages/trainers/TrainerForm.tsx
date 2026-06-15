import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"
import { FormModal } from "@/components/forms/FormModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useDefaultTenantId } from "@/hooks/useDefaultTenant"
import {
  useUpsertTrainer,
  useApproveTrainer,
  trainerApprovalStatus,
} from "./useTrainers"
import type { TrainerWithUser } from "@/types/domain"

const schema = z.object({
  firstName: z.string().min(1, "Nome obrigatório"),
  lastName: z.string().min(1, "Apelido obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().nullable(),
  ccpNumber: z.string().min(1, "CCP/CAP obrigatório (exigência DGERT)"),
  isExternal: z.boolean(),
  eTrainer: z.boolean(),
  preferredSchedule: z.string().nullable(),
  yearsExperiencePresential: z.coerce.number().int().min(0),
  yearsExperienceDistance: z.coerce.number().int().min(0),
  vatRate: z.coerce.number().min(0).max(100).nullable(),
  regions: z.string().nullable(),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  trainer: TrainerWithUser | null
}

export function TrainerForm({ open, onOpenChange, trainer }: Props) {
  const tenant = useDefaultTenantId()
  const upsert = useUpsertTrainer()
  const approve = useApproveTrainer()

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    values: {
      firstName: trainer?.users?.firstName ?? "",
      lastName: trainer?.users?.lastName ?? "",
      email: trainer?.users?.email ?? "",
      phone: trainer?.users?.phone ?? null,
      ccpNumber: trainer?.ccpNumber ?? "",
      isExternal: trainer?.isExternal ?? false,
      eTrainer: trainer?.eTrainer ?? false,
      preferredSchedule: trainer?.preferredSchedule ?? null,
      yearsExperiencePresential: trainer?.yearsExperiencePresential ?? 0,
      yearsExperienceDistance: trainer?.yearsExperienceDistance ?? 0,
      vatRate: trainer?.vatRate ?? null,
      regions: trainer?.regions?.join(", ") ?? null,
    },
  })

  const isPending = trainer && trainerApprovalStatus(trainer) === "PENDENTE"

  async function onSubmit(values: FormValues) {
    const tenantId = trainer?.tenantId ?? tenant.data
    if (!tenantId) {
      toast.error("Sem tenant resolvido para criar o formador")
      return
    }
    const regions =
      values.regions && values.regions.trim()
        ? values.regions
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean)
        : null
    try {
      await upsert.mutateAsync({
        id: trainer?.id,
        userId: trainer?.userId,
        tenantId,
        input: {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone || null,
          ccpNumber: values.ccpNumber,
          isExternal: values.isExternal,
          eTrainer: values.eTrainer,
          preferredSchedule: values.preferredSchedule || null,
          yearsExperiencePresential: values.yearsExperiencePresential,
          yearsExperienceDistance: values.yearsExperienceDistance,
          vatRate: values.vatRate,
          regions,
        },
      })
      toast.success(trainer ? "Formador atualizado" : "Formador criado")
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gravar")
    }
  }

  async function handleApprove() {
    if (!trainer?.userId) return
    try {
      await approve.mutateAsync(trainer.userId)
      toast.success("Formador aprovado")
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao aprovar")
    }
  }

  const err = form.formState.errors

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={trainer ? "Editar Formador" : "Novo Formador"}
      description="Dados pessoais, certificação CCP/CAP e disponibilidade. Novos formadores entram como PENDENTE até aprovação."
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-h-[70vh] space-y-5 overflow-y-auto pr-1"
      >
        {trainer && (
          <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Estado de aprovação:</span>
              <Badge variant={isPending ? "destructive" : "default"}>
                {trainerApprovalStatus(trainer)}
              </Badge>
            </div>
            {isPending && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleApprove}
                disabled={approve.isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {approve.isPending ? "A aprovar..." : "Aprovar"}
              </Button>
            )}
          </div>
        )}

        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Dados pessoais
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input id="firstName" {...form.register("firstName")} />
              {err.firstName && (
                <p className="text-xs text-destructive">
                  {err.firstName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apelido</Label>
              <Input id="lastName" {...form.register("lastName")} />
              {err.lastName && (
                <p className="text-xs text-destructive">
                  {err.lastName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {err.email && (
                <p className="text-xs text-destructive">{err.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...form.register("phone")} />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Certificação e tipo
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ccpNumber">Nº CCP/CAP</Label>
              <Input id="ccpNumber" {...form.register("ccpNumber")} />
              {err.ccpNumber && (
                <p className="text-xs text-destructive">
                  {err.ccpNumber.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatRate">Taxa IVA/IRS (%)</Label>
              <Input
                id="vatRate"
                type="number"
                step="0.01"
                {...form.register("vatRate")}
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isExternal"
                checked={form.watch("isExternal")}
                onCheckedChange={(v) =>
                  form.setValue("isExternal", v === true)
                }
              />
              <Label htmlFor="isExternal">Formador externo (bolsa)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="eTrainer"
                checked={form.watch("eTrainer")}
                onCheckedChange={(v) => form.setValue("eTrainer", v === true)}
              />
              <Label htmlFor="eTrainer">Habilitado e-learning</Label>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            Experiência e disponibilidade
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="yearsExperiencePresential">
                Anos experiência (presencial)
              </Label>
              <Input
                id="yearsExperiencePresential"
                type="number"
                {...form.register("yearsExperiencePresential")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearsExperienceDistance">
                Anos experiência (distância)
              </Label>
              <Input
                id="yearsExperienceDistance"
                type="number"
                {...form.register("yearsExperienceDistance")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredSchedule">Horário preferido</Label>
              <Input
                id="preferredSchedule"
                placeholder="Ex: Pós-laboral"
                {...form.register("preferredSchedule")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regions">Regiões (separadas por vírgula)</Label>
              <Input
                id="regions"
                placeholder="Porto, Lisboa"
                {...form.register("regions")}
              />
            </div>
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
