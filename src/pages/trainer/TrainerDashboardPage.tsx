import { useMemo } from "react"
import { Link } from "react-router-dom"
import {
  CalendarClock,
  CalendarRange,
  Clock,
  ClipboardList,
  type LucideIcon,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ErrorState } from "@/components/feedback/ErrorState"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { useTrainerSessions } from "./useTrainerSessions"
import { sessionStatus, statusBadgeClass } from "./sessionStatus"

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("pt-PT") : "—"
}
function dayStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

export function TrainerDashboardPage() {
  const me = useCurrentUser()
  const query = useTrainerSessions()

  const stats = useMemo(() => {
    const list = query.data ?? []
    const today = dayStart(new Date())
    const now = new Date()
    const upcoming = list
      .filter((s) => s.sessionDate && dayStart(new Date(s.sessionDate)) >= today)
      .sort(
        (a, b) =>
          new Date(a.sessionDate as string).getTime() -
          new Date(b.sessionDate as string).getTime()
      )
    const next = upcoming[0] ?? null
    const thisMonth = list.filter((s) => {
      if (!s.sessionDate) return false
      const d = new Date(s.sessionDate)
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      )
    }).length
    const hours = list
      .filter(
        (s) => s.sessionDate && dayStart(new Date(s.sessionDate)) < today
      )
      .reduce((sum, s) => sum + (Number(s.durationHours) || 0), 0)
    return { next, thisMonth, hours, total: list.length, upcoming }
  }, [query.data])

  const firstName = me.data?.firstName ?? "Formador"

  if (query.isError) {
    return <ErrorState message={(query.error as Error)?.message} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bem-vindo, {firstName}!</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral das suas sessões de formação.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Kpi
          icon={CalendarClock}
          label="Próxima Sessão"
          value={
            stats.next
              ? fmtDate(stats.next.sessionDate)
              : "—"
          }
          hint={
            stats.next
              ? `${stats.next.startTime ?? "—"} · ${
                  stats.next.course_modules?.name ?? "Sessão"
                }`
              : "Sem sessões agendadas"
          }
          loading={query.isLoading}
        />
        <Kpi
          icon={CalendarRange}
          label="Sessões Este Mês"
          value={stats.thisMonth}
          hint="mês corrente"
          loading={query.isLoading}
        />
        <Kpi
          icon={Clock}
          label="Horas Dadas"
          value={`${stats.hours}h`}
          hint="sessões já decorridas"
          loading={query.isLoading}
        />
        <Kpi
          icon={ClipboardList}
          label="Total Sessões"
          value={stats.total}
          hint="atribuídas a si"
          loading={query.isLoading}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Próximas Sessões</h2>
          <Link
            to="/trainer/sessions"
            className="text-sm font-medium text-primary hover:underline"
          >
            Ver todas
          </Link>
        </div>
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Módulo</TableHead>
                <TableHead>Curso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.upcoming.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-20 text-center text-muted-foreground"
                  >
                    {query.isLoading
                      ? "A carregar..."
                      : "Sem sessões agendadas."}
                  </TableCell>
                </TableRow>
              ) : (
                stats.upcoming.slice(0, 5).map((s) => {
                  const st = sessionStatus(s.sessionDate)
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{fmtDate(s.sessionDate)}</TableCell>
                      <TableCell>
                        {s.startTime ?? "—"}
                        {s.endTime ? `–${s.endTime}` : ""}
                      </TableCell>
                      <TableCell>
                        {s.course_modules?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        {s.training_actions?.course?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusBadgeClass(st)}
                        >
                          {st}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/trainer/sessions/${s.id}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Abrir
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  loading,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  hint: string
  loading: boolean
}) {
  return (
    <div className="rounded-lg border bg-background p-6">
      <Icon className="mb-2 h-5 w-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">
        {loading ? "..." : value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
