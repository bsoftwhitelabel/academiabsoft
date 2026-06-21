import "dotenv/config"

// Env lida de forma tolerante: o servidor arranca mesmo sem
// SERVICE_ROLE_KEY (para o smoke test /health). A rota de PDF valida
// a presença da key e devolve erro claro se faltar.
export const env = {
  PORT: Number(process.env.PORT ?? 3001),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  SUPABASE_URL: process.env.SUPABASE_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  // CORS_ORIGIN: legado, ainda lido como fallback em prod se APP_ORIGIN estiver vazio.
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  // APP_ORIGIN: origem permitida em produção (ex: https://app.dominio.pt).
  APP_ORIGIN: process.env.APP_ORIGIN ?? "",
  // PUBLIC_APP_ORIGIN: base usada para construir URLs públicos /q/psy/:token
  // que o operador entrega ao RH. Em dev é o Vite (default 5173).
  PUBLIC_APP_ORIGIN:
    process.env.PUBLIC_APP_ORIGIN ?? process.env.APP_ORIGIN ?? "http://localhost:5173",
  PDF_BUCKET: process.env.PDF_BUCKET ?? "dossier-pdfs",
}

export const isProduction = env.NODE_ENV === "production"

/**
 * Resolve a origin a ecoar no header Access-Control-Allow-Origin para uma
 * dada Origin recebida. Em dev aceita qualquer porta de localhost (Vite move
 * de 5173 para 5174/5175 quando há conflitos). Em produção só aceita as
 * origins explicitamente listadas em APP_ORIGIN/CORS_ORIGIN.
 *
 * Devolve null para bloquear (browser rejeita o pedido).
 */
const LOCALHOST_DEV_RE = /^http:\/\/localhost:\d+$/

export function resolveCorsOrigin(origin: string | undefined): string | null {
  if (!origin) return null
  const allowed: string[] = []
  if (env.APP_ORIGIN) allowed.push(env.APP_ORIGIN)
  if (env.CORS_ORIGIN) allowed.push(env.CORS_ORIGIN)
  if (allowed.includes(origin)) return origin
  if (!isProduction && LOCALHOST_DEV_RE.test(origin)) return origin
  return null
}

export function assertPdfEnv(): string | null {
  if (!env.SUPABASE_URL) return "SUPABASE_URL não configurado em api/.env"
  if (!env.SUPABASE_SERVICE_ROLE_KEY)
    return "SUPABASE_SERVICE_ROLE_KEY não configurado em api/.env"
  return null
}
