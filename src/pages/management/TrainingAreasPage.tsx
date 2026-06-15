import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { EntityListPage } from "./EntityListPage"
import { TrainingAreaForm } from "./TrainingAreaForm"
import { trainingAreasCrud } from "./entities"
import type { TrainingArea } from "@/types/domain"

const columns: ColumnDef<TrainingArea>[] = [
  { accessorKey: "citeCode", header: "CITE" },
  { accessorKey: "name", header: "Nome" },
  {
    accessorKey: "catalogVisible",
    header: "Catálogo",
    cell: ({ getValue }) => (getValue() ? "Sim" : "Não"),
  },
  { accessorKey: "catalogOrder", header: "Ordem" },
  {
    accessorKey: "isActive",
    header: "Ativa",
    cell: ({ getValue }) => (getValue() ? "Sim" : "Não"),
  },
]

export function TrainingAreasPage() {
  const query = trainingAreasCrud.useList()
  const remove = trainingAreasCrud.useRemove()
  const [editing, setEditing] = useState<TrainingArea | null>(null)
  const [open, setOpen] = useState(false)

  async function handleDelete(id: string) {
    try {
      await remove.mutateAsync(id)
      toast.success("Área eliminada")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao eliminar")
    }
  }

  return (
    <EntityListPage
      title="Áreas de Formação"
      description="Áreas CITE usadas para classificar cursos."
      columns={columns}
      query={query}
      onNew={() => {
        setEditing(null)
        setOpen(true)
      }}
      onEdit={(r) => {
        setEditing(r)
        setOpen(true)
      }}
      onDelete={handleDelete}
      exportFileName="areas_formacao"
      searchPlaceholder="Pesquisar áreas..."
    >
      <TrainingAreaForm open={open} onOpenChange={setOpen} row={editing} />
    </EntityListPage>
  )
}
