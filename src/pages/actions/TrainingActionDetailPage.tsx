import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  FileText,
  Coins,
  Info,
  Download,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { API_BASE } from "@/lib/api-base"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FormModal } from "@/components/forms/FormModal"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { formatRelativeTime, todayISO } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ErrorState } from "@/components/feedback/ErrorState"
import { CampaignsTab } from "./CampaignsTab"
import { useTrainees } from "@/pages/trainees/useTrainees"
import {
  useTrainingAction,
  useActionSessions,
  useDeleteSession,
  useActionEnrollments,
  useAddEnrollment,
  useUpdateEnrollmentStatus,
  useDeleteEnrollment,
} from "./useTrainingActions"
import { SessionForm } from "./SessionForm"
import type { TrainingSession, EnrollmentStatus } from "@/types/domain"

const ENROLLMENT_STATUSES: EnrollmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "ATTENDED",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED",
]

// Cores explícitas por estado (spec): PENDING cinza, CONFIRMED azul,
// ATTENDED amarelo, COMPLETED verde, NO_SHOW vermelho claro, CANCELLED vermelho.
function enrollmentBadgeClass(s: string | null): string {
  switch (s) {
    case "CONFIRMED":
      return "bg-blue-100 text-blue-700 border-blue-200"
    case "ATTENDED":
      return "bg-amber-100 text-amber-800 border-amber-200"
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700 border-emerald-200"
    case "NO_SHOW":
      return "bg-red-50 text-red-600 border-red-200"
    case "CANCELLED":
      return "bg-red-100 text-red-700 border-red-300"
    case "PENDING":
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

const DOSSIER_SECTIONS = [
  "Programa e Cronograma",
  "Formadores (CV, CCP)",
  "Formandos (inscrições, fichas)",
  "Sumários e Presenças",
  "Avaliação dos Formandos",
  "Avaliação da Ação",
  "Certificados",
  "Contrato e Faturação",
  "Relatório Final",
]

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString("pt-PT") : "—"
}

export function TrainingActionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const actionQ = useTrainingAction(id)
  const sessionsQ = useActionSessions(id)
  const enrollmentsQ = useActionEnrollments(id)
  const delSession = useDeleteSession()
  const addEnrollment = useAddEnrollment()
  const updateEnrollment = useUpdateEnrollmentStatus()
  const deleteEnrollment = useDeleteEnrollment()

  const [sessionOpen, setSessionOpen] = useState(false)
  const [editingSession, setEditingSession] = useState<TrainingSession | null>(
    null
  )
  const [addTraineeOpen, setAddTraineeOpen] = useState(false)
  const [traineePick, setTraineePick] = useState("")
  const [pdfLoading, setPdfLoading] = useState(false)
  // Modal de geração em massa, partilhado por Fichas, Folhas e Planos.
  // Cada item traz um discriminador `kind` para o modal escolher o rótulo.
  type MassItem =
    | {
        kind: "ficha"
        traineeId: string
        traineeName: string
        url?: string
        error?: string
      }
    | {
        kind: "folha" | "plano"
        sessionId: string
        sessionDate: string | null
        startTime: string | null
        moduleLabel: string
        url?: string
        error?: string
      }
  const [fichasOpen, setFichasOpen] = useState(false)
  const [fichasLoading, setFichasLoading] = useState(false)
  const [folhasLoading, setFolhasLoading] = useState(false)
  const [planosLoading, setPlanosLoading] = useState(false)
  const [genKind, setGenKind] = useState<"ficha" | "folha" | "plano">("ficha")
  const [fichasPdfs, setFichasPdfs] = useState<MassItem[]>([])

  // Dossier Completo (ZIP)
  type DossierResult = {
    url: string
    path: string
    stats: {
      totalFiles: number
      sizeBytes: number
      generatedAt: string
      fromCache: boolean
      sections: { number: number; name: string; fileCount: number }[]
      errors: { itemPath: string; error: string }[]
    }
  }
  const [dossierLoading, setDossierLoading] = useState(false)
  const [dossierResult, setDossierResult] = useState<DossierResult | null>(
    null
  )

  const action = actionQ.data
  const traineesQ = useTrainees(action?.clientOrgId ?? undefined)

  async function handleDeleteSession(sid: string) {
    try {
      await delSession.mutateAsync(sid)
      toast.success("Sessão eliminada")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao eliminar")
    }
  }

  async function handleAddTrainee() {
    if (!id || !traineePick) return
    try {
      await addEnrollment.mutateAsync({
        trainingActionId: id,
        traineeId: traineePick,
      })
      toast.success("Formando inscrito")
      setAddTraineeOpen(false)
      setTraineePick("")
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erro ao inscrever formando"
      )
    }
  }

  async function handleStatusChange(eid: string, status: string) {
    try {
      await updateEnrollment.mutateAsync({ id: eid, status })
      toast.success("Estado atualizado")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao atualizar")
    }
  }

  async function handleDeleteEnrollment(eid: string) {
    try {
      await deleteEnrollment.mutateAsync(eid)
      toast.success("Inscrição removida")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao remover")
    }
  }

  async function handleGeneratePdf(templateCode: string) {
    if (!id) return
    setPdfLoading(true)
    const t = toast.loading("A gerar PDF...")
    try {
      const res = await fetch(`${API_BASE}/api/pdf/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateCode, actionId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
      if (!data?.url) throw new Error("Resposta sem URL")
      toast.success("PDF gerado", { id: t })
      window.open(data.url as string, "_blank", "noopener")
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erro ao gerar PDF",
        { id: t }
      )
    } finally {
      setPdfLoading(false)
    }
  }

  async function runMass(opts: {
    templateCode: string
    kind: "ficha" | "folha" | "plano"
    loading: (b: boolean) => void
    loadingMsg: string
    emptyMsg: string
    noun: string
  }) {
    if (!id) return
    opts.loading(true)
    const t = toast.loading(opts.loadingMsg)
    try {
      const res = await fetch(`${API_BASE}/api/pdf/generate-mass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateCode: opts.templateCode, actionId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
      const pdfs = (data?.pdfs ?? []) as MassItem[]
      if (pdfs.length === 0) throw new Error(opts.emptyMsg)
      setGenKind(opts.kind)
      setFichasPdfs(pdfs)
      setFichasOpen(true)
      const ok = pdfs.filter((p) => p.url).length
      const failed = pdfs.length - ok
      toast.success(
        `${ok} ${opts.noun}${failed ? `, ${failed} com erro` : ""}`,
        { id: t }
      )
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : `Erro ao gerar ${opts.noun}`,
        { id: t }
      )
    } finally {
      opts.loading(false)
    }
  }

  function handleGenerateFichas() {
    return runMass({
      templateCode: "fichaIdentificacao",
      kind: "ficha",
      loading: setFichasLoading,
      loadingMsg: "A gerar fichas de identificação...",
      emptyMsg: "Nenhuma ficha gerada",
      noun: "ficha(s) gerada(s)",
    })
  }

  function handleGenerateFolhas() {
    return runMass({
      templateCode: "folhaPresenca",
      kind: "folha",
      loading: setFolhasLoading,
      loadingMsg: "A gerar folhas de presença...",
      emptyMsg: "Nenhuma folha gerada (a acção tem sessões?)",
      noun: "folha(s) gerada(s)",
    })
  }

  function handleGeneratePlanos() {
    return runMass({
      templateCode: "planoSessao",
      kind: "plano",
      loading: setPlanosLoading,
      loadingMsg: "A gerar planos de sessão...",
      emptyMsg: "Nenhum plano gerado (a acção tem sessões?)",
      noun: "plano(s) gerado(s)",
    })
  }

  async function handleGenerateDossier() {
    if (!id) return
    const t0 = Date.now()
    setDossierLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/pdf/generate-dossier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
      setDossierResult(data as DossierResult)
      const secs = ((Date.now() - t0) / 1000).toFixed(0)
      const nErr = data?.stats?.errors?.length ?? 0
      if (nErr > 0) {
        toast.warning(
          `Dossier gerado com ${nErr} aviso(s) · ${data.stats.totalFiles} ficheiros`
        )
      } else if (data?.stats?.fromCache) {
        toast.success("Dossier obtido da cache")
      } else {
        toast.success(
          `Dossier gerado: ${data.stats.totalFiles} ficheiros em ${secs}s`
        )
      }
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erro ao gerar o Dossier Completo"
      )
    } finally {
      setDossierLoading(false)
    }
  }

  function downloadDossier() {
    if (!dossierResult || !action) return
    const fname = `Dossier_${action.actionCode || action.id}_${todayISO()}.zip`
    // Signed URL é cross-origin (Supabase) -> o atributo download não
    // renomeia. O param ?download= faz o Supabase servir com
    // Content-Disposition: attachment; filename.
    const sep = dossierResult.url.includes("?") ? "&" : "?"
    const href = `${dossierResult.url}${sep}download=${encodeURIComponent(
      fname
    )}`
    const a = document.createElement("a")
    a.href = href
    a.download = fname
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (actionQ.isError)
    return <ErrorState message={(actionQ.error as Error)?.message} />

  return (
    <div className="space-y-6">
      <Link
        to="/admin/actions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Ações de Formação
      </Link>

      {actionQ.isLoading ? (
        <p className="text-sm text-muted-foreground">A carregar ação...</p>
      ) : !action ? (
        <ErrorState message="Ação não encontrada." />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">
              {action.actionCode ?? "Ação"} · {action.courses?.name ?? "—"}
            </h1>
            <Badge variant="secondary">{action.status ?? "—"}</Badge>
            {!action.contractId && (
              <Badge variant="destructive">Sem contrato</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {action.client_orgs?.name ?? "Sem cliente"} ·{" "}
            {fmt(action.startDate)} → {fmt(action.endDate)}
          </p>

          <Tabs defaultValue="sessoes">
            <TabsList>
              <TabsTrigger value="sessoes">Sessões</TabsTrigger>
              <TabsTrigger value="formandos">Formandos</TabsTrigger>
              <TabsTrigger value="dossier">Dossier</TabsTrigger>
              <TabsTrigger value="avaliacoes">Avaliações</TabsTrigger>
              <TabsTrigger value="custos">Custos</TabsTrigger>
            </TabsList>

            {/* SESSÕES */}
            <TabsContent value="sessoes" className="space-y-4 pt-4">
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingSession(null)
                    setSessionOpen(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova sessão
                </Button>
              </div>
              <div className="rounded-md border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Horas</TableHead>
                      <TableHead>Módulo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(sessionsQ.data ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="h-20 text-center text-muted-foreground"
                        >
                          {sessionsQ.isLoading
                            ? "A carregar..."
                            : "Sem sessões."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      (sessionsQ.data ?? []).map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>{fmt(s.sessionDate)}</TableCell>
                          <TableCell>
                            {s.startTime}–{s.endTime}
                          </TableCell>
                          <TableCell>{s.durationHours}</TableCell>
                          <TableCell>
                            {s.course_modules?.name ?? "—"}
                          </TableCell>
                          <TableCell>{s.sessionType ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {s.isClosed
                                ? "Fechada"
                                : s.isOpen
                                  ? "QR ativo"
                                  : "Aberta"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingSession(s)
                                  setSessionOpen(true)
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteSession(s.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* FORMANDOS */}
            <TabsContent value="formandos" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {(enrollmentsQ.data ?? []).length} inscrito(s)
                </p>
                <Button
                  size="sm"
                  disabled={!action.clientOrgId}
                  onClick={() => setAddTraineeOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Formando
                </Button>
              </div>
              {!action.clientOrgId && (
                <p className="text-xs text-muted-foreground">
                  A ação não tem entidade cliente; não é possível filtrar
                  formandos.
                </p>
              )}
              <div className="rounded-md border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Formando</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-44">Estado</TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(enrollmentsQ.data ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-20 text-center text-muted-foreground"
                        >
                          {enrollmentsQ.isLoading
                            ? "A carregar..."
                            : "Sem formandos inscritos."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      (enrollmentsQ.data ?? []).map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>
                            {`${e.trainees?.firstName ?? ""} ${e.trainees?.lastName ?? ""}`.trim() ||
                              "—"}
                          </TableCell>
                          <TableCell>{e.trainees?.email ?? "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={enrollmentBadgeClass(e.status)}
                              >
                                {e.status ?? "—"}
                              </Badge>
                              <Select
                                value={e.status ?? undefined}
                                onValueChange={(v) =>
                                  handleStatusChange(e.id, v)
                                }
                              >
                                <SelectTrigger className="h-7 w-32">
                                  <SelectValue placeholder="Mudar" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ENROLLMENT_STATUSES.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteEnrollment(e.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* DOSSIER (stub) */}
            <TabsContent value="dossier" className="space-y-5 pt-4">
              <div>
                <h2 className="text-lg font-semibold">
                  Dossier Técnico-Pedagógico
                </h2>
                <p className="text-sm text-muted-foreground">
                  9 secções obrigatórias DGERT
                </p>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={handleGenerateDossier}
                disabled={dossierLoading}
              >
                <Download className="mr-2 h-5 w-5" />
                {dossierLoading
                  ? "A gerar..."
                  : "Exportar Dossier Completo (ZIP)"}
              </Button>

              <div className="border-t" />

              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Documentos individuais
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    onClick={() => handleGeneratePdf("checklist")}
                    disabled={pdfLoading}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {pdfLoading ? "A gerar..." : "Checklist"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGeneratePdf("registoSumarios")}
                    disabled={pdfLoading}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {pdfLoading ? "A gerar..." : "Registo de Sumários"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGenerateFichas}
                    disabled={fichasLoading}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {fichasLoading
                      ? "A gerar..."
                      : "Fichas de Identificação"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGenerateFolhas}
                    disabled={folhasLoading}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {folhasLoading ? "A gerar..." : "Folhas de Presença"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGeneratePlanos}
                    disabled={planosLoading}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {planosLoading ? "A gerar..." : "Planos de Sessão"}
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  Secções do Dossier (DGERT)
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {DOSSIER_SECTIONS.map((sec, i) => (
                    <div
                      key={sec}
                      className="flex items-center gap-2 rounded-md border bg-muted/40 p-3 text-sm"
                    >
                      <span className="font-semibold text-muted-foreground">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span>{sec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* AVALIAÇÕES (campanhas) */}
            <TabsContent value="avaliacoes" className="space-y-4 pt-4">
              {id && (
                <CampaignsTab
                  trainingActionId={id}
                  actionCode={action.actionCode}
                />
              )}
            </TabsContent>

            {/* CUSTOS (stub) */}
            <TabsContent value="custos" className="space-y-4 pt-4">
              <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                <Coins className="mt-0.5 h-4 w-4 shrink-0" />
                Módulo financeiro fica para o Bloco Financeiro.
              </div>
              <div className="rounded-md border bg-background p-8 text-center text-sm text-muted-foreground">
                Sem custos registados.
              </div>
              <Button variant="outline" disabled>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Custo
              </Button>
            </TabsContent>
          </Tabs>

          {sessionOpen && id && (
            <SessionForm
              open={sessionOpen}
              onOpenChange={setSessionOpen}
              trainingActionId={id}
              courseId={action.courseId}
              session={editingSession}
            />
          )}

          <FormModal
            open={addTraineeOpen}
            onOpenChange={setAddTraineeOpen}
            title="Adicionar Formando"
            className="max-w-md"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Formando (da entidade cliente da ação)
                </label>
                <Select value={traineePick} onValueChange={setTraineePick}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o formando" />
                  </SelectTrigger>
                  <SelectContent>
                    {(traineesQ.data ?? []).map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {`${t.firstName ?? ""} ${t.lastName ?? ""}`.trim() ||
                          t.email ||
                          t.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setAddTraineeOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  disabled={!traineePick || addEnrollment.isPending}
                  onClick={handleAddTrainee}
                >
                  {addEnrollment.isPending ? "A inscrever..." : "Inscrever"}
                </Button>
              </div>
            </div>
          </FormModal>

          <FormModal
            open={fichasOpen}
            onOpenChange={setFichasOpen}
            title={
              genKind === "folha"
                ? "Folhas de Presença geradas"
                : genKind === "plano"
                  ? "Planos de Sessão gerados"
                  : "Fichas de Identificação geradas"
            }
            description={
              genKind === "ficha"
                ? "Um PDF por formando. Clique nos que pretende abrir."
                : "Um PDF por sessão. Clique nos que pretende abrir."
            }
            className="max-w-lg"
          >
            <div className="space-y-2">
              <ul className="max-h-[60vh] divide-y overflow-y-auto rounded-md border">
                {fichasPdfs.map((f) => (
                  <li
                    key={f.kind === "ficha" ? f.traineeId : f.sessionId}
                    className="flex items-center justify-between gap-3 p-3 text-sm"
                  >
                    <span className="truncate">
                      {f.kind === "ficha"
                        ? f.traineeName
                        : `${fmt(f.sessionDate)}${
                            f.startTime ? " " + f.startTime : ""
                          } — ${f.moduleLabel}`}
                    </span>
                    {f.url ? (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        Abrir PDF
                      </a>
                    ) : (
                      <Badge
                        variant="outline"
                        className="shrink-0 bg-red-100 text-red-700 border-red-300"
                        title={f.error ?? "Erro"}
                      >
                        Falhou
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
              <div className="flex justify-end border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => setFichasOpen(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </FormModal>

          {/* Dossier Completo — progresso */}
          <Dialog open={dossierLoading}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>A gerar Dossier Completo</DialogTitle>
                <DialogDescription>
                  Não feche esta janela.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="text-center">
                  <p className="font-medium">
                    A gerar PDFs e a empacotar ZIP...
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Esta operação demora cerca de 10-15 segundos
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Dossier Completo — resultado */}
          <Dialog
            open={!!dossierResult && !dossierLoading}
            onOpenChange={(o) => {
              if (!o) setDossierResult(null)
            }}
          >
            <DialogContent className="max-w-2xl">
              {dossierResult && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {dossierResult.stats.errors.length > 0 ? (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      )}
                      Dossier Pronto
                    </DialogTitle>
                    <DialogDescription>
                      {dossierResult.stats.fromCache
                        ? `Versão em cache (gerada ${formatRelativeTime(
                            dossierResult.stats.generatedAt
                          )})`
                        : `Gerado agora · ${dossierResult.stats.totalFiles} ficheiros`}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted p-4">
                      <div>
                        <div className="text-2xl font-semibold">
                          {dossierResult.stats.totalFiles}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ficheiros
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-semibold">
                          {(
                            dossierResult.stats.sizeBytes /
                            1024 /
                            1024
                          ).toFixed(1)}{" "}
                          MB
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {dossierResult.stats.fromCache
                            ? "tamanho (cache)"
                            : "tamanho"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-2 text-sm font-medium">
                        Conteúdo por secção
                      </h4>
                      <div className="max-h-56 space-y-1 overflow-y-auto">
                        {dossierResult.stats.sections.map((s) => (
                          <div
                            key={s.number}
                            className="flex justify-between border-b py-1 text-sm"
                          >
                            <span>
                              {String(s.number).padStart(2, "0")}. {s.name}
                            </span>
                            <span className="text-muted-foreground">
                              {s.fileCount} ficheiro
                              {s.fileCount > 1 ? "s" : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {dossierResult.stats.errors.length > 0 && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <h4 className="mb-2 text-sm font-medium text-amber-900">
                          Atenção: {dossierResult.stats.errors.length} itens
                          não puderam ser gerados
                        </h4>
                        <ul className="space-y-1 text-xs text-amber-800">
                          {dossierResult.stats.errors.map((e, i) => (
                            <li key={i}>
                              · {e.itemPath}: {e.error}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-xs text-amber-700">
                          O ZIP inclui um ficheiro _erros.txt com detalhes.
                        </p>
                      </div>
                    )}
                  </div>

                  <DialogFooter className="flex gap-2">
                    {dossierResult.stats.fromCache && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDossierResult(null)
                          handleGenerateDossier()
                        }}
                      >
                        Regenerar
                      </Button>
                    )}
                    <Button onClick={downloadDossier}>
                      <Download className="mr-2 h-4 w-4" />
                      Descarregar Dossier
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
