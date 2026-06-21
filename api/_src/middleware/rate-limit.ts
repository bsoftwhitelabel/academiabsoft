import type { Context, MiddlewareHandler } from "hono"

// Rate limit em memória por (scope, ip, token). Janela fixa de 1h.
// Suficiente para o Bloco 2 do Sprint 1: dev local, baixo volume.
// Em produção real (multi-instância) substituir por Redis ou store
// persistente. NÃO usar em escala sem isso.

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()
const WINDOW_MS = 60 * 60 * 1000

export function getClientIp(c: Context): string | null {
  const xff = c.req.header("x-forwarded-for")
  if (xff) return xff.split(",")[0]?.trim() ?? null
  const xri = c.req.header("x-real-ip")
  if (xri) return xri
  return null
}

function cleanup(now: number) {
  for (const [key, b] of buckets.entries()) {
    if (b.resetAt < now) buckets.delete(key)
  }
}

export function rateLimit(max: number, scope: string): MiddlewareHandler {
  return async (c, next) => {
    const now = Date.now()
    cleanup(now)
    const ip = getClientIp(c) ?? "unknown"
    const token = c.req.param("token") ?? "global"
    const key = `${scope}:${ip}:${token}`
    const b = buckets.get(key)
    if (!b || b.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
      return next()
    }
    if (b.count >= max) {
      return c.json(
        { error: "Demasiadas tentativas, tenta mais tarde" },
        429
      )
    }
    b.count++
    return next()
  }
}
