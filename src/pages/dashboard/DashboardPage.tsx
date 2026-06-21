import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  FileDown,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Upload,
  ShieldCheck,
  BarChart3,
  LineChart,
  CalendarDays,
  Users,
  CalendarCheck,
  FileWarning,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TableSkeleton } from "@/components/ui/TableSkeleton"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import {
  useActiveActionsKpi,
  useActionsThisMonthKpi,
  useActiveTraineesKpi,
  usePendingDocsKpi,
} from "./useDashboardKpis"
import {
  useTrainingActions,
  type TrainingActionRow,
} from "@/pages/actions/useTrainingActions"
import { useTrainingPlans } from "@/pages/training-plans/useTrainingPlans"
import { useClientOrgs, useTrainersLookup } from "@/hooks/useLookups"

// ============================================================
// HELPERS
// ============================================================

const DATE_FMT = new Intl.DateTimeFormat("pt-PT", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
})
const MONTH_SHORT = new Intl.DateTimeFormat("pt-PT", { month: "short" })

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  try {
    return DATE_FMT.format(new Date(iso))
  } catch {
    return "—"
  }
}

function durationDays(start: string | null, end: string | null): string {
  if (!start || !end) return "—"
  try {
    const a = new Date(start).getTime()
    const b = new Date(end).getTime()
    const days = Math.round((b - a) / (1000 * 60 * 60 * 24)) + 1
    return `${days} dia${days === 1 ? "" : "s"}`
  } catch {
    return "—"
  }
}

function statusBadge(status: string | null) {
  switch (status) {
    case "COMPLETED":
      return <Badge variant="success">Concluída</Badge>
    case "IN_PROGRESS":
      return <Badge variant="info">Em curso</Badge>
    case "SCHEDULED":
      return <Badge variant="warning">Agendada</Badge>
    case "DRAFT":
      return <Badge variant="neutral">Rascunho</Badge>
    case "CANCELLED":
      return <Badge variant="destructive">Cancelada</Badge>
    default:
      return <Badge variant="neutral">{status ?? "—"}</Badge>
  }
}

