import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { FormModal } from "@/components/forms/FormModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useClientOrgs } from "@/hooks/useLookups"
import { contractsCrud } from "./entities"
import type { Contract } from "@/types/domain"

const schema = z.object({
  clientOrgId: z.string().min(1, "Entidade cliente obrigatória"),
  startDate: z.string().min(1, "Data início obrigatória"),
  endDate: z.string().nullable(),
  value: z.coerce.number().nonnegative().nullable(),
  fileUrl: z.string().nullable(),
  description: z.string().nullable(),
})
type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : ""
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: Contract | null
}

export function ContractForm({ open, onOpenChange, row }: Props) {
  const upsert = contractsCrud.useUpsert()
  const orgs = useClientOrgs()

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    values: {
      clientOrgId: row?.clientOrgId ?? "",
      startDate: toDateInput(row?.startDate),
      endDate: toDateInput(row?.endDate) || null,
      value: row?.value ?? null,
      fileUrl: row?.fileUrl ?? null,
      description: row?.description ?? null,
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      await upsert.mutateAsync({
        id: row?.id,
        input: {
          clientOrgId: values.clientOrgId,
          startDate: new Date(values.startDate).toISOString(),
          endDate: values.endDate
            ? new Date(values.endDate).toISOString()
            : null,
          value: values.value,
          fileUrl: values.fileUrl,
          description: values.description,
        },
      })
      toast.success(row ? "Contrato atualizado" : "Contrato criado")
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
      title={row ? "Editar Contrato" : "Novo Contrato"}
      className="max-w-lg"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label>Entidade cliente</Label>
          <Select
            value={form.watch("clientOrgId")}
            onValueChange={(v) => form.setValue("clientOrgId", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a entidade" />
            </SelectTrigger>
            <SelectContent>
              {(orgs.data ?? []).map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {err.clientOrgId && (
            <p className="text-xs text-destructive">
              {err.clientOrgId.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Data início</Label>
            <Input
              id="startDate"
              type="date"
              {...form.register("startDate")}
            />
            {err.startDate && (
              <p className="text-xs text-destructive">
                {err.startDate.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Data fim</Label>
            <Input id="endDate" type="date" {...form.register("endDate")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="value">Valor</Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              {...form.register("value")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fileUrl">URL do ficheiro</Label>
            <Input id="fileUrl" {...form.register("fileUrl")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" {...form.register("description")} />
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
