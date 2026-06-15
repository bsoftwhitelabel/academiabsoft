import type { ReactNode } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type { UseQueryResult } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Pencil, Trash2, Plus, ArrowLeft } from "lucide-react"
import { DataTable } from "@/components/data-table/DataTable"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface Props<T extends { id: string }> {
  title: string
  description?: string
  columns: ColumnDef<T>[]
  query: UseQueryResult<T[], Error>
  onNew: () => void
  onEdit: (row: T) => void
  onDelete: (id: string) => void
  exportFileName: string
  searchPlaceholder?: string
  emptyMessage?: string
  toolbar?: ReactNode
  children?: ReactNode
}

export function EntityListPage<T extends { id: string }>({
  title,
  description,
  columns,
  query,
  onNew,
  onEdit,
  onDelete,
  exportFileName,
  searchPlaceholder,
  emptyMessage,
  toolbar,
  children,
}: Props<T>) {
  const rows = query.data ?? []

  const allColumns: ColumnDef<T>[] = [
    ...columns,
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <Link
        to="/admin/management"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Gestão
      </Link>

      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{title}</h1>
            {!query.isLoading && (
              <Badge variant="secondary">{rows.length}</Badge>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <Button onClick={onNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo
        </Button>
      </div>

      {toolbar && (
        <div className="flex flex-wrap items-center gap-3">{toolbar}</div>
      )}

      {query.isError ? (
        <ErrorState message={query.error?.message} />
      ) : (
        <DataTable
          columns={allColumns}
          data={rows}
          isLoading={query.isLoading}
          emptyMessage={emptyMessage ?? "Sem registos."}
          searchPlaceholder={searchPlaceholder ?? "Pesquisar..."}
          exportFileName={exportFileName}
        />
      )}

      {children}
    </div>
  )
}
