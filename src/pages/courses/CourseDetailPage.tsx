import { useParams, Link } from "react-router-dom"
import { useState } from "react"
import { ChevronRight, PlusCircle } from "lucide-react"
import { ErrorState } from "@/components/feedback/ErrorState"
import { useCourse } from "./useCourseModules"
import { CourseModulesTab } from "./CourseModulesTab"
import { CourseModuleForm } from "./CourseModuleForm"
import { useCourseModules } from "./useCourseModules"

function statusPill(status: string | null | undefined) {
  switch (status) {
    case "PUBLISHED":
      return (
        <span className="inline-flex items-center rounded-md border border-info/30 bg-info/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-info">
          Publicado
        </span>
      )
    case "FEATURED":
      return (
        <span className="inline-flex items-center rounded-md border border-success/30 bg-success/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-success">
          Destaque
        </span>
      )
    case "ARCHIVED":
      return (
        <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Arquivado
        </span>
      )
    case "DRAFT":
      return (
        <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Rascunho
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {status ?? "—"}
        </span>
      )
  }
}

function formatPill(format: string | null | undefined) {
  const label =
    format === "PRESENCIAL"
      ? "Presencial"
      : format === "ELEARNING"
        ? "E-learning"
        : format === "BLENDED"
          ? "Misto"
          : (format ?? "—")
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
  )
}

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const courseQ = useCourse(id)
  const modulesQ = useCourseModules(id)
  const [tab, setTab] = useState<"info" | "modulos">("modulos")
  const [moduleFormOpen, setModuleFormOpen] = useState(false)

  if (courseQ.isError) {
    return <ErrorState message={(courseQ.error as Error)?.message} />
  }

  const course = courseQ.data
  const totalHours = (modulesQ.data ?? []).reduce(
    (s, m) => s + (Number(m.durationHours) || 0),
    0
  )

  if (courseQ.isLoading) {
    return (
      <p className="text-sm text-muted-foreground">A carregar curso...</p>
    )
  }
  if (!course) {
    return <ErrorState message="Curso não encontrado." />
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/admin/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/admin/courses" className="hover:text-foreground">
          Cursos
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground truncate max-w-[200px]">
          {course.name}
        </span>
      </nav>

      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {course.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {statusPill(course.status)}
            {formatPill(course.format)}
            {course.code && (
              <span className="text-xs font-mono text-muted-foreground">
                {course.code}
              </span>
            )}
          </div>
        </div>
        {tab === "modulos" && (
          <button
            type="button"
            onClick={() => setModuleFormOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            <PlusCircle className="h-4 w-4" />
            Novo Módulo
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6 -mb-px">
          <button
            type="button"
            onClick={() => setTab("info")}
            className={`pb-3 text-sm font-medium border-b-2 transition ${
              tab === "info"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Informação
          </button>
          <button
            type="button"
            onClick={() => setTab("modulos")}
            className={`pb-3 text-sm font-medium border-b-2 transition ${
              tab === "modulos"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Módulos
            {modulesQ.data && modulesQ.data.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                {modulesQ.data.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab content */}
      {tab === "info" ? (
        <section className="grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Código" value={course.code} />
          <Field label="Sigla" value={course.sigla} />
          <Field
            label="Duração (horas)"
            value={
              course.durationHours != null
                ? `${course.durationHours}h`
                : null
            }
          />
          <Field label="Formato" value={course.format} />
          <Field label="Estado" value={course.status} />
          <div className="md:col-span-2">
            <Field label="Descrição curta" value={course.shortDescription} />
          </div>
          <div className="md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Total horas (módulos)
            </p>
            <p className="mt-1 text-sm text-foreground tabular-nums">
              {totalHours}h
            </p>
          </div>
        </section>
      ) : (
        <CourseModulesTab course={course} />
      )}

      {/* Modal Novo Módulo (controlado pelo botão do header) */}
      {moduleFormOpen && (
        <CourseModuleForm
          open={moduleFormOpen}
          onOpenChange={setModuleFormOpen}
          courseId={course.id}
          module={null}
          nextOrder={(modulesQ.data?.length ?? 0) + 1}
        />
      )}
    </div>
  )
}

function Field({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm text-foreground">{value || "—"}</p>
    </div>
  )
}
