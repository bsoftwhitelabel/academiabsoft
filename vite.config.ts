import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

const REQUIRED_VITE_ENV = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
] as const

function assertProductionEnv(mode: string, env: Record<string, string>) {
  if (mode !== "production") return
  const missing = REQUIRED_VITE_ENV.filter((name) => !env[name]?.trim())
  if (missing.length === 0) return
  throw new Error(
    `[build] Variáveis em falta: ${missing.join(", ")}.\n` +
      "Na Vercel: Settings → Environment Variables → adicionar para Production, Preview e Development → Redeploy.\n" +
      "Local: copiar .env.example para .env.local e preencher."
  )
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  assertProductionEnv(mode, env)

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      open: true,
      proxy: {
        // Em dev, /api/* passa pelo Vite e é encaminhado para Hono em :3001.
        // Frontend chama caminhos relativos /api/...; o browser nunca vê outra
        // origem, eliminando o preflight CORS em dev.
        "/api": {
          target: "http://localhost:3001",
          changeOrigin: true,
        },
      },
    },
  }
})
