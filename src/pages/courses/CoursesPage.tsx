import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table/DataTable"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTrainingAreas } from "@/hooks/useLookups"
import { useCourses, useDeleteCourse } from "./useCourses"
import { CourseForm } from "./CourseForm"
import type { Course } from "@/types/domain"

const ALL = "ALL"

export function CoursesPage() {
  const [areaId, setAreaId] = useState(ALL)
  const [format, setFormat] = useState(ALL)
  const [editing, setEditing] = useState<Course | null>(null)
  const [open, setOpen] = useState(false)
  const areas = useTrainingAreas()
  const del = useDeleteCourse()
  const query = useCourses({
    areaId: areaId === ALL ? undefined : areaId,
    format: format === ALL ? undefined : format,
  })
  const rows = useMemo(() => query.data ?? [], [query.data])

  async function handleDelete(id: string) {
    try {
      await del.mutateAsync(id)
      toast.success("Curso eliminado")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao eliminar")
    }
  }

  const columns: ColumnDef<Course>[] = [
    { accessorKey: "code", header: "Código" },
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <Link
          to={`/admin/courses/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    { accessorKey: "format", header: "Formato" },
    { accessorKey: "durationHours", header: "Horas" },
    { accessorKey: "status", header: "Estado" },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditing(row.original)
              setOpen(true)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Cursos</h1>
          {!query.isLoading && <Badge variant="secondary">{rows.length}</Badge>}
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={areaId} onValueChange={setAreaId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Área de formação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as áreas</SelectItem>
            {(areas.data ?? []).map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.citeCode ? `${a.citeCode} ${a.name}` : a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={format} onValueChange={setFormat}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Formato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os formatos</SelectItem>
            <SelectItem value="PRESENCIAL">Presencial</SelectItem>
            <SelectItem value="ELEARNING">E-learning</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {query.isError ? (
        <ErrorState message={(query.error as Error)?.message} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          isLoading={query.isLoading}
          emptyMessage="Sem cursos."
          searchPlaceholder="Pesquisar por nome..."
          exportFileName="cursos"
        />
      )}

      <CourseForm open={open} onOpenChange={setOpen} course={editing} />
    </div>
  )
}
