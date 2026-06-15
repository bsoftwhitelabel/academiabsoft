import { Navigate, Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"
import { useAuth } from "@/hooks/useAuth"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export function AdminLayout() {
  const { isLoading, session } = useAuth()
  const currentUser = useCurrentUser()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        A carregar...
      </div>
    )
  }

  if (!session) {
    // useAuth já redireciona para /login. Evita piscar o layout.
    return null
  }

  // Guard de role: TRAINER não acede ao /admin/*; vai para o portal
  // próprio. Espera o role resolver antes de decidir. Fail-open: se a
  // query falhar (ex.: RLS), não bloqueia o acesso.
  if (currentUser.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        A carregar...
      </div>
    )
  }
  if (currentUser.data?.role === "TRAINER") {
    return <Navigate to="/trainer/dashboard" replace />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