function firstTrainerName(row: TrainingActionRow): string {
  const t = row.training_action_trainers?.[0]?.trainers?.users
  if (!t) return "—"
  return `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() || "—"
}

// ============================================================
// AUX QUERIES (subtítulos e detalhes que não estão em useDashboardKpis)
// ============================================================

function useScope() {
  const session = useAuthStore((s) => s.session)
  const user = useCurrentUser()
  const tenantId = user.data?.tenantId ?? null
  return { enabled: !!session && !!tenantId, tenantId }
}

function useDistinctClientOrgsWithTrainees() {
  const { tenantId, enabled } = useScope()
  return useQuery({
    queryKey: ["dash", "trainee-distinct-orgs", tenantId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trainees")
        .select("clientOrgId")
        .eq("tenantId", tenantId as string)
        .eq("isActive", true)
        .limit(5000)
      if (error) throw error
      const set = new Set<string>()
      for (const r of (data ?? []) as { clientOrgId: string | null }[]) {
        if (r.clientOrgId) set.add(r.clientOrgId)
      }
      return set.size
    },
  })
}

function useCompletedThisMonth() {
  const { tenantId, enabled } = useScope()
  return useQuery({
    queryKey: ["dash", "completed-this-month", tenantId],
    enabled,
    queryFn: async () => {
      const since = new Date()
      since.setDate(1)
      since.setHours(0, 0, 0, 0)
      const { count, error } = await supabase
        .from("training_actions")
        .select("*", { count: "exact", head: true })
        .eq("tenantId", tenantId as string)
        .eq("status", "COMPLETED")
        .gte("startDate", since.toISOString())
      if (error) throw error
      return count ?? 0
    },
  })
}

function useUpcomingMilestones() {
  const { tenantId, enabled } = useScope()
  return useQuery({
    queryKey: ["dash", "upcoming-milestones", tenantId],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_actions")
        .select("id, startDate, courses(name), client_orgs(name)")
        .eq("tenantId", tenantId as string)
        .eq("status", "SCHEDULED")
        .order("startDate", { ascending: true })
        .limit(3)
      if (error) throw error
      return (data ?? []) as unknown as {
        id: string
        startDate: string | null
        courses: { name: string } | null
        client_orgs: { name: string } | null
      }[]
    },
  })
}

function usePlanDetails(planId: string | undefined) {
  return useQuery({
    queryKey: ["dash", "plan-details", planId],
    enabled: !!planId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_actions")
        .select("id, status, training_sessions(durationHours)")
        .eq("planId", planId as string)
      if (error) throw error
      const rows = (data ?? []) as unknown as {
        id: string
        status: string | null
        training_sessions: { durationHours: number | null }[] | null
      }[]
      const total = rows.length
      const completed = rows.filter((r) => r.status === "COMPLETED").length
      let hours = 0
      for (const r of rows) {
        if (r.status === "COMPLETED" || r.status === "IN_PROGRESS") {
          for (const s of r.training_sessions ?? []) {
            hours += Number(s.durationHours ?? 0)
          }
        }
      }
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0
      return { total, completed, hours, percent }
    },
  })
}

// ============================================================
// COMPONENTES VISUAIS
// ============================================================

function TrendPill({ delta }: { delta?: number }) {
  // TODO trend real precisa de snapshot diário.
  if (delta == null) return null
  const positive = delta >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums ${
        positive
          ? "bg-success/10 text-success"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      {positive ? "+" : ""}
      {delta.toFixed(0)}%
    </span>
  )
}

function KpiCard({
  icon: Icon,
  label,
  hint,
  query,
  delta,
}: {
  icon: LucideIcon
  label: string
  hint: string
  query: { data?: number; isLoading: boolean; isError: boolean }
  delta?: number
}) {
  const display = query.isLoading
    ? "..."
    : query.isError
      ? "erro"
      : (query.data ?? 0).toLocaleString("pt-PT")

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-3xl font-semibold tabular-nums text-foreground leading-none">
          {display}
        </p>
        <TrendPill delta={delta} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function MilestoneDayChip({ iso }: { iso: string | null }) {
  if (!iso) {
    return (
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-muted text-center">
        <span className="text-base font-semibold tabular-nums">—</span>
      </div>
    )
  }
  const d = new Date(iso)
  const day = d.getDate()
  const mon = MONTH_SHORT.format(d).replace(".", "").toUpperCase()
  return (
    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md border border-border bg-muted text-center">
      <span className="text-base font-semibold tabular-nums leading-none">
        {day}
      </span>
      <span className="text-[10px] font-medium uppercase text-muted-foreground leading-none mt-0.5">
        {mon}
      </span>
    </div>
  )
}

function BentoCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: LucideIcon
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-lg border border-border bg-card p-5 text-left transition hover:border-primary/40 hover:bg-muted/40"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </button>
  )
}

// ============================================================
// DASHBOARD PAGE
// ============================================================

const TABLE_LIMIT = 6

export function DashboardPage() {
  const navigate = useNavigate()

  // Filtros da tabela (Estado liga ao hook; o resto é client-side sobre as 6 linhas)
  const [filterClient, setFilterClient] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterTrainer, setFilterTrainer] = useState<string>("all")
  const [filterFrom, setFilterFrom] = useState<string>("")
  const [filterTo, setFilterTo] = useState<string>("")
  const [search, setSearch] = useState<string>("")

  // KPIs principais
  const activeActions = useActiveActionsKpi()
  const activeTrainees = useActiveTraineesKpi()
  const thisMonth = useActionsThisMonthKpi()
  const pendingDocs = usePendingDocsKpi()

  // Subtítulos com dados reais
  const distinctOrgs = useDistinctClientOrgsWithTrainees()
  const completedThisMonth = useCompletedThisMonth()

  // Listagem de acções (status liga directo; outras filtragens são client-side)
  const actionsQuery = useTrainingActions({
    status: filterStatus !== "all" ? filterStatus : undefined,
  })

  // Lookups para os selects
  const clientsQ = useClientOrgs()
  const trainersQ = useTrainersLookup()

  // Plano mais recente
  const plansQ = useTrainingPlans()
  const latestPlan = plansQ.data?.[0]
  const planDetails = usePlanDetails(latestPlan?.id)

  // Próximos marcos
  const milestonesQ = useUpcomingMilestones()

  const rowsForTable = useMemo(() => {
    const all = actionsQuery.data ?? []
    const lc = search.trim().toLowerCase()
    const filtered = all.filter((r) => {
      if (filterClient !== "all" && r.clientOrgId !== filterClient) return false
      if (
        filterTrainer !== "all" &&
        !r.training_action_trainers?.some((t) => t.trainerId === filterTrainer)
      )
        return false
      if (filterFrom && r.startDate && r.startDate < filterFrom) return false
      if (filterTo && r.startDate && r.startDate > filterTo) return false
      if (lc) {
        const hay =
          `${r.actionCode ?? ""} ${r.courses?.name ?? ""} ${r.client_orgs?.name ?? ""}`.toLowerCase()
        if (!hay.includes(lc)) return false
      }
      return true
    })
    return filtered.slice(0, TABLE_LIMIT)
  }, [actionsQuery.data, filterClient, filterTrainer, filterFrom, filterTo, search])

  const totalActiveForFooter = activeActions.data ?? 0

  return (
    <div className="space-y-6">
      {/* Header de conteúdo */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Dashboard Principal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão geral das tuas operações de formação
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              // TODO ligar a export real (CSV/PDF)
              window.print()
            }}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Exportar Relatórios
          </Button>
          <Button onClick={() => navigate("/admin/training-plans")}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Plano
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={CalendarCheck}
          label="Turmas Activas"
          hint="agendadas e em curso"
          query={activeActions}
        />
        <KpiCard
          icon={Users}
          label="Formandos Activos"
          hint={
            distinctOrgs.data
              ? `em ${distinctOrgs.data} empresas`
              : "formandos registados"
          }
          query={activeTrainees}
        />
        <KpiCard
          icon={CalendarDays}
          label="Ações este mês"
          hint={
            completedThisMonth.data != null
              ? `${completedThisMonth.data} concluídas este mês`
              : "startDate no mês corrente"
          }
          query={thisMonth}
        />
        <KpiCard
          icon={FileWarning}
          label="Documentos Pendentes"
          hint="atenção requerida"
          query={pendingDocs}
        />
      </div>

      {/* Grid principal: tabela + cartão plano + marcos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Esquerda 3/4 — Últimas Ações */}
        <section className="lg:col-span-3 rounded-lg border border-border bg-card overflow-hidden">
          <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Últimas Ações de Formação
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Top {TABLE_LIMIT} por data de início
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/actions")}
            >
              Ver todas
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </header>

          {/* Filtros */}
          <div className="border-b border-border px-5 py-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar..."
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger className="h-9 w-[150px] text-sm">
                <SelectValue placeholder="Entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as entidades</SelectItem>
                {(clientsQ.data ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-9 w-[140px] text-sm">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="DRAFT">Rascunho</SelectItem>
                <SelectItem value="SCHEDULED">Agendada</SelectItem>
                <SelectItem value="IN_PROGRESS">Em curso</SelectItem>
                <SelectItem value="COMPLETED">Concluída</SelectItem>
                <SelectItem value="CANCELLED">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTrainer} onValueChange={setFilterTrainer}>
              <SelectTrigger className="h-9 w-[160px] text-sm">
                <SelectValue placeholder="Formador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os formadores</SelectItem>
                {(trainersQ.data ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {`${t.users?.firstName ?? ""} ${t.users?.lastName ?? ""}`.trim() ||
                      "Formador"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="h-9 w-[140px] text-sm"
              aria-label="Data início"
            />
            <Input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="h-9 w-[140px] text-sm"
              aria-label="Data fim"
            />
          </div>

          {/* Tabela */}
          {actionsQuery.isLoading ? (
            <div className="p-3">
              <TableSkeleton cols={8} />
            </div>
          ) : (
            <Table className="tabular-nums">
              <TableHeader className="bg-muted">
                <TableRow className="hover:bg-muted">
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Código
                  </TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Curso
                  </TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Cliente
                  </TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Início
                  </TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Fim
                  </TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Duração
                  </TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Formador
                  </TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Estado
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {rowsForTable.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-20 text-center text-sm text-muted-foreground"
                    >
                      Sem ações para os filtros actuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  rowsForTable.map((row) => (
                    <TableRow
                      key={row.id}
                      className="h-9 hover:bg-muted/50 border-0 cursor-pointer"
                      onClick={() => navigate(`/admin/actions/${row.id}`)}
                    >
                      <TableCell className="py-1.5 font-medium text-foreground">
                        {row.actionCode ?? "—"}
                      </TableCell>
                      <TableCell className="py-1.5">
                        {row.courses?.name ?? "—"}
                      </TableCell>
                      <TableCell className="py-1.5">
                        {row.client_orgs?.name ?? "—"}
                      </TableCell>
                      <TableCell className="py-1.5">
                        {fmtDate(row.startDate)}
                      </TableCell>
                      <TableCell className="py-1.5">
                        {fmtDate(row.endDate)}
                      </TableCell>
                      <TableCell className="py-1.5 text-muted-foreground">
                        {durationDays(row.startDate, row.endDate)}
                      </TableCell>
                      <TableCell className="py-1.5">
                        {firstTrainerName(row)}
                      </TableCell>
                      <TableCell className="py-1.5">
                        {statusBadge(row.status ?? null)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Rodapé tabela */}
          <footer className="flex items-center justify-between border-t border-border px-5 py-3">
            <p className="text-xs text-muted-foreground tabular-nums">
              A mostrar {rowsForTable.length} de {totalActiveForFooter} ações
              activas
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate("/admin/actions")}
                aria-label="Ver lista completa"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => navigate("/admin/actions")}
                aria-label="Página seguinte"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </footer>
        </section>

        {/* Direita 1/4 — Plano + Marcos */}
        <aside className="lg:col-span-1 space-y-6">
          {/* Cartão Plano (navy) */}
          <div className="rounded-lg bg-primary text-primary-foreground p-5 space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary-foreground/70">
                Plano em destaque
              </p>
              <h2 className="mt-1 text-lg font-semibold leading-tight">
                {latestPlan?.name ?? "Sem plano"}
                {latestPlan?.year ? ` ${latestPlan.year}` : ""}
              </h2>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-primary-foreground/70">Progresso</span>
                <span className="font-semibold tabular-nums">
                  {planDetails.data?.percent ?? 0}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-primary-foreground/20 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-foreground transition-[width]"
                  style={{ width: `${planDetails.data?.percent ?? 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-primary-foreground/10 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-primary-foreground/70">
                  Horas Realizadas
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {(planDetails.data?.hours ?? 0).toLocaleString("pt-PT")}
                </p>
              </div>
              <div
                className="rounded-md bg-primary-foreground/10 p-3"
                title="Sem dados de custo"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-primary-foreground/70">
                  Investimento
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums">—</p>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              onClick={() => navigate("/admin/training-plans")}
              disabled={!latestPlan}
            >
              Ver Detalhes do Plano
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Próximos Marcos */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                Próximos Marcos
              </h2>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </div>
            <ul className="mt-4 space-y-3">
              {milestonesQ.isLoading ? (
                <li className="text-sm text-muted-foreground">A carregar…</li>
              ) : (milestonesQ.data ?? []).length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  Sem ações agendadas.
                </li>
              ) : (
                (milestonesQ.data ?? []).map((m) => (
                  <li key={m.id} className="flex items-start gap-3">
                    <MilestoneDayChip iso={m.startDate} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {m.courses?.name ?? "Curso"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {m.client_orgs?.name ?? "—"}
                      </p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>
      </div>

      {/* Bento — atalhos */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <BentoCard
          icon={Upload}
          title="Repositório de Sumários"
          description="Acede aos sumários assinados e gera dossiers DGERT."
          onClick={() => navigate("/admin/actions") /* TODO rota dedicada */}
        />
        <BentoCard
          icon={ShieldCheck}
          title="Emissão de Certificados"
          description="Gere e descarrega certificados de conclusão."
          onClick={() => navigate("/admin/management") /* TODO rota dedicada */}
        />
        <BentoCard
          icon={BarChart3}
          title="Avaliação de Satisfação"
          description="Cria campanhas de questionários e analisa resultados."
          onClick={() => navigate("/admin/questionarios")}
        />
      </div>

      {/* Marcador para ícones reservados (LineChart) — placeholder até spec dedicado */}
      <span className="hidden">
        <LineChart aria-hidden />
      </span>
    </div>
  )
}
