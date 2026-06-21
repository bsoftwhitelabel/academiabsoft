import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  PlusCircle,
  Download,
  GraduationCap,
  MoreVertical,
  Pencil,
  Trash2,
  BarChart3,
  Star,
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
import { ErrorState } from "@/components/feedback/ErrorState"
import { useTrainingAreas } from "@/hooks/useLookups"
import { useCourses, useDeleteCourse } from "./useCourses"
import { useCourseAggregates } from "./useCourseAggregates"
import { CourseForm } from "./CourseForm"
import type { Course } from "@/types/domain"

// ============================================================
// HELPERS
// ============================================================

function formatBadge(format: string | null | undefined) {
  switch (format) {
    case "PRESENCIAL":
      return <Badge variant="outline">Presencial</Badge>
    case "ELEARNING":
      return <Badge variant="outline">E-learning</Badge>
    case "BLENDED":
      return <Badge variant="outline">Misto</Badge>
    default:
      return <Badge variant="outline">{format ?? "—"}</Badge>
  }
}

function CompletionCell({ rate }: { rate: number | null }) {
  if (rate == null) return <span className="text-muted-foreground">—</span>
  const pct = Math.round(rate * 100)
  const colorClass =
    pct >= 75 ? "bg-success" : pct >= 40 ? "bg-primary" : "bg-destructive"
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums w-9 text-right">
        {pct}%
      </span>
    </div>
  )
}

function RatingCell({
  avg,
  count,
}: {
  avg: number | null
  count: number
}) {
  if (avg == null) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex items-center gap-1.5">
      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
      <span className="text-sm font-medium tabular-nums">
        {avg.toFixed(1)}
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">
        ({count})
      </span>
    </div>
  )
}

// ============================================================
// PAGE
// ============================================================

const PAGE_SIZES = [10, 20, 50] as const
const ALL = "all"

