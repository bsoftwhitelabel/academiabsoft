import "dotenv/config"

// Env lida de forma tolerante: o servidor arranca mesmo sem
// SERVICE_ROLE_KEY (para o smoke test /health). A rota de PDF valida
// a presença da key e devolve erro claro se faltar.
export const env = {
  PORT: Number(process.env.PORT ?? 3001),
  SUPABASE_URL: process.env.SUPABASE_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  PDF_BUCKET: process.env.PDF_BUCKET ?? "dossier-pdfs",
}

export function assertPdfEnv(): string | null {
  if (!env.SUPABASE_URL) return "SUPABASE_URL não configurado em api/.env"
  if (!env.SUPABASE_SERVICE_ROLE_KEY)
    return "SUPABASE_SERVICE_ROLE_KEY não configurado em api/.env"
  return null
}
