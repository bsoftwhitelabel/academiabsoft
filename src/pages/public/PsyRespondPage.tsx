import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ShieldCheck, CheckCircle2 } from "lucide-react"

/**
 * Página pública de resposta a um questionário psicossocial.
 *
 * URL: /q/psy/:token  (sem login, mobile-first).
 * Comprimento da campanha é aplicado pelo backend: o GET devolve já só as
 * perguntas correctas (curto/medio/longo).
 */

type Question = {
  id: string
  dimensionId: string
  codigo: string
  texto: string
  direcao: "Direta" | "Inversa"
  ordem: number
}

type Dimension = {
  id: string
  codigo: string
  nome: string
  bloco: string | null
  grupo: string
  tipo: "Risco" | "Protetiva"
  ordem: number
}

type GetResponse =
  | {
      status: "pending"
      comprimento: string
      instrumentVersao: string
      etiquetaValidacao: string
      dimensions: Dimension[]
      questions: Question[]
    }
  | { status: "done"; usadoEm: string }
  | { status: "expired" }
  | { status: "closed" }

import { getApiBase } from "@/lib/api-base"

async function fetchPublic(token: string): Promise<GetResponse> {
  const r = await fetch(`${getApiBase()}/api/q/psy/${encodeURIComponent(token)}`)
  if (r.status === 410) {
    const b = (await r.json().catch(() => ({}))) as GetResponse
    return b
  }
  const body = await r.json().catch(() => ({}))
  if (!r.ok) {
    throw new Error((body as { error?: string }).error ?? `HTTP ${r.status}`)
  }
  return body as GetResponse
}

async function submitPublic(
  token: string,
  answers: Array<{ questionId: string; valor: number }>
) {
  const r = await fetch(`${getApiBase()}/api/q/psy/${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  })
  const body = await r.json().catch(() => ({}))
  if (!r.ok) {
    throw new Error((body as { error?: string }).error ?? `HTTP ${r.status}`)
  }
  return body as { ok: true }
}

export function PsyRespondPage() {
  const { token } = useParams<{ token: string }>()
  const qc = useQueryClient()
  const q = useQuery({
    queryKey: ["psy-public", token],
    queryFn: () => fetchPublic(token!),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  })

  const submit = useMutation({
    mutationFn: (answers: Array<{ questionId: string; valor: number }>) =>
      submitPublic(token!, answers),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["psy-public", token] }),
  })

  if (q.isPending) {
    return (
      <FullCenter>
        <p className="text-sm text-muted-foreground">A carregar…</p>
      </FullCenter>
    )
  }
  if (q.isError) {
    return (
      <FullCenter>
        <p className="text-sm text-destructive">
          {(q.error as Error).message}
        </p>
      </FullCenter>
    )
  }
  const r = q.data!
  if (r.status === "done") {
    return (
      <Success message="Esta resposta já foi submetida. Obrigado pela tua participação." />
    )
  }
  if (r.status === "expired") {
    return (
      <FullCenter>
        <p className="text-sm font-semibold text-foreground">
          Link expirado
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Pede um novo link à equipa de RH.
        </p>
      </FullCenter>
    )
  }
  if (r.status === "closed") {
    return (
      <FullCenter>
        <p className="text-sm font-semibold text-foreground">
          Campanha encerrada
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Esta avaliação já não aceita respostas.
        </p>
      </FullCenter>
    )
  }

  if (submit.isSuccess) {
    return <Success message="Resposta submetida. Obrigado!" />
  }

  return <Form data={r} onSubmit={(a) => submit.mutate(a)} isPending={submit.isPending} error={submit.error as Error | null} />
}

function Form({
  data,
  onSubmit,
  isPending,
  error,
}: {
  data: Extract<GetResponse, { status: "pending" }>
  onSubmit: (a: Array<{ questionId: string; valor: number }>) => void
  isPending: boolean
  error: Error | null
}) {
  const [values, setValues] = useState<Record<string, number>>({})

  const total = data.questions.length
  const respondidas = useMemo(
    () => Object.keys(values).length,
    [values]
  )
  const pct = total > 0 ? Math.round((respondidas / total) * 100) : 0
  const completo = respondidas === total

  function pick(qId: string, v: number) {
    setValues((prev) => ({ ...prev, [qId]: v }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!completo || isPending) return
    onSubmit(
      data.questions.map((q) => ({ questionId: q.id, valor: values[q.id]! }))
    )
  }

  // Header sticky com progresso
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
              Avaliação anónima - {data.etiquetaValidacao}
            </p>
          </div>
          <h1 className="text-base font-semibold text-foreground">
            Saúde Mental no Trabalho
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs tabular-nums font-semibold text-muted-foreground w-16 text-right">
              {respondidas}/{total}
            </span>
          </div>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-6"
      >
        {/* Banner anonimato */}
        <div className="bg-primary text-primary-foreground rounded-lg p-4 text-sm leading-relaxed">
          As respostas são anónimas. Não é gravado o teu endereço de email,
          IP nem qualquer identificador. Os resultados são agregados por área
          (mínimo 5 respostas).
        </div>

        {/* Lista de perguntas */}
        {data.questions.map((q, i) => {
          const dim = data.dimensions.find((d) => d.id === q.dimensionId)
          const selected = values[q.id]
          return (
            <fieldset
              key={q.id}
              className="bg-card border border-border rounded-lg p-4"
            >
              <legend className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                {i + 1} / {total} {dim ? "- " + dim.nome : ""}
              </legend>
              <p className="text-sm text-foreground leading-relaxed mb-4">
                {q.texto}
              </p>
              <LikertScale
                value={selected}
                onChange={(v) => pick(q.id, v)}
                name={q.id}
              />
            </fieldset>
          )
        })}

        {error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : null}

        <button
          type="submit"
          disabled={!completo || isPending}
          className="w-full h-12 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending
            ? "A submeter…"
            : !completo
              ? `Faltam ${total - respondidas} resposta(s)`
              : "Submeter respostas"}
        </button>
      </form>
    </div>
  )
}

const LIKERT_OPTIONS: Array<{ valor: number; label: string }> = [
  { valor: 1, label: "Nunca" },
  { valor: 2, label: "Raramente" },
  { valor: 3, label: "Às vezes" },
  { valor: 4, label: "Frequentemente" },
  { valor: 5, label: "Sempre" },
]

function LikertScale({
  value,
  onChange,
  name,
}: {
  value: number | undefined
  onChange: (v: number) => void
  name: string
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {LIKERT_OPTIONS.map((opt) => {
        const active = value === opt.valor
        return (
          <label
            key={opt.valor}
            className={
              "flex flex-col items-center justify-center text-center cursor-pointer rounded-lg border py-3 px-1 transition-colors " +
              (active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/50")
            }
          >
            <input
              type="radio"
              name={name}
              value={opt.valor}
              checked={active}
              onChange={() => onChange(opt.valor)}
              className="sr-only"
            />
            <span className="text-base font-semibold tabular-nums">
              {opt.valor}
            </span>
            <span className="text-[10px] mt-0.5 leading-tight">
              {opt.label}
            </span>
          </label>
        )
      })}
    </div>
  )
}

function FullCenter({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full text-center">
        {children}
      </div>
    </div>
  )
}

function Success({ message }: { message: string }) {
  return (
    <FullCenter>
      <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto mb-4" />
      <p className="text-base font-semibold text-foreground">{message}</p>
      <p className="text-sm text-muted-foreground mt-2">
        Podes fechar esta página.
      </p>
    </FullCenter>
  )
}
