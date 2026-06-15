import type { ColumnDef } from "@tanstack/react-table"
import type { Row } from "@/hooks/useSupabaseTable"

function format(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

/**
 * Deriva colunas a partir das chaves reais das linhas devolvidas pelo banco.
 * Nenhum nome de coluna é inventado: tudo vem do que o Supabase retorna.
 */
export function buildAutoColumns(rows: Row[]): ColumnDef<Row>[] {
  if (!rows.length) return []
  return Object.keys(rows[0]).map((key) => ({
    accessorKey: key,
    header: key,
    cell: ({ getValue }) => {
      const text = format(getValue())
      return (
        <span className="block max-w-xs truncate" title={text}>
          {text}
        </span>
      )
    },
  }))
}
