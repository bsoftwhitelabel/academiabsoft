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
import { useDefaultTenantId } from "@/hooks/useDefaultTenant"
import { roomsCrud } from "./entities"
import type { Room } from "@/types/domain"

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  capacity: z.coerce.number().int().min(0).nullable(),
  address: z.string().nullable(),
  city: z.string().nullable(),
  equipment: z.string().nullable(),
  isActive: z.boolean(),
})
type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: Room | null
}

export function RoomForm({ open, onOpenChange, row }: Props) {
  const tenant = useDefaultTenantId()
  const upsert = roomsCrud.useUpsert()

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: row?.name ?? "",
      capacity: row?.capacity ?? null,
      address: row?.address ?? null,
      city: row?.city ?? null,
      equipment: row?.equipment ?? null,
      isActive: row?.isActive ?? true,
    },
  })

  async function onSubmit(values: FormValues) {
    const tenantId = row?.tenantId ?? tenant.data ?? undefined
    try {
      await upsert.mutateAsync({ id: row?.id, tenantId, input: values })
      toast.success(row ? "Sala atualizada" : "Sala criada")
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
      title={row ? "Editar Sala" : "Nova Sala"}
      className="max-w-lg"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" {...form.register("name")} />
            {err.name && (
              <p className="text-xs text-destructive">{err.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacidade</Label>
            <Input
              id="capacity"
              type="number"
              {...form.register("capacity")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Morada</Label>
            <Input id="address" {...form.register("address")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" {...form.register("city")} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="equipment">Equipamento</Label>
          <Textarea
            id="equipment"
            placeholder="Projetor, quadro, computadores..."
            {...form.register("equipment")}
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="isActive"
            checked={form.watch("isActive")}
            onCheckedChange={(v) => form.setValue("isActive", v === true)}
          />
          <Label htmlFor="isActive">Ativa</Label>
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
