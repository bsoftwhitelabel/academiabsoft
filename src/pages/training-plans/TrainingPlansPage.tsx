import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import {
  PlusCircle,
  Download,
  FileText,
  MoreVertical,
  Pencil,
  Trash2,
  Archive,
  BarChart3,
  Clock,
  BadgeCheck,
  Users,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import {
  useTrainingPlans,
  useDeleteTrainingPlan,
  useUpsertTrainingPlan,
} from "./useTrainingPlans"
import { TrainingPlanForm } from "./TrainingPlanForm"
import type { TrainingPlan } from "@/types/domain"

// ============================================================
// HELPERS
// ============================================================

const PAGE_SIZE = 10

const EUR_INT = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
})

const REL = new Intl.RelativeTimeFormat("pt-PT", { numeric: "auto" })

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—"
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return "—"
  const diffMs = t - Date.now()
  const minutes = Math.round(diffMs / 60000)
  const hours = Math.round(minutes / 60)
  const days = Math.round(hours / 24)
  const months = Math.round(days / 30)
  if (Math.abs(minutes) < 60) return REL.format(minutes, "minute")
  if (Math.abs(hours) < 24) return REL.format(hours, "hour")
  if (Math.abs(days) < 30) return REL.format(days, "day")
  return REL.format(months, "month")
}

function statusBadge(status: string | null) {
  switch (status) {
    case "PUBLISHED":
      return <Badge variant="info">Publicado</Badge>
    case "ACTIVE":
      return <Badge variant="info">Activo</Badge>
    case "UNDER_REVIEW":
      return <Badge variant="warning">Em revisão</Badge>
    case "ARCHIVED":
      return <Badge variant="neutral">Arquivado</Badge>
    case "DRAFT":
      return <Badge variant="neutral">Rascunho</Badge>
    default:
      return <Badge variant="neutral">{status ?? "—"}</Badge>
  }
}

function fmtEUR(value: number | null | undefined): string {
  if (value == null) return "—"
  return EUR_INT.format(value)
}

// ============================================================
// BENTO (KPI cards)
// ============================================================

function useExecutionRate() {
  const session = useAuthStore((s) => s.session)
  const user = useCurrentUser()
  const tenantId = user.data?.tenantId ?? null
  return useQuery({
    queryKey: ["plans-bento", "execution", tenantId],
    enabled: !!session && !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_actions")
        .select("status, planId")
        .eq("tenantId", tenantId as string)
        .not("planId", "is", null)
        .limit(5000)
      if (error) throw error
      const rows = (data ?? []) as { status: string | null; planId: string | null }[]
      const total = rows.length
      const completed = rows.filter((r) => r.status === "COMPLETED").length
      return { total, completed }
    },
  })
}

function useTraineesCount() {
  const session = useAuthStore((s) => s.session)
  const user = useCurrentUser()
  const tenantId = user.data?.tenantId ?? null
  return useQuery({
    queryKey: ["plans-bento", "trainees-count", tenantId],
    enabled: !!session && !!tenantId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("trainees")
        .select("*", { count: "exact", head: true })
        .eq("tenantId", tenantId as string)
        .eq("isActive", true)
      if (error) throw error
      return count ?? 0
    },
  })
}

function BentoCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums leading-none text-foreground">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// ============================================================
// PAGE
// ============================================================

const EDIT_PATH = (id: string) => `/admin/training-plans/${id}`

