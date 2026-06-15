import { useEffect, useMemo, useState } from "react"
import { Pencil, Trash2, Plus, GripVertical, AlertTriangle, Lock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useIsSuperAdmin } from "@/hooks/useCurrentUser"
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
  const [localOrder, setLocalOrder] = useState<CourseModule[]>([])
  const [dragId, setDragId] = useState<string | null>(null)

  const serverModules = useMemo(
    () => modulesQ.data ?? [],
    [modulesQ.data]
  )
  useEffect(() => setLocalOrder(serverModules), [serverModules])

  const inUseCount = actionCountQ.data ?? 0
  const locked = inUseCount > 0 && !overridden
  const canEdit = !locked

  const sumHours = localOrder.reduce(
    (s, m) => s + (Number(m.durationHours) || 0),
    0
  )
  const courseHours = Number(course.durationHours) || 0
  const hoursMismatch =
    courseHours > 0 && Math.abs(sumHours - courseHours) > 0.001

  async function handleDelete(id: string) {
    try {
      await del.mutateAsync(id)
      toast.success("Módulo eliminado")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao eliminar")
    }
  }

  async function persistOrder(next: CourseModule[]) {
    setLocalOrder(next)
    try {
      await reorder.mutateAsync(next.map((m) => m.id))
      toast.success("Ordem atualizada")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro a reordenar")
      setLocalOrder(serverModules)
    }
  }

  function onDrop(targetId: string) {
    if (!dragId || dragId === targetId) return
    const from = localOrder.findIndex((m) => m.id === dragId)
    const to = localOrder.findIndex((m) => m.id === targetId)
    if (from < 0 || to < 0) return
    const next = [...localOrder]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setDragId(null)
    persistOrder(next)
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
      {inUseCount > 0 && (
        <div className="flex items-start justify-between gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
            <div>
              <p className="font-medium text-amber-700">
                Curso em uso por {inUseCount} ação(ões)
              </p>
              <p className="text-amber-700/80">
                Editar campos críticos compromete o histórico DGERT. Edição
                de módulos bloqueada.
              </p>
            </div>
          </div>
          {locked && isSuperAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={requestOverride}
            >
              <Lock className="mr-2 h-4 w-4" />
              Desbloquear (SUPER_ADMIN)
            </Button>
          )}
          {overridden && (
            <Badge variant="destructive">Override ativo</Badge>
          )}
        </div>
      )}

      {hoursMismatch && (
        <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          Soma dos módulos ({sumHours}h) não bate com a duração do curso (
          {courseHours}h).
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {localOrder.length} módulo(s) · {sumHours}h de {courseHours}h
          </span>
        </div>
        <Button
          size="sm"
          disabled={!canEdit}
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo módulo
        </Button>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead className="w-16">Ordem</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead className="w-32">Duração (h)</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {localOrder.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-20 text-center text-muted-foreground"
                >
                  {modulesQ.isLoading ? "A carregar..." : "Sem módulos."}
                </TableCell>
              </TableRow>
            ) : (
              localOrder.map((m, idx) => (
                <TableRow
                  key={m.id}
                  draggable={canEdit}
                  onDragStart={() => setDragId(m.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(m.id)}
                  className={dragId === m.id ? "opacity-50" : undefined}
                >
                  <TableCell>
                    {canEdit && (
                      <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <div className="font-medium">{m.name}</div>
                    {m.description && (
                      <div className="text-xs text-muted-foreground">
                        {m.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{m.durationHours}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!canEdit}
                        onClick={() => {
                          setEditing(m)
                          setOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!canEdit}
                        onClick={() => handleDelete(m.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {open && (
        <CourseModuleForm
          open={open}
          onOpenChange={setOpen}
          courseId={course.id}
          module={editing}
          nextOrder={localOrder.length + 1}
        />
      )}
    </div>
  )
}
