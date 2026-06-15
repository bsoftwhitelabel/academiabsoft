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
import { useTrainingAreas } from "@/hooks/useLookups"
import { useDefaultTenantId } from "@/hooks/useDefaultTenant"
import { newId } from "@/lib/db-helpers"
import { useUpsertCourse } from "./useCourses"
import type { Course } from "@/types/domain"

const NONE = "__none__"

// format = enum TrainingFormat (PRESENCIAL|ELEARNING). status = enum
// CourseStatus (DRAFT|PUBLISHED confirmados; default da BD = DRAFT).
// status é NOT NULL COM default: o hook omite quando vazio.
const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  code: z.string().nullable(),
  sigla: z.string().nullable(),
  durationHours: z.coerce.number().positive("Duração tem de ser > 0"),
  format: z.enum(["PRESENCIAL", "ELEARNING"]),
  areaId: z.string().nullable(),
  status: z.string().nullable(),
  shortDescription: z.string().nullable(),
})
type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: Course | null
}

export function CourseForm({ open, onOpenChange, course }: Props) {
  const tenant = useDefaultTenantId()
  const areas = useTrainingAreas()
  const upsert = useUpsertCourse()

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: course?.name ?? "",
      code: course?.code ?? null,
      sigla: course?.sigla ?? null,
      durationHours: course?.durationHours ?? 0,
      format: (course?.format as "PRESENCIAL" | "ELEARNING") ?? "PRESENCIAL",
      areaId: course?.areaId ?? null,
      status: course?.status ?? null,
      shortDescription: course?.shortDescription ?? null,
    },
  })

  async function onSubmit(values: FormValues) {
    const tenantId = course?.tenantId ?? tenant.data
    if (!tenantId) {
      toast.error("Sem tenant resolvido para criar o curso")
      return
    }
    // slug NOT NULL e provável UNIQUE: mantém o existente na edição,
    // gera a partir do nome + sufixo curto na criação.
    const slug =
      course?.slug ?? `${slugify(values.name)}-${newId().slice(-6)}`
    try {
      await upsert.mutateAsync({
        id: course?.id,
        tenantId,
        input: {
          name: values.name,
          slug,
          code: values.code || null,
          sigla: values.sigla || null,
          durationHours: values.durationHours,
          areaId: values.areaId || null,
          format: values.format,
          status: values.status || null,
          shortDescription: values.shortDescription || null,
        },
      })
      toast.success(course ? "Curso atualizado" : "Curso criado")
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
      title={course ? "Editar Curso" : "Novo Curso"}
      description="Curso é o referencial. A execução para um cliente é a Ação de Formação."
      className="max-w-2xl"
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" {...form.register("name")} />
          {err.name && (
            <p className="text-xs text-destructive">{err.name.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input id="code" {...form.register("code")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sigla">Sigla</Label>
            <Input id="sigla" {...form.register("sigla")} />
          </div>
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
            <Label>Formato</Label>
            <Select
              value={form.watch("format")}
              onValueChange={(v) =>
                form.setValue("format", v as "PRESENCIAL" | "ELEARNING")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                <SelectItem value="ELEARNING">E-learning</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Área de formação</Label>
            <Select
              value={form.watch("areaId") ?? NONE}
              onValueChange={(v) =>
                form.setValue("areaId", v === NONE ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sem área</SelectItem>
                {(areas.data ?? []).map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.citeCode ? `${a.citeCode} ${a.name}` : a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select
              value={form.watch("status") ?? NONE}
              onValueChange={(v) =>
                form.setValue("status", v === NONE ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sem estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Por defeito (DRAFT)</SelectItem>
                <SelectItem value="DRAFT">DRAFT</SelectItem>
                <SelectItem value="PUBLISHED">PUBLISHED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shortDescription">Descrição curta</Label>
          <Textarea
            id="shortDescription"
            {...form.register("shortDescription")}
          />
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
