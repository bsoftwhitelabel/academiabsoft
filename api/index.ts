/**
 * Handler Vercel Serverless. Vercel detecta ficheiros em `api/` (raiz, não
 * subpastas) como Functions. Este é o único endpoint que expomos: actua
 * como catch-all via `vercel.json` rewrites, delegando para o app Hono.
 *
 * NÃO importa pdf.ts: o `isServerless` em app.ts faz com que a rota PDF
 * responda 501, mantendo puppeteer fora do bundle.
 */
import { handle } from "hono/vercel"
import { app } from "./src/app.js"

// Sem `export const config = { runtime }`: Vercel @vercel/node 5+ deprecou
// a string "nodejs" e a sintaxe nova mudaria semântica. Default é Node.js
// Serverless Function, que é o que queremos.
export default handle(app)
