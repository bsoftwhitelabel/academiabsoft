import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { EntityListPage } from "./EntityListPage"
import { RoomForm } from "./RoomForm"
import { roomsCrud } from "./entities"
import type { Room } from "@/types/domain"

const columns: ColumnDef<Room>[] = [
  { accessorKey: "name", header: "Nome" },
  { accessorKey: "capacity", header: "Capacidade" },
  { accessorKey: "address", header: "Morada" },
  { accessorKey: "city", header: "Cidade" },
  {
    accessorKey: "isActive",
    header: "Ativa",
    cell: ({ getValue }) => (getValue() ? "Sim" : "Não"),
  },
]

export function RoomsPage() {
  const query = roomsCrud.useList()
  const remove = roomsCrud.useRemove()
  const [editing, setEditing] = useState<Room | null>(null)
  const [open, setOpen] = useState(false)

  async function handleDelete(id: string) {
    try {
      await remove.mutateAsync(id)
      toast.success("Sala eliminada")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao eliminar")
    }
  }

  return (
    <EntityListPage
      title="Salas"
      description="Salas e espaços onde decorrem as ações presenciais."
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
      exportFileName="salas"
      searchPlaceholder="Pesquisar salas..."
    >
      <RoomForm open={open} onOpenChange={setOpen} row={editing} />
    </EntityListPage>
  )
}
