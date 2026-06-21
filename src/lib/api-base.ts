/**
 * Base URL para pedidos à API Hono (/api/*).
 *
 * Em produção (qualquer host ≠ localhost): same-origin ("").
 * Em dev local: VITE_API_BASE ou VITE_PDF_API_URL, ou "" (proxy Vite).
 *
 * Resolvido em runtime (não no build) para ignorar VITE_PDF_API_URL=localhost
 * embutido por engano na Vercel.
 */
function trimBase(value: string | undefined): string {
  return value?.trim().replace(/\/+$/, "") ?? ""
}

function isLocalDevHost(): boolean {
  if (typeof window === "undefined") return import.meta.env.DEV
  const h = window.location.hostname
  return h === "localhost" || h === "127.0.0.1"
}

export function getApiBase(): string {
  if (!isLocalDevHost()) {
    const explicit = trimBase(import.meta.env.VITE_API_BASE as string | undefined)
    if (explicit && !/localhost|127\.0\.0\.1/i.test(explicit)) return explicit
    return ""
  }

  const explicit = trimBase(import.meta.env.VITE_API_BASE as string | undefined)
  if (explicit) return explicit
  return trimBase(import.meta.env.VITE_PDF_API_URL as string | undefined) || ""
}

/** @deprecated Preferir getApiBase() — constante não reflecte runtime em builds antigos */
export const API_BASE = ""
