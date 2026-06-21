/**
 * App Hono partilhada entre runtime Node local (api/src/index.ts) e
 * runtime Vercel Serverless (api/index.ts).
 *
 * NÃO arranca server aqui. Apenas constrói e exporta `app`.
 *
 * A rota /api/pdf usa Puppeteer e NÃO cabe em Vercel Serverless sem o
 * extra `@sparticuz/chromium` (passagem futura). Em serverless devolvemos
 * 501. Em Node local, o bootstrap monta a rota dinamicamente.
 */
import { Hono } from "hono"
import { cors } from "hono/cors"
import { resolveCorsOrigin } from "./env.js"
import { psyRoutes } from "./routes/psy.js"
import { psyPublicRoutes } from "./routes/psy-public.js"
import { questionnaireRoutes } from "./routes/questionnaires.js"

export const isServerless =
  !!process.env.VERCEL || process.env.SKIP_PDF_ROUTE === "1"

export const app = new Hono()

app.use(
  "*",
  cors({
    origin: (origin) => resolveCorsOrigin(origin),
    credentials: true,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  })
)
app.options("*", (c) => c.body(null, 204))

const healthPayload = () => ({
  ok: true,
  service: "academia-api",
  runtime: process.env.VERCEL ? "vercel" : "node",
  ts: new Date().toISOString(),
})

// /health — Node local (curl :3001/health). /api/health — Vercel (rewrite /api/*).
app.get("/health", (c) => c.json(healthPayload()))
app.get("/api/health", (c) => c.json(healthPayload()))

// Rotas que correm em ambos os runtimes
app.route("/api/q", questionnaireRoutes)
app.route("/api/q/psy", psyPublicRoutes)
app.route("/api/psy", psyRoutes)

// Em serverless, anunciamos o 501 da rota PDF e a app NÃO importa puppeteer
// (mantém o bundle leve abaixo do limite do Vercel).
if (isServerless) {
  app.all("/api/pdf/*", (c) =>
    c.json(
      {
        error:
          "Rota PDF indisponível em serverless. Requer @sparticuz/chromium + puppeteer-core para empacotar Chromium em <50MB.",
      },
      501
    )
  )
}
