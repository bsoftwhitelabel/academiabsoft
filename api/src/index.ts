/**
 * Bootstrap do servidor Hono em Node local (npm run dev:api).
 * Em Vercel Serverless, a entrada é api/index.ts (que reusa a mesma app).
 */
import { serve } from "@hono/node-server"
import { app, isServerless } from "./app.js"
import { env, isProduction } from "./env.js"

// Em Node local: monta a rota PDF dinamicamente (mantém puppeteer fora do
// bundle quando o app for empacotado pelo Vercel). Puppeteer está em
// optionalDependencies, portanto pode não estar instalado: try/catch
// permite arrancar mesmo sem ele.
if (!isServerless) {
  try {
    const { pdfRoute } = await import("./routes/pdf.js")
    app.route("/api/pdf", pdfRoute)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.warn(`[api] PDF route desactivada: ${msg}`)
  }
}

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`[api] Hono a ouvir em http://localhost:${info.port}`)
  console.log(
    `[api] CORS: NODE_ENV=${env.NODE_ENV} APP_ORIGIN=${env.APP_ORIGIN || "(vazio)"} CORS_ORIGIN=${env.CORS_ORIGIN}; em dev aceita qualquer http://localhost:<porta>`
  )
  if (isProduction && !env.APP_ORIGIN) {
    console.warn(
      "[api] AVISO: NODE_ENV=production mas APP_ORIGIN não definido. CORS vai aceitar apenas CORS_ORIGIN."
    )
  }
})
