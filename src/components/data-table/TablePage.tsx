import { useMemo } from "react"
import { Info, Plus } from "lucide-react"
import { DataTable } from "@/components/data-table/DataTable"
import { buildAutoColumns } from "@/components/data-table/autoColumns"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTableRows, useTableCount } from "@/hooks/useSupabaseTable"

interface Props {
  table: string
  title: string
  description?: string
}

/**
 * Página de lista genérica. Renderiza as colunas reais devolvidas pelo
 * Supabase (sem inventar nomes). O botão Novo fica desabilitado até o
 * schema das colunas ser confirmado (regra 3 do documento).
 */
export function TablePage({ table, title, description }: Props) {
  const rowsQuery = useTableRows(table)
  const countQuery = useTableCount(table)

  const rows = rowsQuery.data ?? []
  const columns = useMemo(() => buildAutoColumns(rows), [rows])

  if (rowsQuery.isError) {
    return (
      <div className="space-y-6">
        <Header title={title} description={description} count={undefined} />
        <ErrorState message={(rowsQuery.error as Error)?.message} />
      </div>
    )
  }

  const empty = !rowsQuery.isLoading && rows.length === 0

  return (
    <div className="space-y-6">
      <Header
        title={title}
        description={description}
        count={countQuery.data}
      />

      {empty && (
        <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-4 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-medium">Sem registos visíveis</p>
            <p className="text-muted-foreground">
              A tabela <code>{table}</code> existe mas não devolveu linhas
              para este utilizador. Quase certamente é a RLS a filtrar. Veja
              os passos de remediação no Supabase para liberar a leitura.
            </p>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={rows}
        isLoading={rowsQuery.isLoading}
        emptyMessage="Sem registos."
        searchPlaceholder={`Pesquisar em ${title.toLowerCase()}...`}
        exportFileName={table}
      />
    </div>
  )
}

function Header({
  title,
  description,
  count,
}: {
  title: string
  description?: string
  count: number | undefined
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {typeof count === "number" && (
            <Badge variant="secondary">{count}</Badge>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Button disabled title="Campos pendentes de confirmação do schema (regra 3)">
        <Plus className="mr-2 h-4 w-4" />
        Novo
      </Button>
    </div>
  )
}
