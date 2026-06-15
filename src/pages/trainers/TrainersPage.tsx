import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { Pencil, Trash2, Plus, CheckCircle2 } from "lucide-react"
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
  useTrainers,
  useDeleteTrainer,
  useApproveTrainer,
  trainerApprovalStatus,
} from "./useTrainers"
import { TrainerForm } from "./TrainerForm"
import type { TrainerWithUser } from "@/types/domain"

type StatusFilter = "ALL" | "ATIVO" | "PENDENTE"
type TypeFilter = "ALL" | "INTERNAL" | "EXTERNAL"

export function TrainersPage() {
  const query = useTrainers()
  const del = useDeleteTrainer()
  const approve = useApproveTrainer()
  const [editing, setEditing] = useState<TrainerWithUser | null>(null)
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<StatusFilter>("ALL")
  const [type, setType] = useState<TypeFilter>("ALL")

  const rows = useMemo(() => {
    let list = query.data ?? []
    if (status !== "ALL") {
      list = list.filter((t) => trainerApprovalStatus(t) === status)
    }
    if (type !== "ALL") {
      list = list.filter((t) =>
        type === "EXTERNAL" ? t.isExternal : !t.isExternal
      )
    }
    return list
  }, [query.data, status, type])

  async function handleDelete(id: string) {
    try {
      await del.mutateAsync(id)
      toast.success("Formador eliminado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao eliminar")
    }
  }

  async function handleApprove(userId: string) {
    try {
      await approve.mutateAsync(userId)
      toast.success("Formador aprovado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao aprovar")
    }
  }

  const columns: ColumnDef<TrainerWithUser>[] = [
    {
      id: "name",
      header: "Nome",
      accessorFn: (r) =>
        `${r.users?.firstName ?? ""} ${r.users?.lastName ?? ""}`.trim() || "—",
    },
    {
      id: "email",
      header: "Email",
      accessorFn: (r) => r.users?.email ?? "—",
    },
    { accessorKey: "ccpNumber", header: "CCP/CAP" },
    {
      id: "type",
      header: "Tipo",
      accessorFn: (r) => (r.isExternal ? "Externo" : "Interno"),
    },
    {
      id: "eTrainer",
      header: "E-learning",
      accessorFn: (r) => (r.eTrainer ? "Sim" : "Não"),
    },
    {
      id: "status",
      header: "Estado",
      cell: ({ row }) => {
        const s = trainerApprovalStatus(row.original)
        return (
          <Badge variant={s === "PENDENTE" ? "destructive" : "default"}>
            {s}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const t = row.original
        const pending = trainerApprovalStatus(t) === "PENDENTE"
        return (
          <div className="flex justify-end gap-1">
            {pending && t.userId && (
              <Button
                variant="ghost"
                size="icon"
                title="Aprovar formador"
                onClick={() => handleApprove(t.userId)}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setEditing(t)
                setOpen(true)
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(t.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Formadores</h1>
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
        <Select
          value={status}
          onValueChange={(v) => setStatus(v as StatusFilter)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os estados</SelectItem>
            <SelectItem value="ATIVO">Ativos</SelectItem>
            <SelectItem value="PENDENTE">Pendentes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={(v) => setType(v as TypeFilter)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Internos e externos</SelectItem>
            <SelectItem value="INTERNAL">Internos</SelectItem>
            <SelectItem value="EXTERNAL">Externos (bolsa)</SelectItem>
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
          emptyMessage="Sem formadores para os filtros selecionados."
          searchPlaceholder="Pesquisar formadores..."
          exportFileName="formadores"
        />
      )}

      <TrainerForm open={open} onOpenChange={setOpen} trainer={editing} />
    </div>
  )
}
