import { useCallback, useEffect, useMemo, useState } from "react"
import { useOutletContext, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { PublicLayoutContext } from "@/components/layout/PublicLayout"
import {
  ResponseTokenError,
  useResponseToken,
  useSubmitResponse,
  type AnswerPayload,
  type Question,
} from "./useResponseToken"

type AnswerMap = Record<string, { scaleValue?: number; textValue?: string }>

const DT_FMT = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "short",
  timeStyle: "short",
})

function fmtDate(iso: string): string {
  try {
    return DT_FMT.format(new Date(iso))
  } catch {
    return iso
  }
}

export function PublicRespondPage() {
  const { token } = useParams<{ token: string }>()
  const { setShowFooter } = useOutletContext<PublicLayoutContext>()
  const query = useResponseToken(token)
  const submit = useSubmitResponse(token)

  const isInvalid =
    query.isError &&
    query.error instanceof ResponseTokenError &&
    query.error.status === 404
  const isExpired = !query.isError && query.data?.status === "expired"
  const isDone = !query.isError && query.data?.status === "done"

  useEffect(() => {
    setShowFooter(!(isInvalid || isExpired))
    return () => setShowFooter(true)
  }, [isInvalid, isExpired, setShowFooter])

  if (query.isLoading) {
    return <LoadingState />
  }

  if (isInvalid) {
    return (
      <ErrorState
        title="Link inválido"
        body="O link que abriu não foi encontrado. Verifica se copiaste o endereço completo. Se o problema persistir, contacta a entidade formadora."
      />
    )
  }

  if (isExpired) {
    return (
      <ErrorState
        title="Este questionário expirou"
        body="O prazo de resposta a este questionário já passou. Contacta a entidade formadora se precisares de prolongar o prazo."
      />
    )
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Erro ao carregar"
        body="Não foi possível carregar o questionário. Tenta refrescar a página."
      />
    )
  }

  if (isDone && query.data?.status === "done") {
    return <DoneState respondedAt={query.data.respondedAt} />
  }

  if (query.data?.status !== "pending") {
    return null
  }

  return (
    <PendingForm
      token={token!}
      respondentName={query.data.respondentName}
      questionnaireName={query.data.questionnaire.name}
      actionCode={query.data.action?.actionCode ?? null}
      questions={query.data.questions}
      isSubmitting={submit.isPending}
      onSubmit={(answers) =>
        submit.mutate(answers, {
          onError: (err) => {
            const msg =
              err instanceof ResponseTokenError
                ? err.message
                : "Erro ao enviar respostas. Tenta novamente."
            toast.error(msg)
          },
          onSuccess: () => {
            toast.success("Respostas registadas. Obrigado!")
          },
        })
      }
    />
  )
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="h-6 w-2/3 rounded bg-muted animate-pulse" />
      <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
      <div className="h-32 rounded-lg border border-border bg-muted/40 animate-pulse" />
      <div className="h-32 rounded-lg border border-border bg-muted/40 animate-pulse" />
      <p className="text-center text-sm text-muted-foreground">
        A carregar questionário...
      </p>
    </div>
  )
}

function ErrorState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
      <h1 className="text-xl font-semibold text-destructive">{title}</h1>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">{body}</p>
    </div>
  )
}

function DoneState({ respondedAt }: { respondedAt: string }) {
  return (
    <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-8 text-center space-y-3">
      <h1 className="text-xl font-semibold text-emerald-800">
        Já respondeu este questionário
      </h1>
      <p className="text-sm text-emerald-900">
        Registado em {fmtDate(respondedAt)}.
      </p>
      <p className="text-sm text-emerald-900">
        Obrigado pela sua participação.
      </p>
    </div>
  )
}

type PendingFormProps = {
  token: string
  respondentName: string
  questionnaireName: string
  actionCode: string | null
  questions: Question[]
  isSubmitting: boolean
  onSubmit: (answers: AnswerPayload[]) => void
}

