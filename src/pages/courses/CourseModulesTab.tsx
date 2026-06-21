import { useState } from "react"
import {
  Pencil,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Lock,
} from "lucide-react"
import { toast } from "sonner"
import { useIsSuperAdmin } from "@/hooks/useCurrentUser"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useCourseModules,
  useDeleteCourseModule,
  useReorderCourseModules,
  useCourseActionCount,
} from "./useCourseModules"
import { CourseModuleForm } from "./CourseModuleForm"
import type { Course, CourseModule } from "@/types/domain"

interface Props {
  course: Course
}

export function CourseModulesTab({ course }: Props) {
  const modulesQ = useCourseModules(course.id)
  const actionCountQ = useCourseActionCount(course.id)
  const del = useDeleteCourseModule()
  const reorder = useReorderCourseModules()
  const isSuperAdmin = useIsSuperAdmin()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CourseModule | null>(null)
  const [overridden, setOverridden] = useState(false)
  const [deleting, setDeleting] = useState<CourseModule | null>(null)

  const modules = modulesQ.data ?? []
  const inUseCount = actionCountQ.data ?? 0
  const locked = inUseCount > 0 && !overridden
  const canEdit = !locked

  const totalHours = modules.reduce(
    (s, m) => s + (Number(m.durationHours) || 0),
    0
  )

  async function confirmDelete() {
    if (!deleting) return
    try {
      await del.mutateAsync({ id: deleting.id, courseId: course.id })
      toast.success("Módulo eliminado")
      setDeleting(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao eliminar")
    }
  }

  async function moveModule(idx: number, dir: -1 | 1) {
    const target = idx + dir
    if (target < 0 || target >= modules.length) return
    const next = [...modules]
    const [moved] = next.splice(idx, 1)
    next.splice(target, 0, moved)
    try {
      await reorder.mutateAsync({
        orderedIds: next.map((m) => m.id),
        courseId: course.id,
      })
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro a reordenar")
    }
  }

  function requestOverride() {
    if (
      window.confirm(
        `Este curso está em uso por ${inUseCount} ação(ões). Editar módulos COMPROMETE o histórico DGERT dessas ações. Continuar?`
      ) &&
      window.confirm(
        "Confirmação final: tem a certeza absoluta? Esta ação é da responsabilidade do SUPER_ADMIN."
      )
    ) {
      setOverridden(true)
      toast.warning("Edição de módulos desbloqueada (override SUPER_ADMIN)")
    }
  }

  return (
    <div className="space-y-4">
      {/* Aviso lock */}
      {inUseCount > 0 && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-warning" />
            <div>
              <p className="font-medium text-foreground">
                Curso em uso por {inUseCount} ação(ões)
              </p>
              <p className="text-muted-foreground">
                Editar campos críticos compromete o histórico DGERT. Edição de
                módulos bloqueada.
              </p>
            </div>
          </div>
          {locked && isSuperAdmin && (
            <button
              type="button"
              onClick={requestOverride}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted transition"
            >
              <Lock className="h-3.5 w-3.5" />
              Desbloquear
            </button>
          )}
          {overridden && (
            <span className="inline-flex items-center rounded-md border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-destructive">
              Override ativo
            </span>
          )}
        </div>
      )}

      {/* Tabela */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <table className="w-full text-sm tabular-nums">
          <thead className="bg-muted">
            <tr className="border-b border-border">
              <th className="w-10 px-3 py-2.5" />
              <th className="w-16 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Ordem
              </th>
              <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Nome
              </th>
              <th className="w-32 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Duração (h)
              </th>
              <th className="w-32 px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {modulesQ.isLoading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  A carregar...
                </td>
              </tr>
            ) : modules.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
                  Sem módulos.
                </td>
              </tr>
            ) : (
              modules.map((m, idx) => (
                <tr
                  key={m.id}
                  className="group hover:bg-muted/50 transition"
                >
                  <td className="px-3 py-2 text-muted-foreground">
                    <GripVertical
                      aria-hidden
                      className="h-4 w-4 opacity-50"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <span className="text-foreground font-medium">
                        {idx + 1}
                      </span>
                      {canEdit && (
                        <div className="flex flex-col opacity-0 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={() => moveModule(idx, -1)}
                            disabled={idx === 0}
                            className="h-4 w-4 inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Mover para cima"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveModule(idx, 1)}
                            disabled={idx === modules.length - 1}
                            className="h-4 w-4 inline-flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Mover para baixo"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm font-medium text-foreground">
                      {m.name}
                    </div>
                    {m.description && (
                      <div className="text-xs text-muted-foreground">
                        {m.description}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-foreground">
                    {m.durationHours}h
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(m)
                          setOpen(true)
                        }}
                        disabled={!canEdit}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition"
                        aria-label="Editar módulo"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(m)}
                        disabled={!canEdit}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        aria-label="Eliminar módulo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {modules.length > 0 && (
            <tfoot>
              <tr className="border-t border-border bg-muted/50">
                <td className="px-3 py-2.5" />
                <td
                  colSpan={2}
                  className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Total
                </td>
                <td className="px-3 py-2.5 text-foreground font-semibold">
                  {totalHours}h
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Modal Novo/Editar módulo (controlado pela tabela) */}
      {open && (
        <CourseModuleForm
          open={open}
          onOpenChange={setOpen}
          courseId={course.id}
          module={editing}
          nextOrder={modules.length + 1}
        />
      )}

      {/* Dialog confirmação Eliminar */}
      <Dialog
        open={!!deleting}
        onOpenChange={(o) => {
          if (!o) setDeleting(null)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar módulo?</DialogTitle>
            <DialogDescription>
              {deleting
                ? `Vais eliminar "${deleting.name}". A duração do curso é recalculada automaticamente.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="h-10 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={del.isPending}
              className="h-10 rounded-lg bg-destructive px-4 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60 transition"
            >
              {del.isPending ? "A eliminar..." : "Eliminar"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
