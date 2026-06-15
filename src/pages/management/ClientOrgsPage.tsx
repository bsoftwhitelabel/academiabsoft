import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { EntityListPage } from "./EntityListPage"
import { ClientOrgForm } from "./ClientOrgForm"
import { clientOrgsCrud } from "./entities"
import type { ClientOrg } from "@/types/domain"

const columns: ColumnDef<ClientOrg>[] = [
  { accessorKey: "name", header: "Nome" },
  { accessorKey: "code", header: "Código" },
  { accessorKey: "nif", header: "NIF" },
  { accessorKey: "city", header: "Cidade" },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "isActive",
    header: "Ativa",
    cell: ({ getValue }) => (getValue() ? "Sim" : "Não"),
  },
]

export function ClientOrgsPage() {
  const query = clientOrgsCrud.useList()
  const remove = clientOrgsCrud.useRemove()
  const [editing, setEditing] = useState<ClientOrg | null>(null)
  const [open, setOpen] = useState(false)

  async function handleDelete(id: string) {
    try {
      await remove.mutateAsync(id)
      toast.success("Entidade eliminada")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao eliminar")
    }
  }

  return (
    <EntityListPage
      title="Entidades Cliente"
      description="Empresas que contratam ações de formação."
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
      exportFileName="entidades_cliente"
      searchPlaceholder="Pesquisar entidades..."
    >
      <ClientOrgForm open={open} onOpenChange={setOpen} row={editing} />
    </EntityListPage>
  )
}
