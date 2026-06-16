import { useMemo, useState } from "react"
import { Outlet } from "react-router-dom"

// Layout para páginas públicas (sem autenticação): rota /q/:token e futuras
// páginas de catálogo. Não tem sidebar nem topbar. O TenantThemeProvider é
// global em main.tsx, logo as cores do tenant aplicam-se aqui também.
//
// O footer é controlável pelo filho via outlet context: páginas em estado
// de erro (404/410) chamam setShowFooter(false) para não dar pista de
// "produto activo" quando o link é inválido.
//
// Bloco 1 do Sprint 1: nome do tenant hardcoded para "Grupo Oporto Forte".
// Resolução por token virá num bloco futuro.

export type PublicLayoutContext = {
  setShowFooter: (v: boolean) => void
}

export function PublicLayout() {
  const currentYear = new Date().getFullYear()
  const [showFooter, setShowFooter] = useState(true)
  const ctx = useMemo<PublicLayoutContext>(
    () => ({ setShowFooter }),
    []
  )

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-5 flex items-center gap-4">
          <div
            className="h-10 w-10 rounded bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold"
            aria-hidden
          >
            OF
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold leading-tight">
              Grupo Oporto Forte
            </span>
            <span className="text-xs text-muted-foreground leading-tight">
              Avaliação de Formação
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-[720px] px-6 py-12">
        <Outlet context={ctx} />
      </main>

      {showFooter && (
        <footer className="border-t border-border bg-card">
          <div className="mx-auto max-w-3xl px-6 py-4 text-center text-xs text-muted-foreground">
            Entidade Formadora Certificada DGERT · {currentYear}
          </div>
        </footer>
      )}
    </div>
  )
}
