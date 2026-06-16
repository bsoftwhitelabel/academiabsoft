import { serve } from "@hono/node-server"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { env } from "./env.js"
import { pdfRoute } from "./routes/pdf.js"
import { questionnaireRoutes } from "./routes/questionnaires.js"

const app = new Hono()

app.use(
  "*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
)

app.get("/health", (c) =>
  c.json({ ok: true, service: "academia-api", ts: new Date().toISOString() })
)

app.route("/api/pdf", pdfRoute)
app.route("/api/q", questionnaireRoutes)

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`[api] Hono a ouvir em http://localhost:${info.port}`)
  console.log(`[api] CORS origin: ${env.CORS_ORIGIN}`)
})
