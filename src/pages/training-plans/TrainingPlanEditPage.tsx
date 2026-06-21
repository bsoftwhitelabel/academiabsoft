import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  ChevronRight,
  Lightbulb,
  History,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTenantStore } from "@/stores/tenant.store"
import {
  useTrainingPlan,
  useUpsertTrainingPlan,
  usePlanAuditLogs,
} from "./useTrainingPlans"
import { CurrencyInput } from "./CurrencyInput"
import type { TrainingPlan } from "@/types/domain"

const REL = new Intl.RelativeTimeFormat("pt-PT", { numeric: "auto" })

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—"
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return "—"
  const diffMs = t - Date.now()
  const minutes = Math.round(diffMs / 60000)
  const hours = Math.round(minutes / 60)
  const days = Math.round(hours / 24)
  if (Math.abs(minutes) < 60) return REL.format(minutes, "minute")
  if (Math.abs(hours) < 24) return REL.format(hours, "hour")
  return REL.format(days, "day")
}

const schema = z
  .object({
    name: z.string().min(1, "Nome obrigatório"),
    year: z.coerce
      .number({ message: "Ano numérico obrigatório" })
      .int()
      .min(2000)
      .max(2100),
    startDate: z.string().optional().or(z.literal("")),
    endDate: z.string().optional().or(z.literal("")),
    budget: z.coerce.number().nonnegative("Orçamento >= 0").nullable().optional(),
    isInternal: z.boolean(),
    status: z.string().min(1),
  })
  .refine(
    (v) => {
      if (v.startDate && v.endDate) return v.startDate <= v.endDate
      return true
    },
    { message: "Data fim tem de ser >= data início", path: ["endDate"] }
  )

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

function statusBadge(status: string | null) {
  switch (status) {
    case "PUBLISHED":
      return <Badge variant="info">Publicado</Badge>
    case "UNDER_REVIEW":
      return <Badge variant="warning">Em revisão</Badge>
    case "ARCHIVED":
      return <Badge variant="neutral">Arquivado</Badge>
    case "DRAFT":
      return <Badge variant="neutral">Rascunho</Badge>
    default:
      return <Badge variant="neutral">{status ?? "—"}</Badge>
  }
}

// Mapeia uma row de TrainingPlan para a forma que o react-hook-form espera.
// É usado em `values` (não em defaultValues) para o form re-sincronizar
// automaticamente sempre que `useTrainingPlan(id)` devolver dados frescos.
function mapPlanToForm(plan: TrainingPlan | null | undefined): FormValues {
  return {
    name: plan?.name ?? "",
    year: plan?.year ?? new Date().getFullYear(),
    startDate: plan?.startDate ? plan.startDate.slice(0, 10) : "",
    endDate: plan?.endDate ? plan.endDate.slice(0, 10) : "",
    budget: plan?.budget != null ? Number(plan.budget) : null,
    isInternal: !!plan?.isInternal,
    status: plan?.status ?? "DRAFT",
  }
}

