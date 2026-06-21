import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@/styles/globals.css"

const missing = [
  !import.meta.env.VITE_SUPABASE_URL?.trim() && "VITE_SUPABASE_URL",
  !import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() && "VITE_SUPABASE_ANON_KEY",
].filter(Boolean) as string[]

const root = document.getElementById("root")!

if (missing.length > 0) {
  createRoot(root).render(
    <StrictMode>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
          background: "#f8faf9",
          color: "#1a1a1a",
        }}
      >
        <div style={{ maxWidth: 520 }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
            Configuração em falta
          </h1>
          <p style={{ marginBottom: "1rem", lineHeight: 1.5 }}>
            O frontend não arrancou porque faltam variáveis de ambiente no build:
          </p>
          <ul style={{ marginBottom: "1rem", paddingLeft: "1.25rem" }}>
            {missing.map((name) => (
              <li key={name}>
                <code>{name}</code>
              </li>
            ))}
          </ul>
          <p style={{ lineHeight: 1.5, fontSize: "0.95rem" }}>
            Na Vercel: <strong>Settings → Environment Variables</strong> → definir
            para Production, Preview e Development →{" "}
            <strong>Redeploy</strong> (o Vite embute estas vars no build).
          </p>
        </div>
      </div>
    </StrictMode>
  )
} else {
  const { mountApp } = await import("./bootstrap")
  mountApp()
}
