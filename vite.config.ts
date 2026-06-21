import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import path from "path"

export default defineConfig({
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
})
