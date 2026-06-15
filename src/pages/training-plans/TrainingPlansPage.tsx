import { useMemo, useState } from "react"
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
import {
  useTrainingPlans,
  useDeleteTrainingPlan,
} from "./useTrainingPlans"
import { TrainingPlanForm } from "./TrainingPlanForm"
import type { TrainingPlan } from "@/types/domain"

export function TrainingPlansPage() {
  const query = useTrainingPlans()
  const del = useDeleteTrainingPlan()
  const [editing, setEditing] = useState<TrainingPlan | null>(null)
  const [open, setOpen] = useState(false)
  const [year, setYear] = useState("ALL")
  const [status, setStatus] = useState("ALL")

  const years = useMemo(() => {
    const set = new Set<number>()
    for (const p of query.data ?? []) if (p.year) set.add(p.year)
    return [...set].sort((a, b) => b - a)
  }, [query.data])

  const statuses = useMemo(() => {
    const set = new Set<string>()
    for (const p of query.data ?? []) if (p.status) set.add(p.status)
    return [...set].sort()
  }, [query.data])

  const rows = useMemo(() => {
    let list = query.data ?? []
    if (year !== "ALL") list = list.filter((p) => String(p.year) === year)
    if (status !== "ALL") list = list.filter((p) => p.status === status)
    return list
  }, [query.data, year, status])

  async function handleDelete(id: string) {
    try {
      await del.mutateAsync(id)
      toast.success("Plano eliminado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao eliminar")
    }
  }

  const columns: ColumnDef<TrainingPlan>[] = [
    { accessorKey: "name", header: "Nome" },
    { accessorKey: "year", header: "Ano" },
    {
      accessorKey: "isInternal",
      header: "Interno",
      cell: ({ getValue }) => (getValue() ? "Sim" : "Não"),
    },
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
          <h1 className="text-2xl font-semibold">Planos de Formação</h1>
          {!query.isLoading && (
            <Badge variant="secondary">{rows.length}</Badge>
          )}
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
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Ano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os anos</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os estados</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
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
          emptyMessage="Sem planos."
          searchPlaceholder="Pesquisar planos..."
          exportFileName="planos_formacao"
        />
      )}

      <TrainingPlanForm open={open} onOpenChange={setOpen} plan={editing} />
    </div>
  )
}
