/**
 * Base URL para pedidos à API Hono (/api/*).
 *
 * Default "" = same-origin (produção Vercel e dev com proxy Vite → :3001).
 * Override opcional: VITE_API_BASE ou legado VITE_PDF_API_URL.
 */
export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  (import.meta.env.VITE_PDF_API_URL as string | undefined) ??
  ""
