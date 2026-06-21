import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { ChevronDown, Lightbulb } from "lucide-react"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { useTrainingAreas } from "@/hooks/useLookups"
import { useDefaultTenantId } from "@/hooks/useDefaultTenant"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { newId } from "@/lib/db-helpers"
import { useUpsertCourse } from "./useCourses"
import { useCourseModules } from "./useCourseModules"
import type { Course } from "@/types/domain"

const SHORT_DESC_MAX = 500

// status é o enum real CourseStatus (DRAFT, PUBLISHED, FEATURED, ARCHIVED).
// Default da BD = DRAFT. O hook omite quando vazio.
const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  code: z.string().min(1, "Código obrigatório"),
  sigla: z.string().nullable().optional(),
  durationHours: z.coerce
    .number({ message: "Duração numérica obrigatória" })
    .nonnegative("Duração tem de ser >= 0"),
  format: z.enum(["PRESENCIAL", "ELEARNING", "BLENDED"]),
  areaId: z.string().nullable().optional(),
  shortDescription: z
    .string()
    .max(SHORT_DESC_MAX, `Máximo ${SHORT_DESC_MAX} caracteres`)
    .nullable()
    .optional(),
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

// Mapeia uma row de Course para o shape do form. Usado em `values` (não
// em defaultValues) para o RHF re-sincronizar quando o curso muda — caso
// contrário Código/Sigla apareciam vazios em modo edição.
function mapCourseToForm(course: Course | null | undefined): FormValues {
  return {
    name: course?.name ?? "",
    code: course?.code ?? "",
    sigla: course?.sigla ?? null,
    durationHours: course?.durationHours ?? 0,
    format:
      (course?.format as "PRESENCIAL" | "ELEARNING" | "BLENDED") ?? "PRESENCIAL",
    areaId: course?.areaId ?? null,
    shortDescription: course?.shortDescription ?? null,
  }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: Course | null
}

// Classe base para inputs/selects/textareas crus — mantém o markup do mock,
// só com tokens nossos. Borda fina ao foco (NÃO o ring grosso do shadcn).
const INPUT_BASE =
  "h-11 w-full rounded-lg border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"

const LABEL_CAPS = "text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
const HELPER = "text-xs text-muted-foreground"

