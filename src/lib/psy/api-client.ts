/**
 * Cliente HTTP para o módulo Saúde Mental.
 *
 * Acrescenta o JWT da sessão Supabase ao header Authorization. NUNCA toca
 * directamente em psy_responses, psy_answers, psy_dispatch_tokens (essas
 * tabelas estão lock para o role authenticated; só o backend lê via service
 * role e devolve agregados).
 */
import { supabase } from "@/lib/supabase"

/**
 * Em dev, o Vite faz proxy /api → http://localhost:3001 (ver vite.config.ts),
 * por isso o caminho é sempre relativo. Em produção, frontend e API ficam
 * atrás do mesmo origin (ex: vercel + serverless functions, ou nginx
 * reverse proxy), pelo que /api continua relativo. Se for preciso forçar
 * um host externo (preview deploy, etc), definir VITE_API_BASE.
 */
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? ""

export class PsyApiError extends Error {
  status: number
  payload: unknown
  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

export async function psyFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const jwt = data.session?.access_token
  if (!jwt) {
    throw new PsyApiError("Sem sessão autenticada", 401, null)
  }

  const r = await fetch(`${API_BASE}/api/psy${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
  })
  const body = await r.json().catch(() => ({}))
  if (!r.ok) {
    throw new PsyApiError(
      (body as { error?: string })?.error ?? `HTTP ${r.status}`,
      r.status,
      body
    )
  }
  return body as T
}
