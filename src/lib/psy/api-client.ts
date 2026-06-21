/**
 * Cliente HTTP para o módulo Saúde Mental.
 *
 * Acrescenta o JWT da sessão Supabase ao header Authorization. NUNCA toca
 * directamente em psy_responses, psy_answers, psy_dispatch_tokens (essas
 * tabelas estão lock para o role authenticated; só o backend lê via service
 * role e devolve agregados).
 */
import { getApiBase } from "@/lib/api-base"
import { supabase } from "@/lib/supabase"

export class PsyApiError extends Error {
  status: number
  payload: unknown
  constructor(message: string, status: number, payload: unknown) {
    super(message)
    this.status = status
    this.payload = payload
  }
}

/** Obtém access_token válido, com refresh se expirado ou perto de expirar. */
async function getAccessToken(): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession()
  let session = sessionData.session

  const expiresSoon =
    session?.expires_at != null &&
    session.expires_at * 1000 < Date.now() + 60_000

  if (!session?.access_token || expiresSoon) {
    const { data: refreshed, error } = await supabase.auth.refreshSession()
    if (error || !refreshed.session?.access_token) {
      throw new PsyApiError("Sem sessão autenticada", 401, null)
    }
    session = refreshed.session
  }

  return session.access_token
}

async function psyFetchOnce<T>(
  path: string,
  jwt: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; status: number; body: unknown }> {
  const r = await fetch(`${getApiBase()}/api/psy${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
  })
  const body = await r.json().catch(() => ({}))
  if (!r.ok) return { ok: false, status: r.status, body }
  return { ok: true, data: body as T }
}

export async function psyFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  let jwt = await getAccessToken()
  let result = await psyFetchOnce<T>(path, jwt, init)

  // Retry uma vez após refresh se o backend rejeitar o token
  if (!result.ok && result.status === 401) {
    const { data: refreshed, error } = await supabase.auth.refreshSession()
    if (!error && refreshed.session?.access_token) {
      jwt = refreshed.session.access_token
      result = await psyFetchOnce<T>(path, jwt, init)
    }
  }

  if (!result.ok) {
    throw new PsyApiError(
      (result.body as { error?: string })?.error ?? `HTTP ${result.status}`,
      result.status,
      result.body
    )
  }
  return result.data
}
