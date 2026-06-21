import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { env, isProduction, resolveCorsOrigin } from "./env.js"
import { pdfRoute } from "./routes/pdf.js"
import { psyRoutes } from "./routes/psy.js"
import { psyPublicRoutes } from "./routes/psy-public.js"
import { questionnaireRoutes } from "./routes/questionnaires.js"

const app = new Hono()

app.use(
  "*",
  cors({
    // Função: dev aceita qualquer porta de localhost (Vite muda de porta
    // quando há conflito); prod aceita só APP_ORIGIN/CORS_ORIGIN explícitas.
    origin: (origin) => resolveCorsOrigin(origin),
    credentials: true,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  })
)
// OPTIONS preflight: Hono cors trata, mas garantimos resposta 204 em qualquer rota.
app.options("*", (c) => c.body(null, 204))

app.get("/health", (c) =>
  c.json({ ok: true, service: "academia-api", ts: new Date().toISOString() })
)

app.route("/api/pdf", pdfRoute)
app.route("/api/q", questionnaireRoutes)
app.route("/api/q/psy", psyPublicRoutes)
app.route("/api/psy", psyRoutes)

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