export function CourseForm({ open, onOpenChange, course }: Props) {
  const userQ = useCurrentUser()
  const defaultTenant = useDefaultTenantId()
  const areas = useTrainingAreas()
  const upsert = useUpsertCourse()
  // Quando o curso tem módulos, a duração é derivada (soma das durações
  // dos módulos) — não permite edição manual para garantir o invariante.
  const modulesQ = useCourseModules(course?.id)
  const modulesCount = modulesQ.data?.length ?? 0
  const modulesSum = (modulesQ.data ?? []).reduce(
    (s, m) => s + (Number(m.durationHours) || 0),
    0
  )
  const durationLocked = !!course && modulesCount > 0

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    // padrão `values` (não `defaultValues`): o RHF re-sincroniza quando o
    // course prop muda. Fix do bug Código/Sigla vazios em edição.
    values: mapCourseToForm(course),
  })

  // Status fora do RHF — o Radix Select não sincroniza com reset.
  // Padrão derivado-com-override (igual aos planos).
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const currentStatus = pendingStatus ?? course?.status ?? "DRAFT"
  // Limpa o override sempre que o course referenciado muda.
  const [lastCourseId, setLastCourseId] = useState<string | undefined>(course?.id)
  if (course?.id !== lastCourseId) {
    setLastCourseId(course?.id)
    setPendingStatus(null)
  }

  const shortDesc = form.watch("shortDescription") ?? ""
  const shortDescLen = shortDesc.length
  const isEdit = !!course

  async function onSubmit(values: FormValues) {
    const tenantId =
      course?.tenantId ?? userQ.data?.tenantId ?? defaultTenant.data
    if (!tenantId) {
      toast.error("Sem tenant resolvido para criar o curso")
      return
    }
    const slug = course?.slug ?? `${slugify(values.name)}-${newId().slice(-6)}`
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
          status: course ? currentStatus : "DRAFT",
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        {/* Header */}
        <header className="px-6 pt-6 pb-4">
          <h2 className="text-2xl font-semibold text-foreground">
            {isEdit ? "Editar Curso" : "Novo Curso"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure os detalhes fundamentais do referencial de formação.
          </p>
        </header>

        <div className="border-t border-border" />

        {/* Form body */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="max-h-[60vh] overflow-y-auto px-6 py-6 space-y-6"
        >
          {/* Nome */}
          <div className="space-y-2">
            <label htmlFor="course-name" className={LABEL_CAPS}>
              Nome do Curso
            </label>
            <input
              id="course-name"
              type="text"
              className={INPUT_BASE}
              {...form.register("name")}
            />
            {err.name && (
              <p className="text-xs text-destructive">{err.name.message}</p>
            )}
          </div>

          {/* Código + Sigla */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="course-code" className={LABEL_CAPS}>
                Código
              </label>
              <input
                id="course-code"
                type="text"
                className={INPUT_BASE}
                placeholder="ex: LD-101"
                {...form.register("code")}
              />
              {err.code && (
                <p className="text-xs text-destructive">{err.code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="course-sigla" className={LABEL_CAPS}>
                Sigla
              </label>
              <input
                id="course-sigla"
                type="text"
                className={INPUT_BASE}
                placeholder="ex: LID"
                {...form.register("sigla")}
              />
            </div>
          </div>

          {/* Duração + Formato */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="course-duration" className={LABEL_CAPS}>
                Duração (horas)
              </label>
              <input
                id="course-duration"
                type="number"
                step="0.5"
                inputMode="decimal"
                disabled={durationLocked}
                className={INPUT_BASE}
                {...form.register("durationHours")}
              />
              {durationLocked ? (
                <p className="text-xs text-muted-foreground">
                  Calculado a partir dos módulos ({modulesSum}h).
                </p>
              ) : (
                err.durationHours && (
                  <p className="text-xs text-destructive">
                    {err.durationHours.message}
                  </p>
                )
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="course-format" className={LABEL_CAPS}>
                Formato
              </label>
              <div className="relative">
                <select
                  id="course-format"
                  className={`${INPUT_BASE} appearance-none pr-10`}
                  {...form.register("format")}
                >
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="ELEARNING">E-learning</option>
                  <option value="BLENDED">Misto</option>
                </select>
                <ChevronDown
                  aria-hidden
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>
          </div>

          {/* Área + Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="course-area" className={LABEL_CAPS}>
                Área de Formação
              </label>
              <div className="relative">
                <select
                  id="course-area"
                  className={`${INPUT_BASE} appearance-none pr-10`}
                  value={form.watch("areaId") ?? ""}
                  onChange={(e) =>
                    form.setValue("areaId", e.target.value || null)
                  }
                >
                  <option value="">Sem área</option>
                  {(areas.data ?? []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.citeCode ? `${a.citeCode} ${a.name}` : a.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
              </div>
            </div>
            {isEdit && (
              <div className="space-y-2">
                <label htmlFor="course-status" className={LABEL_CAPS}>
                  Estado
                </label>
                <div className="relative">
                  <select
                    id="course-status"
                    className={`${INPUT_BASE} appearance-none pr-10`}
                    value={currentStatus}
                    onChange={(e) => setPendingStatus(e.target.value)}
                  >
                    <option value="DRAFT">Rascunho</option>
                    <option value="PUBLISHED">Publicado</option>
                    <option value="FEATURED">Destaque</option>
                    <option value="ARCHIVED">Arquivado</option>
                  </select>
                  <ChevronDown
                    aria-hidden
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Descrição Curta */}
          <div className="space-y-2">
            <label htmlFor="course-desc" className={LABEL_CAPS}>
              Descrição Curta
            </label>
            <textarea
              id="course-desc"
              rows={3}
              maxLength={SHORT_DESC_MAX}
              className="block w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-0"
              placeholder="Resumo do curso para listagens e catálogo."
              {...form.register("shortDescription")}
            />
            <div className="flex items-center justify-between">
              <p className={HELPER}>
                Breve resumo para listagens e certificados.
              </p>
              <span
                className={`text-xs tabular-nums ${
                  shortDescLen > SHORT_DESC_MAX
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {shortDescLen}/{SHORT_DESC_MAX}
              </span>
            </div>
            {err.shortDescription && (
              <p className="text-xs text-destructive">
                {err.shortDescription.message}
              </p>
            )}
          </div>

          {/* Sugestão Técnica */}
          <aside className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Sugestão técnica
              </p>
              <p className="mt-1 text-sm text-foreground">
                Utilize o formato <strong>Misto</strong> para cursos que
                contenham componentes teóricos via e-learning e práticos
                presenciais.
              </p>
            </div>
          </aside>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={upsert.isPending}
              className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {upsert.isPending
                ? "A gravar..."
                : isEdit
                  ? "Gravar Alterações"
                  : "Gravar"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
