import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getApiBase } from "@/lib/api-base"

export type Question = {
  id: string
  text: string
  type: "SCALE" | "TEXT"
  scaleMin: number | null
  scaleMax: number | null
  order: number
  isRequired: boolean
}

export type Questionnaire = {
  id: string
  name: string
  format: string | null
  targetRole: string | null
  context: string | null
}

export type ResponseTokenData =
  | {
      status: "pending"
      respondentName: string
      questionnaire: Questionnaire
      questions: Question[]
      action: { actionCode: string } | null
    }
  | { status: "done"; respondedAt: string }
  | { status: "expired" }

export class ResponseTokenError extends Error {
  status: number
  payload: unknown
  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

async function fetchResponse(token: string): Promise<ResponseTokenData> {
  const r = await fetch(`${getApiBase()}/api/q/${encodeURIComponent(token)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
  const body = await r.json().catch(() => ({}))
  if (r.status === 410) return { status: "expired" }
  if (!r.ok) {
    throw new ResponseTokenError(
      (body as { error?: string })?.error ?? `HTTP ${r.status}`,
      r.status,
      body
    )
  }
  return body as ResponseTokenData
}

export function useResponseToken(token: string | undefined) {
  return useQuery({
    queryKey: ["public-response", token],
    queryFn: () => fetchResponse(token as string),
    enabled: typeof token === "string" && token.length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })
}

export type AnswerPayload = {
  questionId: string
  scaleValue?: number | null
  textValue?: string | null
}

async function submitResponse(
  token: string,
  answers: AnswerPayload[]
): Promise<{ ok: true; respondedAt: string }> {
  const r = await fetch(`${getApiBase()}/api/q/${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answers }),
  })
  const body = await r.json().catch(() => ({}))
  if (!r.ok) {
    throw new ResponseTokenError(
      (body as { error?: string })?.error ?? `HTTP ${r.status}`,
      r.status,
      body
    )
  }
  return body as { ok: true; respondedAt: string }
}

export function useSubmitResponse(token: string | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (answers: AnswerPayload[]) =>
      submitResponse(token as string, answers),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["public-response", token] })
    },
  })
}
