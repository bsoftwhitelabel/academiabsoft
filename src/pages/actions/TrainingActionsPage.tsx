import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import type { ColumnDef } from "@tanstack/react-table"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table/DataTable"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useClientOrgs, useTrainersLookup } from "@/hooks/useLookups"
import {
  useTrainingActions,
  useDeleteTrainingAction,
  type TrainingActionRow,
} from "./useTrainingActions"
import { TrainingActionForm } from "./TrainingActionForm"

const ALL = "ALL"
const STATUSES = ["DRAFT", "SCHEDULED", "IN_PROGRESS", "COMPLETED"] as const

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString("pt-PT") : "—"
}
function trainersOf(r: TrainingActionRow): string {
  const names = (r.training_action_trainers ?? [])
    .map((t) => {
      const u = t.trainers?.users
      return u ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() : ""
    })
    .filter(Boolean)
  return names.length ? names.join(", ") : "—"
}

export function TrainingActionsPage() {
  const [clientOrgId, setClientOrgId] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [trainerId, setTrainerId] = useState(ALL)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [open, setOpen] = useState(false)

  const orgs = useClientOrgs()
  const trainers = useTrainersLookup()
  const del = useDeleteTrainingAction()
  const query = useTrainingActions({
    clientOrgId: clientOrgId === ALL ? undefined : clientOrgId,
    status: status === ALL ? undefined : status,
    trainerId: trainerId === ALL ? undefined : trainerId,
    from: from || undefined,
    to: to || undefined,
  })
  const rows = useMemo(() => query.data ?? [], [query.data])

  async function handleDelete(id: string) {
    try {
      await del.mutateAsync(id)
      toast.success("Ação eliminada")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao eliminar")
    }
  }

  const columns: ColumnDef<TrainingActionRow>[] = [
    {
      id: "actionCode",
      header: "Código",
      cell: ({ row }) => (
        <Link
          to={`/admin/actions/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.original.actionCode ?? row.original.id.slice(0, 8)}
        </Link>
      ),
    },
    {
      id: "course",
      header: "Curso",
      accessorFn: (r) => r.courses?.name ?? "—",
    },
    {
      id: "client",
      header: "Cliente",
      accessorFn: (r) => r.client_orgs?.name ?? "—",
    },
    {
      id: "dates",
      header: "Datas",
      cell: ({ row }) =>
        `${fmt(row.original.startDate)} → ${fmt(row.original.endDate)}`,
    },
    {
      id: "duration",
      header: "Duração",
      accessorFn: (r) =>
        r.courses?.durationHours != null ? `${r.courses.durationHours}h` : "—",
    },
    { id: "trainer", header: "Formador", accessorFn: trainersOf },
    {
      id: "status",
      header: "Estado",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Badge variant="secondary">{row.original.status ?? "—"}</Badge>
          {!row.original.contractId && (
            <Badge variant="destructive" title="Ação histórica sem contrato">
              Sem contrato
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleDelete(row.original.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Ações de Formação</h1>
          {!query.isLoading && (
            <Badge variant="secondary">{rows.length}</Badge>
          )}
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Ação
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Select value={clientOrgId} onValueChange={setClientOrgId}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Entidade cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as entidades</SelectItem>
            {(orgs.data ?? []).map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os estados</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={trainerId} onValueChange={setTrainerId}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Formador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os formadores</SelectItem>
            {(trainers.data ?? []).map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {`${t.users?.firstName ?? ""} ${t.users?.lastName ?? ""}`.trim() ||
                  t.id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="space-y-1">
          <Label className="text-xs">De</Label>
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Até</Label>
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {query.isError ? (
        <ErrorState message={(query.error as Error)?.message} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          isLoading={query.isLoading}
          emptyMessage="Sem ações."
          searchPlaceholder="Pesquisar por código..."
          exportFileName="acoes_formacao"
        />
      )}

      <TrainingActionForm open={open} onOpenChange={setOpen} />
    </div>
  )
}
