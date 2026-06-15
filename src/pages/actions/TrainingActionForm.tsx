import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Trash2, Plus, AlertTriangle } from "lucide-react"
import { FormModal } from "@/components/forms/FormModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDefaultTenantId } from "@/hooks/useDefaultTenant"
import {
  useClientOrgs,
  usePublishedCourses,
  usePlansLookup,
  useRoomsLookup,
  useTrainersLookup,
  useContractsByOrg,
} from "@/hooks/useLookups"
import { useCourseModules } from "@/pages/courses/useCourseModules"
import {
  useUpsertTrainingAction,
  type SessionDraft,
} from "./useTrainingActions"

const NONE = "__none__"

function trainerName(u: { firstName: string | null; lastName: string | null } | null) {
  if (!u) return "—"
  return `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "—"
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TrainingActionForm({ open, onOpenChange }: Props) {
  const tenant = useDefaultTenantId()
  const upsert = useUpsertTrainingAction()

  const [step, setStep] = useState<1 | 2>(1)
  // Step 1
  const [courseId, setCourseId] = useState("")
  const [clientOrgId, setClientOrgId] = useState("")
  const [planId, setPlanId] = useState<string | null>(null)
  const [contractId, setContractId] = useState("")
  const [actionCode, setActionCode] = useState("")
  const [actionNumber, setActionNumber] = useState("")
  const [format, setFormat] = useState<"PRESENCIAL" | "ELEARNING">("PRESENCIAL")
  const [roomId, setRoomId] = useState<string | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [entidadeFormadora, setEntidadeFormadora] = useState(
    "Própria Empresa"
  )
  const [iniciativaFormacao, setIniciativaFormacao] = useState(
    "Responsabilidade do Empregador"
  )
  const [tipologiaHorario, setTipologiaHorario] = useState("")
  const [localFormacao, setLocalFormacao] = useState("")
  // Step 2
  const [sessions, setSessions] = useState<SessionDraft[]>([])

  const orgs = useClientOrgs()
  const courses = usePublishedCourses()
  const plans = usePlansLookup()
  const rooms = useRoomsLookup()
  const trainers = useTrainersLookup()
  const contracts = useContractsByOrg(clientOrgId || undefined)
  const modules = useCourseModules(courseId || undefined)

  const course = useMemo(
    () => (courses.data ?? []).find((c) => c.id === courseId),
    [courses.data, courseId]
  )
  const courseHours = Number(course?.durationHours) || 0
  const sessionsHours = sessions.reduce(
    (s, x) => s + (Number(x.durationHours) || 0),
    0
  )
  const hoursExceeded = courseHours > 0 && sessionsHours > courseHours + 0.001
  const incompleteSessions = sessions.some(
    (s) => !s.courseModuleId || !s.sessionType
  )

  const step1Valid =
    courseId && startDate && endDate && format && contractId

  function reset() {
    setStep(1)
    setCourseId("")
    setClientOrgId("")
    setPlanId(null)
    setContractId("")
    setActionCode("")
    setActionNumber("")
    setFormat("PRESENCIAL")
    setRoomId(null)
    setStartDate("")
    setEndDate("")
    setEntidadeFormadora("Própria Empresa")
    setIniciativaFormacao("Responsabilidade do Empregador")
    setTipologiaHorario("")
    setLocalFormacao("")
    setSessions([])
  }

  function addSession() {
    setSessions((s) => [
      ...s,
      {
        courseModuleId: null,
        sessionType: null,
        sessionDate: startDate || "",
        startTime: "09:00",
        endTime: "13:00",
        durationHours: 4,
        trainerId: null,
      },
    ])
  }
  function updateSession(i: number, patch: Partial<SessionDraft>) {
    setSessions((s) => s.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  }
  function removeSession(i: number) {
    setSessions((s) => s.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    const tenantId = tenant.data
    if (!tenantId) {
      toast.error("Sem tenant resolvido")
      return
    }
    if (!contractId) {
      toast.error("É necessário associar um contrato antes de guardar")
      return
    }
    if (hoursExceeded) {
      toast.error("As sessões ultrapassam a duração total do curso")
      return
    }
    try {
      await upsert.mutateAsync({
        tenantId,
        input: {
          courseId,
          clientOrgId: clientOrgId || null,
          planId,
          contractId,
          actionCode: actionCode || null,
          actionNumber: actionNumber ? Number(actionNumber) : null,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          format,
          roomId,
          maxTrainees: null,
          minTrainees: null,
          entidadeFormadora: entidadeFormadora || null,
          iniciativaFormacao: iniciativaFormacao || null,
          tipologiaHorario: tipologiaHorario || null,
          localFormacao: localFormacao || null,
        },
        sessions: sessions.map((s) => ({
          ...s,
          sessionDate: new Date(s.sessionDate).toISOString(),
        })),
      })
      toast.success("Ação criada")
      reset()
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gravar")
    }
  }

  return (
    <FormModal
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
      title={step === 1 ? "Nova Ação — Dados base" : "Nova Ação — Cronograma"}
      description={`Passo ${step} de 2`}
      className="max-w-3xl"
    >
      <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
        {step === 1 && (
          <div className="space-y-4">
            {(!tipologiaHorario || !localFormacao) && (
              <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-sm text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                Recomendado preencher Tipologia de Horário e Local de Formação
                para o Dossier DGERT.
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Curso (PUBLISHED)</Label>
                <Select value={courseId} onValueChange={setCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {(courses.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {course && (
                  <p className="text-xs text-muted-foreground">
                    Ação: {course.name} · {courseHours}h
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Nº da Ação (ex: 053/2026)</Label>
                <Input
                  value={actionCode}
                  onChange={(e) => setActionCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Entidade Cliente</Label>
                <Select
                  value={clientOrgId}
                  onValueChange={(v) => {
                    setClientOrgId(v)
                    setContractId("")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {(orgs.data ?? []).map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Plano de Formação</Label>
                <Select
                  value={planId ?? NONE}
                  onValueChange={(v) => setPlanId(v === NONE ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sem plano</SelectItem>
                    {(plans.data ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Formato</Label>
                <Select
                  value={format}
                  onValueChange={(v) =>
                    setFormat(v as "PRESENCIAL" | "ELEARNING")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                    <SelectItem value="ELEARNING">E-learning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sala (opcional)</Label>
                <Select
                  value={roomId ?? NONE}
                  onValueChange={(v) => setRoomId(v === NONE ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem sala" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sem sala</SelectItem>
                    {(rooms.data ?? []).map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data início</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data fim</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-md border p-3">
              <p className="text-sm font-medium text-muted-foreground">
                Dados DGERT da ação
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Entidade Formadora</Label>
                  <Input
                    value={entidadeFormadora}
                    onChange={(e) => setEntidadeFormadora(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Iniciativa da Formação</Label>
                  <Input
                    value={iniciativaFormacao}
                    onChange={(e) => setIniciativaFormacao(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipologia de Horário</Label>
                  <Select
                    value={tipologiaHorario || NONE}
                    onValueChange={(v) =>
                      setTipologiaHorario(v === NONE ? "" : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>—</SelectItem>
                      <SelectItem value="LABORAL">Laboral</SelectItem>
                      <SelectItem value="POS_LABORAL">Pós-laboral</SelectItem>
                      <SelectItem value="MISTO">Misto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Local de Formação</Label>
                  <Select
                    value={localFormacao || NONE}
                    onValueChange={(v) =>
                      setLocalFormacao(v === NONE ? "" : v)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>—</SelectItem>
                      <SelectItem value="INSTALACOES_CLIENTE">
                        Instalações do Cliente
                      </SelectItem>
                      <SelectItem value="INSTALACOES_PROPRIAS">
                        Instalações Próprias
                      </SelectItem>
                      <SelectItem value="ONLINE">Online</SelectItem>
                      <SelectItem value="OUTRO">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
              <Label>Contrato (obrigatório)</Label>
              <Select
                value={contractId}
                onValueChange={setContractId}
                disabled={!clientOrgId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      clientOrgId
                        ? "Selecione o contrato"
                        : "Selecione a entidade cliente primeiro"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {(contracts.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.description ?? c.id} ·{" "}
                      {c.startDate
                        ? new Date(c.startDate).toLocaleDateString("pt-PT")
                        : "s/ data"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!contractId && (
                <p className="text-xs font-medium text-destructive">
                  É necessário associar um contrato antes de guardar.
                </p>
              )}
              {clientOrgId && (contracts.data ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Esta entidade não tem contratos. Crie um em Gestão →
                  Contratos.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {incompleteSessions && sessions.length > 0 && (
              <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-sm text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                Recomendado preencher Módulo e Tipo em todas as sessões para
                gerar o Dossier corretamente.
              </div>
            )}
            {hoursExceeded && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Sessões somam {sessionsHours}h e ultrapassam a duração do
                curso ({courseHours}h).
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {sessions.length} sessão(ões) · {sessionsHours}h de {courseHours}h
            </p>

            <div className="space-y-3">
              {sessions.map((s, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 items-end gap-2 rounded-md border p-3"
                >
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Data</Label>
                    <Input
                      type="date"
                      value={s.sessionDate}
                      onChange={(e) =>
                        updateSession(i, { sessionDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">Início</Label>
                    <Input
                      value={s.startTime}
                      onChange={(e) =>
                        updateSession(i, { startTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">Fim</Label>
                    <Input
                      value={s.endTime}
                      onChange={(e) =>
                        updateSession(i, { endTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">Horas</Label>
                    <Input
                      type="number"
                      step="0.5"
                      value={s.durationHours}
                      onChange={(e) =>
                        updateSession(i, {
                          durationHours: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Módulo</Label>
                    <Select
                      value={s.courseModuleId ?? NONE}
                      onValueChange={(v) =>
                        updateSession(i, {
                          courseModuleId: v === NONE ? null : v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Sem módulo</SelectItem>
                        {(modules.data ?? []).map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Tipo</Label>
                    <Select
                      value={s.sessionType ?? NONE}
                      onValueChange={(v) =>
                        updateSession(i, {
                          sessionType: v === NONE ? null : v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>—</SelectItem>
                        <SelectItem value="TEORICA">Teórica</SelectItem>
                        <SelectItem value="PRATICA">Prática</SelectItem>
                        <SelectItem value="MISTA">Mista</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">Formador</Label>
                    <Select
                      value={s.trainerId ?? NONE}
                      onValueChange={(v) =>
                        updateSession(i, {
                          trainerId: v === NONE ? null : v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>—</SelectItem>
                        {(trainers.data ?? []).map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {trainerName(t.users)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSession(i)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" onClick={addSession}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar sessão
            </Button>

            <div className="flex justify-between gap-2 border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                Voltar
              </Button>
              <Button
                type="button"
                disabled={upsert.isPending || !contractId || hoursExceeded}
                onClick={handleSave}
              >
                {upsert.isPending ? "A gravar..." : "Gravar Ação"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </FormModal>
  )
}
