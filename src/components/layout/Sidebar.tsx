import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  CalendarRange,
  BookOpen,
  ClipboardList,
  UserCheck,
  Users,
  Settings2,
  BarChart3,
  CheckSquare,
  FolderKanban,
  LogOut,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth.store"
import { signOut } from "@/hooks/useAuth"

const operationalItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/training-plans", label: "Planos de Formação", icon: CalendarRange },
  { to: "/admin/courses", label: "Cursos", icon: BookOpen },
  { to: "/admin/actions", label: "Ações de Formação", icon: ClipboardList },
  { to: "/admin/trainers", label: "Formadores", icon: UserCheck },
  { to: "/admin/trainees", label: "Formandos", icon: Users },
  { to: "/admin/questionarios", label: "Questionários", icon: ClipboardList },
  { to: "/admin/management", label: "Gestão", icon: Settings2 },
]

const comingSoonItems = [
  { to: "/admin/analytics", label: "Relatórios", icon: BarChart3 },
  { to: "/admin/approvals", label: "Aprovações", icon: CheckSquare },
  { to: "/admin/projects", label: "Projetos", icon: FolderKanban },
]

export function Sidebar() {
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
        <h1 className="text-lg font-semibold">Academia Digital</h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {operationalItems.map((item) => (
          <SidebarItem key={item.to} {...item} />
        ))}
        <div className="pt-4 mt-4 border-t">
          <p className="px-3 mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            Em breve
          </p>
          {comingSoonItems.map((item) => (
            <SidebarItem key={item.to} {...item} disabled />
          ))}
        </div>
      </nav>

      <div className="border-t p-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{email || "Utilizador"}</p>
            <p className="text-xs text-muted-foreground">Administrador</p>
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

function SidebarItem({
  to,
  label,
  icon: Icon,
  disabled,
}: {
  to: string
  label: string
  icon: LucideIcon
  disabled?: boolean
}) {
  return (
    <NavLink
      to={to}
      aria-disabled={disabled}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition",
          isActive && !disabled
            ? "bg-primary text-primary-foreground"
            : "text-foreground hover:bg-muted",
          disabled && "opacity-50 pointer-events-none"
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </NavLink>
  )
}
