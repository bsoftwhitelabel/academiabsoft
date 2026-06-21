/**
 * Base URL para pedidos à API Hono (/api/*).
 *
 * Produção: same-origin ("") salvo VITE_API_BASE explícito.
 * Dev: proxy Vite /api → :3001; VITE_PDF_API_URL legado só em dev.
 *
 * NUNCA definir VITE_PDF_API_URL na Vercel — embute localhost no bundle.
 */
function trimBase(value: string | undefined): string {
  return value?.trim().replace(/\/+$/, "") ?? ""
}

export const API_BASE = (() => {
  const explicit = trimBase(import.meta.env.VITE_API_BASE as string | undefined)
  if (explicit) return explicit

  if (!import.meta.env.PROD) {
    const legacy = trimBase(
      import.meta.env.VITE_PDF_API_URL as string | undefined
    )
    if (legacy) return legacy
  }

  return ""
})()