export function CoursesPage() {
  const areas = useTrainingAreas()
  const del = useDeleteCourse()

  const [areaId, setAreaId] = useState(ALL)
  const [format, setFormat] = useState(ALL)
  const [statusFilter, setStatusFilter] = useState(ALL)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(10)

  const [editing, setEditing] = useState<Course | null>(null)
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState<Course | null>(null)

  const query = useCourses({
    areaId: areaId === ALL ? undefined : areaId,
    format: format === ALL ? undefined : format,
  })

  const filtered = useMemo(() => {
    let list = query.data ?? []
    if (statusFilter !== ALL) list = list.filter((c) => c.status === statusFilter)
    const lc = search.trim().toLowerCase()
    if (lc) list = list.filter((c) => c.name.toLowerCase().includes(lc))
    return list
  }, [query.data, statusFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const from = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, filtered.length)
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  // Agregados (taxa de conclusão + média avaliação) só para as linhas visíveis.
  const visibleIds = useMemo(() => pageRows.map((c) => c.id), [pageRows])
  const aggregates = useCourseAggregates(visibleIds)

  function bumpToPage1() {
    setPage(1)
  }

  function clearFilters() {
    setAreaId(ALL)
    setFormat(ALL)
    setStatusFilter(ALL)
    setSearch("")
    setPage(1)
  }

  function exportCSV() {
    const headers = [
      "Código",
      "Nome",
      "Sigla",
      "Formato",
      "Horas",
      "Estado",
      "Taxa Conclusão",
      "Média Avaliação",
    ]
    const lines = (filtered ?? []).map((c) => {
      const agg = aggregates.data?.[c.id]
      return [
        c.code ?? "",
        c.name,
        c.sigla ?? "",
        c.format ?? "",
        c.durationHours ?? "",
        c.status ?? "",
        agg?.completion.rate != null ? `${Math.round(agg.completion.rate * 100)}%` : "",
        agg?.rating.avg != null ? agg.rating.avg.toFixed(2) : "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    })
    const csv = [headers.join(","), ...lines].join("\r\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `cursos_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function confirmDelete() {
    if (!deleting) return
    try {
      await del.mutateAsync(deleting.id)
      toast.success("Curso eliminado")
      setDeleting(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao eliminar")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cursos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catálogo de cursos do tenant — referenciais para as Ações de Formação.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Curso
        </Button>
      </div>

      {/* Filtros */}
      <div className="rounded-lg border border-border bg-card p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px] space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Pesquisar
          </label>
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              bumpToPage1()
            }}
            placeholder="Nome do curso..."
            className="h-9"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Formato
          </label>
          <Select
            value={format}
            onValueChange={(v) => {
              setFormat(v)
              bumpToPage1()
            }}
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os formatos</SelectItem>
              <SelectItem value="PRESENCIAL">Presencial</SelectItem>
              <SelectItem value="ELEARNING">E-learning</SelectItem>
              <SelectItem value="BLENDED">Misto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Área
          </label>
          <Select
            value={areaId}
            onValueChange={(v) => {
              setAreaId(v)
              bumpToPage1()
            }}
          >
            <SelectTrigger className="h-9 w-[200px]">
              <SelectValue placeholder="Todas as áreas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas as áreas</SelectItem>
              {(areas.data ?? []).map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.citeCode ? `${a.citeCode} · ${a.name}` : a.name}
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
              bumpToPage1()
            }}
          >
            <SelectTrigger className="h-9 w-[160px]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os estados</SelectItem>
              <SelectItem value="DRAFT">Rascunho</SelectItem>
              <SelectItem value="PUBLISHED">Publicado</SelectItem>
              <SelectItem value="FEATURED">Destaque</SelectItem>
              <SelectItem value="ARCHIVED">Arquivado</SelectItem>
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
      {query.isError ? (
        <ErrorState message={(query.error as Error)?.message} />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {query.isLoading ? (
            <div className="p-3">
              <TableSkeleton cols={7} />
            </div>
          ) : (
            <Table className="tabular-nums">
              <TableHeader className="bg-muted">
                <TableRow className="hover:bg-muted">
                  <TableHead className="h-10 w-[120px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Código
                  </TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Nome
                  </TableHead>
                  <TableHead className="h-10 w-[140px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Média de Avaliação
                  </TableHead>
                  <TableHead className="h-10 w-[180px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Taxa de Conclusão
                  </TableHead>
                  <TableHead className="h-10 w-[140px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Formato
                  </TableHead>
                  <TableHead className="h-10 w-[80px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Horas
                  </TableHead>
                  <TableHead className="h-10 w-[100px] text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {pageRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      Sem cursos para os filtros actuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((c) => {
                    const agg = aggregates.data?.[c.id]
                    return (
                      <TableRow
                        key={c.id}
                        className="group hover:bg-muted/50 border-0"
                      >
                        <TableCell className="py-2 font-medium text-foreground">
                          {c.code ?? "—"}
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                              <GraduationCap className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/admin/courses/${c.id}`}
                                className="text-sm font-semibold text-foreground hover:text-primary hover:underline"
                              >
                                {c.name}
                              </Link>
                              {c.sigla && (
                                <p className="text-xs text-muted-foreground">
                                  {c.sigla}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <RatingCell
                            avg={agg?.rating.avg ?? null}
                            count={agg?.rating.count ?? 0}
                          />
                        </TableCell>
                        <TableCell className="py-2">
                          <CompletionCell rate={agg?.completion.rate ?? null} />
                        </TableCell>
                        <TableCell className="py-2">
                          {formatBadge(c.format)}
                        </TableCell>
                        <TableCell className="py-2 text-muted-foreground">
                          {c.durationHours ?? "—"}h
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              asChild
                              aria-label="Ver detalhe"
                            >
                              <Link to={`/admin/courses/${c.id}`}>
                                <BarChart3 className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditing(c)
                                setOpen(true)
                              }}
                              aria-label="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  aria-label="Mais ações"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem asChild>
                                  <Link to={`/admin/courses/${c.id}`}>
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    Ver detalhe
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setEditing(c)
                                    setOpen(true)
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={(e) => {
                                    e.preventDefault()
                                    setDeleting(c)
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
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}

          {/* Paginação */}
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs">
            <div className="flex items-center gap-3">
              <p className="text-muted-foreground tabular-nums">
                A mostrar {from}-{to} de {filtered.length} cursos
              </p>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Linhas:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v))
                    bumpToPage1()
                  }}
                >
                  <SelectTrigger className="h-7 w-[70px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                Anterior
              </Button>
              <span className="px-2 text-muted-foreground tabular-nums">
                {safePage} / {totalPages}
              </span>
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
      )}

      {/* Modal Novo/Editar */}
      <CourseForm open={open} onOpenChange={setOpen} course={editing} />

      {/* Dialog confirmação Eliminar */}
      <Dialog
        open={!!deleting}
        onOpenChange={(o) => {
          if (!o) setDeleting(null)
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar curso?</DialogTitle>
            <DialogDescription>
              {deleting
                ? `Vais eliminar "${deleting.name}". Esta acção não pode ser desfeita.`
                : "Esta acção não pode ser desfeita."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>
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
