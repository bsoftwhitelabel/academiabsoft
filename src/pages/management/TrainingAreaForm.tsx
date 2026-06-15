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
import { trainingAreasCrud } from "./entities"
import type { TrainingArea } from "@/types/domain"

const NONE = "__none__"

const schema = z.object({
  citeCode: z.string().nullable(),
  name: z.string().min(1, "Nome obrigatório"),
  description: z.string().nullable(),
  parentId: z.string().nullable(),
  catalogOrder: z.coerce.number().int().nullable(),
  isActive: z.boolean(),
  catalogVisible: z.boolean(),
})
type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  row: TrainingArea | null
}

export function TrainingAreaForm({ open, onOpenChange, row }: Props) {
  const upsert = trainingAreasCrud.useUpsert()
  const list = trainingAreasCrud.useList()

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    values: {
      citeCode: row?.citeCode ?? null,
      name: row?.name ?? "",
      description: row?.description ?? null,
      parentId: row?.parentId ?? null,
      catalogOrder: row?.catalogOrder ?? null,
      isActive: row?.isActive ?? true,
      catalogVisible: row?.catalogVisible ?? false,
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      await upsert.mutateAsync({ id: row?.id, input: values })
      toast.success(row ? "Área atualizada" : "Área criada")
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gravar")
    }
  }

  const parents = (list.data ?? []).filter((a) => a.id !== row?.id)
  const err = form.formState.errors

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={row ? "Editar Área de Formação" : "Nova Área de Formação"}
      className="max-w-xl"
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
            <Label htmlFor="citeCode">Código CITE</Label>
            <Input id="citeCode" {...form.register("citeCode")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" {...form.register("description")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Área pai</Label>
            <Select
              value={form.watch("parentId") ?? NONE}
              onValueChange={(v) =>
                form.setValue("parentId", v === NONE ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem área pai" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sem área pai</SelectItem>
                {parents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.citeCode ? `${a.citeCode} ${a.name}` : a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="catalogOrder">Ordem no catálogo</Label>
            <Input
              id="catalogOrder"
              type="number"
              {...form.register("catalogOrder")}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="isActive"
              checked={form.watch("isActive")}
              onCheckedChange={(v) => form.setValue("isActive", v === true)}
            />
            <Label htmlFor="isActive">Ativa</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="catalogVisible"
              checked={form.watch("catalogVisible")}
              onCheckedChange={(v) =>
                form.setValue("catalogVisible", v === true)
              }
            />
            <Label htmlFor="catalogVisible">Visível no catálogo</Label>
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
