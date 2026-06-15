import { Outlet } from "react-router-dom"

// Layout para páginas públicas (sem autenticação): rota /q/:token e futuras
// páginas de catálogo. Não tem sidebar nem topbar. O TenantThemeProvider é
// global em main.tsx, logo as cores do tenant aplicam-se aqui também.
//
// Bloco 1 do Sprint 1: nome do tenant hardcoded para "Grupo Oporto Forte".
// No bloco 2 (Fase 2b real) virá via context resolvido a partir do token.
export function PublicLayout() {
  const currentYear = new Date().getFullYear()

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
        <Outlet />
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-3xl px-6 py-4 text-center text-xs text-muted-foreground">
          Entidade Formadora Certificada DGERT · {currentYear}
        </div>
      </footer>
    </div>
  )
}
