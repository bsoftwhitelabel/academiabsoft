import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import type { ColumnDef } from "@tanstack/react-table"
import { Plus, MoreHorizontal, Copy, Trash2, ExternalLink } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDefaultTenantId } from "@/hooks/useDefaultTenant"
import {
  useQuestionnaires,
  type QuestionnaireWithCount,
} from "./useQuestionnaires"
import {
  useCloneQuestionnaire,
  useDeleteQuestionnaire,
} from "./useQuestionnaireMutations"
import type {
  QuestionnaireContext,
  QuestionnaireTargetRole,
} from "@/types/domain"

const ALL = "ALL"

const ROLE_LABEL: Record<QuestionnaireTargetRole, string> = {
  TRAINEE: "Formando",
  TRAINER: "Formador",
}
const CTX_LABEL: Record<QuestionnaireContext, string> = {
  ACTION: "Acção",
  SESSION: "Sessão",
}
const FORMAT_LABEL: Record<string, string> = {
  PRESENCIAL: "Presencial",
  ELEARNING: "E-Learning",
}

export function QuestionnairesPage() {
  const navigate = useNavigate()
  const tenant = useDefaultTenantId()
  const [role, setRole] = useState<string>(ALL)
  const [ctx, setCtx] = useState<string>(ALL)
  const query = useQuestionnaires({
    targetRole:
      role === ALL ? undefined : (role as QuestionnaireTargetRole),
    context: ctx === ALL ? undefined : (ctx as QuestionnaireContext),
  })
  const clone = useCloneQuestionnaire()
  const del = useDeleteQuestionnaire()
  const rows = useMemo(() => query.data ?? [], [query.data])

  async function handleClone(id: string) {
    if (!tenant.data) {
      toast.error("Sem tenant resolvido")
      return
    }
    try {
      const cloned = await clone.mutateAsync({
        sourceId: id,
        tenantId: tenant.data,
      })
      toast.success("Questionário clonado")
      navigate(`/admin/questionarios/${cloned.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao clonar")
    }
  }

  async function handleDelete(id: string, name: string) {
    if (
      !window.confirm(
        `Apagar o questionário "${name}"? Esta ação é irreversível.`
      )
    )
      return
    try {
      await del.mutateAsync(id)
      toast.success("Questionário apagado")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao apagar")
    }
  }

  const columns: ColumnDef<QuestionnaireWithCount>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <Link
          to={`/admin/questionarios/${row.original.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      id: "targetRole",
      header: "Destinatário",
      accessorFn: (r) => ROLE_LABEL[r.targetRole],
      cell: ({ row }) => (
        <Badge variant="secondary">
          {ROLE_LABEL[row.original.targetRole]}
        </Badge>
      ),
    },
    {
      id: "context",
      header: "Contexto",
      accessorFn: (r) => CTX_LABEL[r.context],
      cell: ({ row }) => (
        <Badge variant="outline">{CTX_LABEL[row.original.context]}</Badge>
      ),
    },
    {
      id: "format",
      header: "Formato",
      accessorFn: (r) => FORMAT_LABEL[r.format] ?? r.format,
    },
    {
      id: "count",
      header: "Nº Perguntas",
      accessorFn: (r) => r.questionCount,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const r = row.original
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => navigate(`/admin/questionarios/${r.id}`)}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleClone(r.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Clonar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => handleDelete(r.id, r.name)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Apagar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Questionários de Avaliação</h1>
          <p className="text-sm text-muted-foreground">
            Modelos de questionários para avaliação de formação.
          </p>
        </div>
        <Button onClick={() => navigate("/admin/questionarios/novo")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Questionário
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Destinatário" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os destinatários</SelectItem>
            <SelectItem value="TRAINEE">Formando</SelectItem>
            <SelectItem value="TRAINER">Formador</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ctx} onValueChange={setCtx}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Contexto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os contextos</SelectItem>
            <SelectItem value="ACTION">Acção</SelectItem>
            <SelectItem value="SESSION">Sessão</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {query.isError ? (
        <ErrorState message={(query.error as Error)?.message} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          isLoading={query.isLoading}
          emptyMessage="Ainda não há questionários. Clica em Novo Questionário."
          searchPlaceholder="Pesquisar por nome..."
          exportFileName="questionarios"
        />
      )}
    </div>
  )
}
