import { Outlet } from "react-router-dom"
import { TrainerSidebar } from "./TrainerSidebar"
import { Topbar } from "./Topbar"
import { useAuth } from "@/hooks/useAuth"

// Mesma estrutura do AdminLayout. O White Label (TenantThemeProvider) é
// global em main.tsx, logo aplica-se aqui automaticamente. Sem guard de
// role: o admin também pode ver o portal do formador (vê tudo).
export function TrainerLayout() {
  const { isLoading, session } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        A carregar...
      </div>
    )
  }

  if (!session) {
    // useAuth já redireciona para /login.
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <TrainerSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
