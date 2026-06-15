import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, FileText, Lock, Pencil, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { SessionPlanForm } from "./SessionPlanForm"
import { SessionSummaryForm } from "./SessionSummaryForm"
import { useCurrentTrainer } from "./useCurrentTrainer"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { ErrorState } from "@/components/feedback/ErrorState"
import { useTrainerSession } from "./useTrainerSession"
import { AttendanceTab } from "./AttendanceTab"

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("pt-PT") : "—"
}
const TYPE_LABEL: Record<string, string> = {
  TEORICA: "Teórica",
  PRATICA: "Prática",
  MISTA: "Mista",
}

function PlanField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-md border p-4">
      <p className="mb-1 text-sm font-medium text-muted-foreground">{label}</p>
      {value && value.trim() ? (
        <p className="whitespace-pre-wrap text-sm">{value}</p>
      ) : (
        <p className="text-sm italic text-muted-foreground">Por preencher</p>
      )}
    </div>
  )
}

export function TrainerSessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const q = useTrainerSession(sessionId)
  const s = q.data
  const actionId = s?.training_actions?.id
  const me = useCurrentTrainer()
  const currentUser = useCurrentUser()
  const [printing, setPrinting] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  // Ownership: o trainer logado é o trainerId desta sessão.
  const isOwn = !!(me.data?.id && s?.trainerId && me.data.id === s.trainerId)
  const signed = !!s?.trainerSignedAt

  async function handlePrintPlano() {
    if (!actionId || !sessionId) return
    setPrinting(true)
    const t = toast.loading("A gerar o Plano de Sessão...")
    try {
      const base = import.meta.env.VITE_PDF_API_URL ?? "http://localhost:3001"
      // planoSessao é gerado por /generate-mass (1 PDF por sessão da acção);
      // filtramos o item desta sessão.
      const res = await fetch(`${base}/api/pdf/generate-mass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateCode: "planoSessao", actionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`)
      const mine = (data?.pdfs ?? []).find(
        (p: { sessionId?: string; url?: string }) =>
          p.sessionId === sessionId && p.url
      )
      if (!mine?.url) throw new Error("PDF desta sessão não encontrado")
      toast.success("Plano gerado", { id: t })
      window.open(mine.url as string, "_blank", "noopener")
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Erro ao gerar o plano",
        { id: t }
      )
    } finally {
      setPrinting(false)
    }
  }

  if (q.isError) {
    return (
      <div className="space-y-4">
        <Link
          to="/trainer/sessions"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar a Minhas Sessões
        </Link>
        <ErrorState message={(q.error as Error)?.message} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to="/trainer/sessions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar a Minhas Sessões
      </Link>

      {q.isLoading || !s ? (
        <p className="text-sm text-muted-foreground">A carregar sessão...</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">
              {s.course_modules?.name ?? "Sessão"}
            </h1>
            {s.sessionType && (
              <Badge variant="outline">
                {TYPE_LABEL[s.sessionType] ?? s.sessionType}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 rounded-md border bg-muted/40 p-4 text-sm sm:grid-cols-3">
            <Field k="Data" v={fmtDate(s.sessionDate)} />
            <Field
              k="Horário"
              v={
                s.startTime || s.endTime
                  ? `${s.startTime ?? "—"}–${s.endTime ?? "—"}`
                  : "—"
              }
            />
            <Field
              k="Duração"
              v={s.durationHours != null ? `${s.durationHours}h` : "—"}
            />
            <Field
              k="Curso"
              v={s.training_actions?.course?.name ?? "—"}
            />
            <Field
              k="Cliente"
              v={s.training_actions?.clientOrg?.name ?? "—"}
            />
            <Field
              k="Local"
              v={s.training_actions?.localFormacao ?? "—"}
            />
            <Field k="Formato" v={s.training_actions?.format ?? "—"} />
            <Field
              k="Acção"
              v={s.training_actions?.actionCode ?? "—"}
            />
          </div>

          <Tabs defaultValue="plano">
            <TabsList>
              <TabsTrigger value="plano">Plano de Sessão</TabsTrigger>
              <TabsTrigger value="sumario">Sumário</TabsTrigger>
              <TabsTrigger value="formandos">Formandos</TabsTrigger>
            </TabsList>

            <TabsContent value="plano" className="space-y-3 pt-4">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrintPlano}
                  disabled={printing}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {printing ? "A gerar..." : "Imprimir Plano"}
                </Button>
                {isOwn && (
                  <Button onClick={() => setPlanOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar Plano
                  </Button>
                )}
              </div>
              <PlanField label="Objectivos" value={s.planObjetivos} />
              <PlanField label="Introdução" value={s.planIntroducao} />
              <PlanField
                label="Desenvolvimento"
                value={s.planDesenvolvimento}
              />
              <PlanField label="Conclusão" value={s.planConclusao} />
              <div className="rounded-md border p-4">
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  Recursos / Materiais Pedagógicos
                </p>
                {s.didacticResources && s.didacticResources.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm">
                    {s.didacticResources.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    Por preencher
                  </p>
                )}
              </div>
              <PlanField
                label="Forma de Avaliação"
                value={s.planAvaliacao}
              />
            </TabsContent>

            <TabsContent value="sumario" className="space-y-3 pt-4">
              {signed && (
                <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    Sumário assinado em{" "}
                    {s.trainerSignedAt
                      ? new Date(s.trainerSignedAt).toLocaleString("pt-PT")
                      : "—"}
                  </span>
                </div>
              )}
              <div className="flex justify-end">
                {isOwn && !signed && (
                  <Button onClick={() => setSummaryOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar Sumário
                  </Button>
                )}
                {isOwn && signed && (
                  <Button
                    variant="outline"
                    disabled
                    title="Sumário assinado. Contacte o admin para reabrir."
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Sumário Assinado
                  </Button>
                )}
              </div>
              <div className="rounded-md border p-4">
                {s.summary && s.summary.trim() ? (
                  <p className="whitespace-pre-wrap text-sm">{s.summary}</p>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    Sumário por preencher
                  </p>
                )}
              </div>
              {signed && s.trainerSignatureUrl && (
                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Assinatura digital do formador
                  </p>
                  <img
                    src={s.trainerSignatureUrl}
                    alt="Assinatura do formador"
                    className="max-h-32 rounded border bg-white"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="formandos" className="pt-4">
              <AttendanceTab
                sessionId={s.id}
                trainingActionId={actionId}
                signedAt={s.trainerSignedAt}
                canEdit={isOwn}
                currentUserId={currentUser.data?.id ?? null}
              />
            </TabsContent>
          </Tabs>

          {/* Sheet: Editar Plano */}
          <Sheet open={planOpen} onOpenChange={setPlanOpen}>
            <SheetContent
              side="right"
              className="w-full overflow-y-auto sm:max-w-2xl"
            >
              <SheetHeader>
                <SheetTitle>Editar Plano de Sessão</SheetTitle>
                <SheetDescription>
                  Preenche as 5 secções do plano e os recursos didácticos.
                </SheetDescription>
              </SheetHeader>
              {planOpen && (
                <div className="pt-4">
                  <SessionPlanForm
                    session={s}
                    onClose={() => setPlanOpen(false)}
                  />
                </div>
              )}
            </SheetContent>
          </Sheet>

          {/* Sheet: Editar Sumário */}
          <Sheet open={summaryOpen} onOpenChange={setSummaryOpen}>
            <SheetContent
              side="right"
              className="w-full overflow-y-auto sm:max-w-2xl"
            >
              <SheetHeader>
                <SheetTitle>Editar Sumário</SheetTitle>
                <SheetDescription>
                  Preenche o sumário. Ao assinar fica imutável.
                </SheetDescription>
              </SheetHeader>
              {summaryOpen && (
                <div className="pt-4">
                  <SessionSummaryForm
                    session={s}
                    onClose={() => setSummaryOpen(false)}
                  />
                </div>
              )}
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  )
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{k}</p>
      <p>{v}</p>
    </div>
  )
}