function PendingForm({
  respondentName,
  questionnaireName,
  actionCode,
  questions,
  isSubmitting,
  onSubmit,
}: PendingFormProps) {
  const [answers, setAnswers] = useState<AnswerMap>({})

  const setScale = useCallback((qid: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [qid]: { ...prev[qid], scaleValue: value } }))
  }, [])

  const setText = useCallback((qid: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: { ...prev[qid], textValue: value } }))
  }, [])

  const missingRequired = useMemo(() => {
    const missing: number[] = []
    questions.forEach((q, idx) => {
      if (!q.isRequired) return
      const a = answers[q.id]
      if (q.type === "SCALE" && (a?.scaleValue == null)) missing.push(idx + 1)
      if (q.type === "TEXT" && !a?.textValue?.trim()) missing.push(idx + 1)
    })
    return missing
  }, [answers, questions])

  const canSubmit = missingRequired.length === 0 && !isSubmitting

  const handleSubmit = () => {
    if (!canSubmit) return
    const payload: AnswerPayload[] = []
    for (const q of questions) {
      const a = answers[q.id]
      if (!a) continue
      if (q.type === "SCALE" && a.scaleValue != null) {
        payload.push({ questionId: q.id, scaleValue: a.scaleValue })
      } else if (q.type === "TEXT" && a.textValue && a.textValue.trim()) {
        payload.push({ questionId: q.id, textValue: a.textValue })
      }
    }
    onSubmit(payload)
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold leading-tight">
          {questionnaireName}
        </h1>
        <p className="text-sm text-muted-foreground">
          Respondente: <span className="font-medium text-foreground">{respondentName}</span>
        </p>
        {actionCode && (
          <p className="text-sm text-muted-foreground">
            Acção: <span className="font-medium text-foreground">{actionCode}</span>
          </p>
        )}
      </div>

      <ol className="space-y-5">
        {questions.map((q, idx) => (
          <li
            key={q.id}
            className="rounded-lg border border-border bg-card p-6 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Pergunta {idx + 1} de {questions.length}
                </div>
                <p className="text-base font-medium leading-snug">{q.text}</p>
              </div>
              {q.isRequired && (
                <Badge variant="outline" className="shrink-0 text-xs">
                  Obrigatório
                </Badge>
              )}
            </div>

            {q.type === "SCALE" && (
              <ScaleInput
                qid={q.id}
                value={answers[q.id]?.scaleValue}
                min={q.scaleMin ?? 1}
                max={q.scaleMax ?? 5}
                onChange={(v) => setScale(q.id, v)}
              />
            )}

            {q.type === "TEXT" && (
              <TextInput
                qid={q.id}
                value={answers[q.id]?.textValue ?? ""}
                onChange={(v) => setText(q.id, v)}
              />
            )}
          </li>
        ))}
      </ol>

      {missingRequired.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Falta responder:{" "}
          {missingRequired.map((n) => `pergunta ${n}`).join(", ")}
        </div>
      )}

      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={!canSubmit}
        onClick={handleSubmit}
      >
        {isSubmitting ? "A enviar..." : "Enviar respostas"}
      </Button>
    </div>
  )
}

const SCALE_1_4_LABELS = ["Insuficiente", "Suficiente", "Bom", "Excelente"]

function ScaleInput({
  qid,
  value,
  min,
  max,
  onChange,
}: {
  qid: string
  value: number | undefined
  min: number
  max: number
  onChange: (v: number) => void
}) {
  const isStandard4 = min === 1 && max === 4
  const isStandard5 = min === 1 && max === 5
  const values = useMemo(() => {
    const arr: number[] = []
    for (let i = min; i <= max; i++) arr.push(i)
    return arr
  }, [min, max])

  return (
    <div>
      <div
        role="radiogroup"
        aria-label={`Resposta da pergunta ${qid}`}
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}
      >
        {values.map((v) => {
          const label = isStandard4 ? SCALE_1_4_LABELS[v - 1] : String(v)
          const selected = value === v
          return (
            <label
              key={v}
              className={`flex flex-col items-center justify-center gap-1 rounded-md border px-2 py-3 cursor-pointer text-center text-sm transition select-none min-h-[60px] ${
                selected
                  ? "border-primary bg-primary/10 text-primary font-semibold"
                  : "border-border bg-background hover:border-primary/50"
              }`}
            >
              <input
                type="radio"
                name={qid}
                value={v}
                checked={selected}
                onChange={() => onChange(v)}
                className="sr-only"
              />
              {isStandard5 && (
                <span className="text-base font-semibold">{v}</span>
              )}
              {isStandard4 && <span>{label}</span>}
              {!isStandard4 && !isStandard5 && (
                <span className="text-base font-semibold">{v}</span>
              )}
            </label>
          )
        })}
      </div>
      {isStandard5 && (
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>1 - Mau</span>
          <span>5 - Excelente</span>
        </div>
      )}
    </div>
  )
}

function TextInput({
  qid,
  value,
  onChange,
}: {
  qid: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <Textarea
        id={qid}
        rows={5}
        maxLength={5000}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Escreva a sua resposta aqui..."
      />
      <div className="mt-1 flex justify-end text-xs text-muted-foreground">
        {value.length} / 5000
      </div>
    </div>
  )
}