export function TrainingPlanEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const planQ = useTrainingPlan(id)
  const upsert = useUpsertTrainingPlan()
  const auditQ = usePlanAuditLogs(id)
  const plan = planQ.data

  const form = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: mapPlanToForm(null),
  })

  // Re-sincroniza o form com os dados frescos do plano em três situações:
  // (1) mount inicial assim que a query resolve, (2) navegação para outro
  // plano, (3) após save/arquivar quando o cache da query foi actualizado.
  // A "assinatura" combina id + updatedAt + status + budget — assim qualquer
  // mudança real força reset, mas re-renders sem mudança real não.
  const planSig = plan
    ? `${plan.id}|${plan.updatedAt ?? ""}|${plan.status ?? ""}|${plan.budget ?? ""}`
    : null
  useEffect(() => {
    if (plan) {
      form.reset(mapPlanToForm(plan))
      // Limpa qualquer override do utilizador para que currentStatus
      // passe a reflectir o servidor (essencial após save bem sucedido).
      setPendingStatus(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planSig])

  const isInternal = form.watch("isInternal")
  // Status fora do RHF: o Radix Select com value controlado por RHF não
  // re-renderiza fiavelmente após form.reset (provavelmente o React Compiler
  // a interferir com a propagação). Padrão derivado-com-override:
  // - currentStatus é derivado de plan em cada render (server-of-truth)
  // - pendingStatus captura a intenção do utilizador sem perder a sync
  // - useEffect limpa pendingStatus quando plan muda (post-save inclusive)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const currentStatus = pendingStatus ?? plan?.status ?? "DRAFT"
  const budget = form.watch("budget")
  const budgetNum =
    typeof budget === "number"
      ? budget
      : budget == null || budget === ""
        ? null
        : Number(budget)
  const tenant = useTenantStore((s) => s.tenant)
  const entityName = tenant?.name?.trim() || "tua entidade"

  async function onSubmit(values: FormValues) {
    if (!plan) return
    try {
      await upsert.mutateAsync({
        id: plan.id,
        tenantId: plan.tenantId,
        input: {
          name: values.name,
          year: values.year,
          startDate: values.startDate
            ? new Date(values.startDate).toISOString()
            : null,
          endDate: values.endDate
            ? new Date(values.endDate).toISOString()
            : null,
          isInternal: values.isInternal,
          budget: values.budget ?? null,
          // status vem do useState local, não do RHF (ver comentário acima).
          status: currentStatus,
        },
      })
      toast.success("Plano atualizado")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao gravar")
    }
  }

  const auditLogs = useMemo(() => auditQ.data ?? [], [auditQ.data])

  if (planQ.isLoading) {
    return (
      <div className="text-sm text-muted-foreground">A carregar plano…</div>
    )
  }
  if (!plan) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        Plano não encontrado.{" "}
        <Link
          to="/admin/training-plans"
          className="text-primary hover:underline"
        >
          Voltar à lista
        </Link>
        .
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/admin/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/admin/training-plans" className="hover:text-foreground">
          Planos de Formação
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Editar Plano</span>
      </nav>

      {/* Título */}
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Editar Plano de Formação
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Atualiza o âmbito e estado do plano. As alterações ficam registadas
            no histórico.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge(currentStatus ?? null)}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna principal — Informação Geral */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="lg:col-span-2 space-y-6"
        >
          <section className="rounded-lg border border-border bg-card p-6 space-y-5">
            <header>
              <h2 className="text-base font-semibold text-foreground">
                Informação Geral
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dados estruturantes do plano.
              </p>
            </header>

            <div className="space-y-2">
              <Label htmlFor="name">Nome do Plano</Label>
              <Input id="name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="year">Ano de Vigência</Label>
                <Input
                  id="year"
                  type="number"
                  inputMode="numeric"
                  {...form.register("year")}
                />
                {form.formState.errors.year && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.year.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={currentStatus}
                  onValueChange={(v) => {
                    setPendingStatus(v)
                    form.setValue("status", v, { shouldDirty: true })
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Rascunho</SelectItem>
                    <SelectItem value="UNDER_REVIEW">Em revisão</SelectItem>
                    <SelectItem value="PUBLISHED">Publicado</SelectItem>
                    <SelectItem value="ARCHIVED">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-md border border-border bg-muted/30 p-3 cursor-pointer">
              <Checkbox
                id="isInternal"
                checked={isInternal}
                onCheckedChange={(v) =>
                  form.setValue("isInternal", v === true)
                }
              />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Plano Interno
                </p>
                <p className="text-xs text-muted-foreground">
                  Marca quando o plano é executado pelos colaboradores da{" "}
                  {entityName}, e não para empresas clientes.
                </p>
              </div>
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de início</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...form.register("startDate")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de fim</Label>
                <Input id="endDate" type="date" {...form.register("endDate")} />
                {form.formState.errors.endDate && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Orçamento Estimado</Label>
              <CurrencyInput
                id="budget"
                value={budgetNum}
                onValueChange={(n) =>
                  form.setValue("budget", n, { shouldValidate: true })
                }
              />
              <p className="text-xs text-muted-foreground">
                Baseado na estimativa de custos operacionais.
              </p>
              {form.formState.errors.budget && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.budget.message}
                </p>
              )}
            </div>

            <footer className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/training-plans")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={upsert.isPending}>
                {upsert.isPending ? "A gravar..." : "Gravar Alterações"}
              </Button>
            </footer>
          </section>
        </form>

        {/* Coluna lateral — Dica + Histórico */}
        <aside className="space-y-6">
          <section className="rounded-lg border border-border bg-card p-5">
            <header className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-warning" />
              <h2 className="text-base font-semibold text-foreground">
                Dica de Gestão
              </h2>
            </header>
            <p className="mt-2 text-sm text-muted-foreground">
              Publica o plano quando o orçamento estiver fechado pela direcção.
              Antes de publicar, mantém em <strong>Em revisão</strong> para
              feedback dos coordenadores pedagógicos.
            </p>
            <div className="mt-3 flex items-start gap-2 rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Planos arquivados deixam de aparecer nos relatórios mas mantêm
                histórico de auditoria.
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card p-5">
            <header className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold text-foreground">
                Histórico de Edições
              </h2>
            </header>
            <ul className="mt-3 space-y-3">
              {auditQ.isLoading ? (
                <li className="text-sm text-muted-foreground">A carregar…</li>
              ) : auditLogs.length === 0 ? (
                <li className="text-sm text-muted-foreground">
                  Sem edições registadas.
                </li>
              ) : (
                auditLogs.map((log) => {
                  const who =
                    log.users?.firstName || log.users?.lastName
                      ? `${log.users?.firstName ?? ""} ${log.users?.lastName ?? ""}`.trim()
                      : (log.users?.email ?? "Utilizador")
                  return (
                    <li
                      key={log.id}
                      className="flex items-start gap-3 text-sm"
                    >
                      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {log.action ?? "Alteração"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {who} · {timeAgo(log.createdAt)}
                        </p>
                      </div>
                    </li>
                  )
                })
              )}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
