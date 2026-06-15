import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  Copy,
  MoreHorizontal,
  Plus,
  Trash2,
  Mail,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  useActionCampaigns,
  useCampaignResponses,
  type CampaignResponseRow,
  type CampaignSummary,
} from "./useActionCampaigns"
import { useDeleteCampaign } from "./useCampaignMutations"
import { NewCampaignDialog } from "./NewCampaignDialog"

interface Props {
  trainingActionId: string
  actionCode: string | null
}

function respondentName(r: CampaignResponseRow): string {
  if (r.trainee) {
    return (
      `${r.trainee.firstName ?? ""} ${r.trainee.lastName ?? ""}`.trim() || "—"
    )
  }
  if (r.trainer) {
    return (
      `${r.trainer.firstName ?? ""} ${r.trainer.lastName ?? ""}`.trim() || "—"
    )
  }
  return "—"
}

function tone(pct: number): string {
  if (pct >= 75) return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (pct >= 50) return "border-amber-200 bg-amber-50 text-amber-800"
  return "border-rose-200 bg-rose-50 text-rose-800"
}

function publicUrl(token: string): string {
  // /q/{token} é servido pela mesma SPA (Fase 2b). Origin do browser.
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:5173"
  return `${base}/q/${token}`
}

async function copyToClipboard(text: string, successMsg: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(successMsg)
  } catch {
    toast.error("Não foi possível copiar para o clipboard")
  }
}

export function CampaignsTab({ trainingActionId, actionCode }: Props) {
  const campaigns = useActionCampaigns(trainingActionId)
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const list = campaigns.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Campanhas de Avaliação</h3>
          <p className="text-sm text-muted-foreground">
            Aplica questionários-template a esta acção e gera links únicos por respondente.
          </p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {campaigns.isLoading ? (
        <p className="text-sm text-muted-foreground">A carregar...</p>
      ) : list.length === 0 ? (
        <div className="rounded-md border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
          Ainda não há campanhas de avaliação para esta acção.
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((c) => (
            <CampaignCard
              key={c.questionnaireId}
              campaign={c}
              trainingActionId={trainingActionId}
              actionCode={actionCode}
              expanded={expanded === c.questionnaireId}
              onToggle={() =>
                setExpanded((e) =>
                  e === c.questionnaireId ? null : c.questionnaireId
                )
              }
            />
          ))}
        </div>
      )}

      {open && (
        <NewCampaignDialog
          open={open}
          onOpenChange={setOpen}
          trainingActionId={trainingActionId}
        />
      )}
    </div>
  )
}

function CampaignCard({
  campaign,
  trainingActionId,
  actionCode,
  expanded,
  onToggle,
}: {
  campaign: CampaignSummary
  trainingActionId: string
  actionCode: string | null
  expanded: boolean
  onToggle: () => void
}) {
  const responses = useCampaignResponses(
    trainingActionId,
    expanded ? campaign.questionnaireId : undefined
  )
  const del = useDeleteCampaign()
  const pct =
    campaign.total === 0
      ? 0
      : Math.round((campaign.responded / campaign.total) * 100)

  async function handleDelete() {
    if (
      !window.confirm(
        `Apagar a campanha "${campaign.questionnaireName}"? Serão removidos ${campaign.pending} links pendentes.`
      )
    )
      return
    if (!window.confirm("Confirmação final: esta acção é irreversível.")) return
    try {
      await del.mutateAsync({
        trainingActionId,
        questionnaireId: campaign.questionnaireId,
      })
      toast.success("Campanha apagada")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao apagar campanha")
    }
  }

  async function handleCopyAll() {
    const rows = responses.data ?? []
    if (rows.length === 0) {
      toast.error("Sem links para copiar — expande a campanha primeiro.")
      return
    }
    const lines = [
      `Avaliação: ${campaign.questionnaireName}`,
      `Acção: ${actionCode ?? "—"}`,
      "----------------------------------",
      ...rows.map((r) => `${respondentName(r)}: ${publicUrl(r.token)}`),
    ]
    await copyToClipboard(lines.join("\n"), "Lista de links copiada")
  }

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex items-start gap-2 p-4">
        <button
          type="button"
          onClick={onToggle}
          className="mt-1 text-muted-foreground hover:text-foreground"
          aria-label={expanded ? "Recolher" : "Expandir"}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{campaign.questionnaireName}</p>
            <Badge variant="secondary">
              {campaign.targetRole === "TRAINEE" ? "Formando" : "Formador"}
            </Badge>
          </div>
          <div
            className={cn(
              "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
              tone(pct)
            )}
          >
            {campaign.responded} de {campaign.total} respondidas · {pct}%
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAll}
            disabled={!expanded || responses.isLoading}
            title={
              expanded
                ? "Copiar lista formatada de todos os links"
                : "Expande a campanha para copiar"
            }
          >
            <Mail className="mr-2 h-4 w-4" />
            Copiar Todos os Links
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onToggle}>
                {expanded ? "Recolher detalhe" : "Ver Detalhe"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Apagar Campanha
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {expanded && (
        <div className="border-t p-4 pt-3">
          {responses.isLoading ? (
            <p className="text-sm text-muted-foreground">A carregar...</p>
          ) : (
            <ResponsesTable rows={responses.data ?? []} />
          )}
        </div>
      )}
    </div>
  )
}

function ResponsesTable({ rows }: { rows: CampaignResponseRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sem respondentes nesta campanha.
      </p>
    )
  }
  return (
    <div className="rounded-md border bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Respondente</TableHead>
            <TableHead>Link de Resposta</TableHead>
            <TableHead className="w-28">Estado</TableHead>
            <TableHead className="w-40">Submetido em</TableHead>
            <TableHead className="w-28" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const url = publicUrl(r.token)
            const submitted = !!r.respondedAt
            return (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  {respondentName(r)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={url}
                      className="h-8 font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(url, "Link copiado")}
                      title="Copiar link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      submitted
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-muted bg-muted text-muted-foreground"
                    }
                  >
                    {submitted ? "Respondido" : "Pendente"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {r.respondedAt
                    ? new Date(r.respondedAt).toLocaleString("pt-PT")
                    : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(url, "Link copiado")}
                    >
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      Copiar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
