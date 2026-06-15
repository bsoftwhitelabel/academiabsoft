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
import { clientOrgsCrud } from "./entities"
import type { ClientOrg } from "@/types/domain"

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  code: z.string().nullable(),
  nif: z.string().nullable(),
  email: z.string().email("Email inválido").or(z.literal("")).nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  address: z.string().nullable(),
  postalCode: z.string().nullable(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  isActive: z.boolean(),
})
type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: ClientOrg | null
}

export function ClientOrgForm({ open, onOpenChange, row }: Props) {
  const tenant = useDefaultTenantId()
  const upsert = clientOrgsCrud.useUpsert()

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: row?.name ?? "",
      code: row?.code ?? null,
      nif: row?.nif ?? null,
      email: row?.email ?? null,
      phone: row?.phone ?? null,
      website: row?.website ?? null,
      address: row?.address ?? null,
      postalCode: row?.postalCode ?? null,
      city: row?.city ?? null,
      country: row?.country ?? "PT",
      isActive: row?.isActive ?? true,
    },
  })

  async function onSubmit(values: FormValues) {
    const tenantId = row?.tenantId ?? tenant.data ?? undefined
    try {
      await upsert.mutateAsync({
        id: row?.id,
        tenantId,
        input: { ...values, email: values.email || null },
      })
      toast.success(row ? "Entidade atualizada" : "Entidade criada")
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gravar")
    }
  }

  const err = form.formState.errors
  function f(name: keyof FormInput, label: string, type = "text") {
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Input id={name} type={type} {...form.register(name)} />
        {err[name] && (
          <p className="text-xs text-destructive">
            {String(err[name]?.message)}
          </p>
        )}
      </div>
    )
  }

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={row ? "Editar Entidade Cliente" : "Nova Entidade Cliente"}
      className="max-w-2xl"
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-h-[65vh] space-y-4 overflow-y-auto pr-1"
      >
        <div className="grid grid-cols-2 gap-4">
          {f("name", "Nome")}
          {f("code", "Código")}
          {f("nif", "NIF")}
          {f("email", "Email", "email")}
          {f("phone", "Telefone")}
          {f("website", "Website")}
          {f("address", "Morada")}
          {f("postalCode", "Código postal")}
          {f("city", "Cidade")}
          {f("country", "País")}
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
