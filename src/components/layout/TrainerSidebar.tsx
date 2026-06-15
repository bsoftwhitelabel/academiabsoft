import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  LogOut,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth.store"
import { signOut } from "@/hooks/useAuth"

const items = [
  { to: "/trainer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/trainer/sessions", label: "Minhas Sessões", icon: CalendarCheck },
  { to: "/trainer/materials", label: "Materiais", icon: BookOpen },
]

export function TrainerSidebar() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  async function handleLogout() {
    try {
      await signOut()
      logout()
      toast.success("Sessão terminada")
      navigate("/login", { replace: true })
    } catch {
      toast.error("Erro ao terminar sessão")
    }
  }

  const email = user?.email ?? ""
  const initial = email.charAt(0).toUpperCase() || "?"

  return (
    <aside className="w-60 shrink-0 bg-background border-r flex flex-col h-screen">
      <div className="h-16 flex items-center px-6 border-b shrink-0">
        <h1 className="text-lg font-semibold">Portal do Formador</h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )
            }
          >
            <Item icon={item.icon} label={item.label} />
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {email || "Utilizador"}
            </p>
            <p className="text-xs text-muted-foreground">Formador</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

function Item({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <>
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </>
  )
}