export function TrainingPlansPage() {
  const navigate = useNavigate()
  const query = useTrainingPlans()
  const del = useDeleteTrainingPlan()
  const upsert = useUpsertTrainingPlan()
  const [open, setOpen] = useState(false)
  const [deletingPlan, setDeletingPlan] = useState<TrainingPlan | null>(null)

  const [yearFilter, setYearFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const exec = useExecutionRate()
  const trainees = useTraineesCount()

  const years = useMemo(() => {
    const set = new Set<number>()
    for (const p of query.data ?? []) if (p.year) set.add(p.year)
    return [...set].sort((a, b) => b - a)
  }, [query.data])

  const statuses = useMemo(() => {
    const set = new Set<string>()
    for (const p of query.data ?? []) if (p.status) set.add(p.status)
    return [...set]
  }, [query.data])

  const filtered = useMemo(() => {
    let list = query.data ?? []
    if (yearFilter !== "all") list = list.filter((p) => String(p.year) === yearFilter)
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter)
    if (typeFilter !== "all") {
      const wantInternal = typeFilter === "internal"
      list = list.filter((p) => !!p.isInternal === wantInternal)
    }
    const lc = search.trim().toLowerCase()
    if (lc) {
      list = list.filter((p) => p.name.toLowerCase().includes(lc))
    }
    return list
  }, [query.data, yearFilter, statusFilter, typeFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const from = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const to = Math.min(safePage * PAGE_SIZE, filtered.length)
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Bento metrics
  const totalBudget = (query.data ?? []).reduce(
    (acc, p) => acc + (Number(p.budget) || 0),
    0
  )
  const activePlans = (query.data ?? []).filter(
    (p) => p.status === "PUBLISHED" || p.status === "UNDER_REVIEW"
  ).length
  const executionRate =
    exec.data && exec.data.total > 0
      ? `${Math.round((exec.data.completed / exec.data.total) * 100)}%`
      : "—"

  async function confirmDelete() {
    if (!deletingPlan) return
    try {
      await del.mutateAsync(deletingPlan.id)
      toast.success("Plano eliminado")
      setDeletingPlan(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao eliminar")
    }
  }

  async function handleArchive(plan: TrainingPlan) {
    try {
      await upsert.mutateAsync({
        id: plan.id,
        tenantId: plan.tenantId,
        input: {
          name: plan.name,
          year: plan.year,
          startDate: plan.startDate,
          endDate: plan.endDate,
          isInternal: plan.isInternal,
          budget: plan.budget,
          status: "ARCHIVED",
        },
      })
      toast.success("Plano arquivado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao arquivar")
    }
  }

  function clearFilters() {
    setYearFilter("all")
    setStatusFilter("all")
    setTypeFilter("all")
    setSearch("")
    setPage(1)
  }

  function exportCSV() {
    const headers = ["Nome", "Ano", "Interno", "Estado", "Início", "Fim", "Orçamento"]
    const lines = (filtered ?? []).map((p) =>
      [
        p.name,
        p.year ?? "",
        p.isInternal ? "Sim" : "Não",
        p.status ?? "",
        p.startDate?.slice(0, 10) ?? "",
        p.endDate?.slice(0, 10) ?? "",
        p.budget ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    )
    const csv = [headers.join(","), ...lines].join("\r\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `planos_formacao_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Guard: ignora clique vindo de elementos interactivos dentro da linha
  function handleRowClick(e: React.MouseEvent, id: string) {
    const target = e.target as HTMLElement | null
    if (!target) return
    if (target.closest("button, a, [role='menuitem'], [role='menu'], [data-no-row-click]")) {
      return
    }
    navigate(EDIT_PATH(id))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Planos de Formação
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gere os planos pedagógicos do tenant, orçamentos e estados.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {/* Filtros */}
      <div className="rounded-lg border border-border bg-card p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px] space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Pesquisar
          </label>
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            placeholder="Nome do plano..."
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Ano</label>
          <Select
            value={yearFilter}
            onValueChange={(v) => {
              setYearFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os anos</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Estado
          </label>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              <SelectItem value="DRAFT">Rascunho</SelectItem>
              <SelectItem value="UNDER_REVIEW">Em revisão</SelectItem>
              <SelectItem value="PUBLISHED">Publicado</SelectItem>
              <SelectItem value="ARCHIVED">Arquivado</SelectItem>
              {statuses
                .filter(
                  (s) =>
                    !["DRAFT", "UNDER_REVIEW", "PUBLISHED", "ARCHIVED"].includes(s)
                )
                .map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Tipo</label>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="internal">Interno</SelectItem>
              <SelectItem value="external">Externo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={clearFilters}>
          Limpar Filtros
        </Button>
        <Button variant="secondary" onClick={exportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {query.isLoading ? (
          <div className="p-3">
            <TableSkeleton cols={5} />
          </div>
        ) : (
          <Table className="tabular-nums">
            <TableHeader className="bg-muted">
              <TableRow className="hover:bg-muted">
                <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Nome do Plano
                </TableHead>
                <TableHead className="h-10 w-[100px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Ano
                </TableHead>
                <TableHead className="h-10 w-[110px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Interno
                </TableHead>
                <TableHead className="h-10 w-[140px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Orçamento
                </TableHead>
                <TableHead className="h-10 w-[140px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Estado
                </TableHead>
                <TableHead className="h-10 w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {pageRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    Sem planos.
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((p) => (
                  <TableRow
                    key={p.id}
                    className="group hover:bg-muted/50 border-0 cursor-pointer"
                    onClick={(e) => handleRowClick(e, p.id)}
                  >
                    <TableCell className="py-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {p.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Atualizado {timeAgo(p.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">{p.year ?? "—"}</TableCell>
                    <TableCell className="py-2">
                      {p.isInternal ? "Sim" : "Não"}
                    </TableCell>
                    <TableCell className="py-2 text-muted-foreground">
                      {fmtEUR(p.budget ?? null)}
                    </TableCell>
                    <TableCell className="py-2">
                      {statusBadge(p.status ?? null)}
                    </TableCell>
                    <TableCell
                      className="py-2 text-right"
                      data-no-row-click
                    >
                      <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Ações"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild>
                              <Link to={EDIT_PATH(p.id)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleArchive(p)}>
                              <Archive className="mr-2 h-4 w-4" />
                              Arquivar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => {
                                e.preventDefault()
                                setDeletingPlan(p)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* Paginação */}
        <footer className="flex items-center justify-between border-t border-border px-4 py-3 text-xs">
          <p className="text-muted-foreground tabular-nums">
            A mostrar {from}-{to} de {filtered.length} planos
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
            >
              Próxima
            </Button>
          </div>
        </footer>
      </div>

      {/* Bento KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BentoCard
          icon={BarChart3}
          label="Total Orçamentado"
          value={fmtEUR(totalBudget)}
          hint="Soma dos orçamentos dos planos"
        />
        <BentoCard
          icon={Clock}
          label="Planos Ativos"
          value={String(activePlans)}
          hint="Publicado ou em revisão"
        />
        <BentoCard
          icon={BadgeCheck}
          label="Taxa de Execução"
          value={executionRate}
          hint="Ações concluídas vs total"
        />
        <BentoCard
          icon={Users}
          label="Formandos Abrangidos"
          value={(trainees.data ?? 0).toLocaleString("pt-PT")}
          hint="Formandos activos"
        />
      </div>

      {/* Modal Novo */}
      <TrainingPlanForm open={open} onOpenChange={setOpen} />

      {/* Dialog confirmação eliminar */}
      <Dialog
        open={!!deletingPlan}
        onOpenChange={(o) => {
          if (!o) setDeletingPlan(null)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar plano?</DialogTitle>
            <DialogDescription>
              {deletingPlan
                ? `Vais eliminar "${deletingPlan.name}". Esta acção não pode ser desfeita.`
                : "Esta acção não pode ser desfeita."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDeletingPlan(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={del.isPending}
            >
              {del.isPending ? "A eliminar..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
