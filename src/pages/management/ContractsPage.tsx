import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { useClientOrgs } from "@/hooks/useLookups"
import { EntityListPage } from "./EntityListPage"
import { ContractForm } from "./ContractForm"
import { contractsCrud } from "./entities"
import type { Contract } from "@/types/domain"

function fmtDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString("pt-PT") : "—"
}

export function ContractsPage() {
  const query = contractsCrud.useList()
  const remove = contractsCrud.useRemove()
  const orgs = useClientOrgs()
  const [editing, setEditing] = useState<Contract | null>(null)
  const [open, setOpen] = useState(false)

  const orgName = useMemo(() => {
    const m = new Map<string, string>()
    for (const o of orgs.data ?? []) m.set(o.id, o.name)
    return m
  }, [orgs.data])

  async function handleDelete(id: string) {
    try {
      await remove.mutateAsync(id)
      toast.success("Contrato eliminado")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao eliminar")
    }
  }

  const columns: ColumnDef<Contract>[] = [
    {
      id: "clientOrg",
      header: "Entidade cliente",
      accessorFn: (r) =>
        (r.clientOrgId && orgName.get(r.clientOrgId)) || r.clientOrgId || "—",
    },
    {
      id: "startDate",
      header: "Início",
      accessorFn: (r) => fmtDate(r.startDate),
    },
    {
      id: "endDate",
      header: "Fim",
      accessorFn: (r) => fmtDate(r.endDate),
    },
    {
      accessorKey: "value",
      header: "Valor",
      cell: ({ getValue }) => {
        const v = getValue<number | null>()
        return v == null ? "—" : v.toLocaleString("pt-PT")
      },
    },
    { accessorKey: "description", header: "Descrição" },
  ]

  return (
    <EntityListPage
      title="Contratos"
      description="Contratos com entidades cliente."
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
      exportFileName="contratos"
      searchPlaceholder="Pesquisar contratos..."
    >
      <ContractForm open={open} onOpenChange={setOpen} row={editing} />
    </EntityListPage>
  )
}
