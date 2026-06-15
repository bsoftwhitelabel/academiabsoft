import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/data-table/DataTable"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useTrainerSessions,
  type TrainerSessionRow,
} from "./useTrainerSessions"
import { sessionStatus, statusBadgeClass } from "./sessionStatus"

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("pt-PT") : "—"
}

type Filter = "all" | "upcoming" | "past"

const columns: ColumnDef<TrainerSessionRow>[] = [
  {
    id: "data",
    header: "Data",
    accessorFn: (r) => fmtDate(r.sessionDate),
  },
  {
    id: "horario",
    header: "Horário",
    accessorFn: (r) =>
      r.startTime || r.endTime
        ? `${r.startTime ?? "—"}–${r.endTime ?? "—"}`
        : "—",
  },
  {
    id: "modulo",
    header: "Módulo",
    accessorFn: (r) => r.course_modules?.name ?? "—",
  },
  {
    id: "curso",
    header: "Curso",
    accessorFn: (r) => r.training_actions?.course?.name ?? "—",
  },
  {
    id: "cliente",
    header: "Cliente",
    accessorFn: (r) => r.training_actions?.clientOrg?.name ?? "—",
  },
  {
    id: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const s = sessionStatus(row.original.sessionDate)
      return (
        <Badge variant="outline" className={statusBadgeClass(s)}>
          {s}
        </Badge>
      )
    },
  },
  {
    id: "acoes",
    header: "",
    cell: ({ row }) => (
      <Link
        to={`/trainer/sessions/${row.original.id}`}
        className="text-sm font-medium text-primary hover:underline"
      >
        Abrir
      </Link>
    ),
  },
]

export function TrainerSessionsPage() {
  const query = useTrainerSessions()
  const [filter, setFilter] = useState<Filter>("all")

  const rows = useMemo(() => {
    const list = query.data ?? []
    if (filter === "all") return list
    return list.filter((r) => {
      const s = sessionStatus(r.sessionDate)
      return filter === "upcoming"
        ? s === "Hoje" || s === "Agendada"
        : s === "Concluída"
    })
  }, [query.data, filter])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Minhas Sessões</h1>
        <p className="text-sm text-muted-foreground">
          Sessões em que é o formador responsável.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="upcoming">Próximas</SelectItem>
            <SelectItem value="past">Passadas</SelectItem>
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
          emptyMessage="Não tem sessões atribuídas."
          searchPlaceholder="Pesquisar curso ou cliente..."
          exportFileName="minhas_sessoes"
        />
      )}
    </div>
  )
}
