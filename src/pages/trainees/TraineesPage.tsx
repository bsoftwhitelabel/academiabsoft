import { useMemo, useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { AlertCircle, Pencil, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { DataTable } from "@/components/data-table/DataTable"
import { ErrorState } from "@/components/feedback/ErrorState"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useClientOrgs } from "@/hooks/useLookups"
import {
  useTrainees,
  useDeleteTrainee,
  traineeHasPending,
} from "./useTrainees"
import { TraineeForm } from "./TraineeForm"
import type { Trainee } from "@/types/domain"

type PendingFilter = "ALL" | "PENDING" | "OK"

export function TraineesPage() {
  const [clientOrgId, setClientOrgId] = useState<string | undefined>(undefined)
  const [pending, setPending] = useState<PendingFilter>("ALL")
  const [editing, setEditing] = useState<Trainee | null>(null)
  const [open, setOpen] = useState(false)
  const orgs = useClientOrgs()
  const query = useTrainees(clientOrgId)
  const del = useDeleteTrainee()

  const rows = useMemo(() => {
    let list = query.data ?? []
    if (pending === "PENDING") list = list.filter(traineeHasPending)
    if (pending === "OK") list = list.filter((t) => !traineeHasPending(t))
    return list
  }, [query.data, pending])

  async function handleDelete(id: string) {
    try {
      await del.mutateAsync(id)
      toast.success("Formando eliminado")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao eliminar")
    }
  }

  const columns: ColumnDef<Trainee>[] = [
    {
      id: "pending",
      header: "",
      cell: ({ row }) =>
        traineeHasPending(row.original) ? (
          <span title="NIF, data de nascimento ou nº de identificação em falta">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </span>
        ) : null,
    },
    { accessorKey: "firstName", header: "Nome" },
    { accessorKey: "lastName", header: "Apelido" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "nif", header: "NIF" },
    { accessorKey: "city", header: "Cidade" },
    {
      accessorKey: "isActive",
      header: "Activo",
      cell: ({ getValue }) => (getValue() ? "Sim" : "Não"),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setEditing(row.original)
              setOpen(true)
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Formandos</h1>
          {clientOrgId && !query.isLoading && (
            <Badge variant="secondary">{rows.length}</Badge>
          )}
        </div>
        <Button
          disabled={!clientOrgId}
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={clientOrgId ?? ""}
          onValueChange={(v) => setClientOrgId(v)}
        >
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Selecione a entidade cliente (obrigatório)" />
          </SelectTrigger>
          <SelectContent>
            {(orgs.data ?? []).map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={pending}
          onValueChange={(v) => setPending(v as PendingFilter)}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Pendências" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="PENDING">Com pendências DGERT</SelectItem>
            <SelectItem value="OK">Perfil completo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!clientOrgId ? (
        <div className="rounded-md border bg-muted/40 p-6 text-sm text-muted-foreground">
          A listagem de formandos é sempre filtrada por entidade cliente.
          Selecione uma entidade acima para carregar os formandos.
        </div>
      ) : query.isError ? (
        <ErrorState message={(query.error as Error)?.message} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          isLoading={query.isLoading}
          emptyMessage="Sem formandos para esta entidade."
          searchPlaceholder="Pesquisar por nome..."
          exportFileName="formandos"
        />
      )}

      {clientOrgId && (
        <TraineeForm
          open={open}
          onOpenChange={setOpen}
          trainee={editing}
          clientOrgId={clientOrgId}
        />
      )}
    </div>
  )
}
