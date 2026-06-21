import "dotenv/config"

function httpsOrigin(url: string | undefined): string {
  if (!url) return ""
  const trimmed = url.trim().replace(/\/+$/, "")
  if (!trimmed) return ""
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  return `https://${trimmed}`
}

/** Origens injectadas pela Vercel (production, preview e branch deploys). */
function vercelOrigins(): string[] {
  const out: string[] = []
  for (const key of [
    "VERCEL_PROJECT_PRODUCTION_URL",
    "VERCEL_URL",
    "VERCEL_BRANCH_URL",
  ] as const) {
    const o = httpsOrigin(process.env[key])
    if (o && !out.includes(o)) out.push(o)
  }
  return out
}

function resolveAppOrigin(): string {
  const explicit = process.env.APP_ORIGIN?.trim()
  if (explicit) return httpsOrigin(explicit)
  return vercelOrigins()[0] ?? ""
}

function resolvePublicAppOrigin(): string {
  const explicit = process.env.PUBLIC_APP_ORIGIN?.trim()
  if (explicit) return httpsOrigin(explicit)
  const app = resolveAppOrigin()
  if (app) return app
  return process.env.CORS_ORIGIN ?? "http://localhost:5173"
}

// Env lida de forma tolerante: o servidor arranca mesmo sem
// SERVICE_ROLE_KEY (para o smoke test /health). A rota de PDF valida
// a presença da key e devolve erro claro se faltar.
export const env = {
  PORT: Number(process.env.PORT ?? 3001),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  SUPABASE_URL: httpsOrigin(process.env.SUPABASE_URL) || (process.env.SUPABASE_URL ?? ""),
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  // CORS_ORIGIN: legado, ainda lido como fallback em prod se APP_ORIGIN estiver vazio.
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  // APP_ORIGIN: domínio do frontend. Na Vercel, auto-detect via VERCEL_URL se omitido.
  APP_ORIGIN: resolveAppOrigin(),
  // PUBLIC_APP_ORIGIN: base para URLs /q/psy/:token geradas pelo backend.
  PUBLIC_APP_ORIGIN: resolvePublicAppOrigin(),
  PDF_BUCKET: process.env.PDF_BUCKET ?? "dossier-pdfs",
}

export const isProduction = env.NODE_ENV === "production"

/**
 * Resolve a origin a ecoar no header Access-Control-Allow-Origin para uma
 * dada Origin recebida. Em dev aceita qualquer porta de localhost (Vite move
 * de 5173 para 5174/5175 quando há conflitos). Em produção aceita APP_ORIGIN,
 * CORS_ORIGIN e origens Vercel auto-detectadas.
 *
 * Devolve null para bloquear (browser rejeita o pedido).
 */
const LOCALHOST_DEV_RE = /^http:\/\/localhost:\d+$/

export function resolveCorsOrigin(origin: string | undefined): string | null {
  if (!origin) return null
  const allowed: string[] = []
  if (env.APP_ORIGIN) allowed.push(env.APP_ORIGIN)
  if (env.CORS_ORIGIN) allowed.push(env.CORS_ORIGIN)
  for (const v of vercelOrigins()) {
    if (!allowed.includes(v)) allowed.push(v)
  }
  if (allowed.includes(origin)) return origin
  if (!isProduction && LOCALHOST_DEV_RE.test(origin)) return origin
  return null
}

export function assertPdfEnv(): string | null {
  return assertSupabaseEnv()
}

export function assertSupabaseEnv(): string | null {
  if (!env.SUPABASE_URL) return "SUPABASE_URL não configurado"
  if (!env.SUPABASE_SERVICE_ROLE_KEY)
    return "SUPABASE_SERVICE_ROLE_KEY não configurado"
  return null
}
