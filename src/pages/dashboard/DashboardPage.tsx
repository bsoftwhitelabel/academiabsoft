import { useMemo } from "react"
import {
  CalendarCheck,
  CalendarClock,
  FileWarning,
  Users,
  Info,
  type LucideIcon,
} from "lucide-react"
import { DataTable } from "@/components/data-table/DataTable"
import { buildAutoColumns } from "@/components/data-table/autoColumns"
import { useTableRows } from "@/hooks/useSupabaseTable"
import {
  useActiveActionsKpi,
  useActionsThisMonthKpi,
  useActiveTraineesKpi,
  usePendingDocsKpi,
} from "./useDashboardKpis"

export function DashboardPage() {
  const activeActions = useActiveActionsKpi()
  const thisMonth = useActionsThisMonthKpi()
  const activeTrainees = useActiveTraineesKpi()
  const pendingDocs = usePendingDocsKpi()

  const lastActions = useTableRows("training_actions", 10)
  const rows = lastActions.data ?? []
  const columns = useMemo(() => buildAutoColumns(rows), [rows])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <KpiCard
          icon={CalendarCheck}
          label="Turmas Activas"
          hint="status SCHEDULED ou IN_PROGRESS"
          query={activeActions}
        />
        <KpiCard
          icon={CalendarClock}
          label="Formações este mês"
          hint="startDate no mês corrente"
          query={thisMonth}
        />
        <KpiCard
          icon={FileWarning}
          label="Docs Pendentes"
          hint="assinaturas sem signedAt"
          query={pendingDocs}
        />
        <KpiCard
          icon={Users}
          label="Total Formandos"
          hint="trainees isActive = true"
          query={activeTrainees}
        />
      </div>

      <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-4 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-muted-foreground">
          KPIs calculados sobre colunas e enums reais do Supabase. Docs
          Pendentes conta assinaturas ainda sem data em signedAt.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Últimas ações</h2>
        <DataTable
          columns={columns}
          data={rows}
          isLoading={lastActions.isLoading}
          emptyMessage="Sem ações visíveis."
          searchPlaceholder="Pesquisar ações..."
          pageSize={10}
        />
      </div>
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  hint,
  query,
}: {
  icon: LucideIcon
  label: string
  hint: string
  query: { data?: number; isLoading: boolean; isError: boolean }
}) {
  const value = query.isLoading
    ? "..."
    : query.isError
      ? "erro"
      : (query.data ?? 0)

  return (
    <div className="rounded-lg border bg-background p-6">
      <Icon className="mb-2 h-5 w-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
