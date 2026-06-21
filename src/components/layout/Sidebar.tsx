import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  CalendarDays,
  GraduationCap,
  CalendarClock,
  Megaphone,
  Users,
  ClipboardList,
  Building2,
  BarChart3,
  CheckCircle2,
  FolderKanban,
  HeartPulse,
  Settings,
  HelpCircle,
  LogOut,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth.store"
import { useTenantStore } from "@/stores/tenant.store"
import { signOut } from "@/hooks/useAuth"

const operationalItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/training-plans", label: "Planos de Formação", icon: CalendarDays },
  { to: "/admin/courses", label: "Cursos", icon: GraduationCap },
  { to: "/admin/actions", label: "Ações de Formação", icon: CalendarClock },
  { to: "/admin/trainers", label: "Formadores", icon: Megaphone },
  { to: "/admin/trainees", label: "Formandos", icon: Users },
  { to: "/admin/questionarios", label: "Questionários", icon: ClipboardList },
  { to: "/admin/saude-mental", label: "Saúde Mental", icon: HeartPulse },
  { to: "/admin/management", label: "Gestão", icon: Building2 },
]

const comingSoonItems = [
  { to: "/admin/analytics", label: "Relatórios", icon: BarChart3 },
  { to: "/admin/approvals", label: "Aprovações", icon: CheckCircle2 },
  { to: "/admin/projects", label: "Projetos", icon: FolderKanban },
]

export function Sidebar() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const tenant = useTenantStore((s) => s.tenant)

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
  const platformName = tenant?.name ?? "Academia Digital"
  const tenantInitials =
    platformName
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("") || "AD"

  return (
    <aside className="w-[248px] shrink-0 bg-card border-r border-border flex flex-col h-screen">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-border shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary text-sm font-semibold">
          {tenantInitials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight truncate">
            {platformName}
          </p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Academia Digital
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {operationalItems.map((item) => (
          <SidebarItem key={item.to} {...item} />
        ))}
        <div className="pt-4 mt-4 border-t border-border">
          <p className="px-3 mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            Em breve
          </p>
          {comingSoonItems.map((item) => (
            <SidebarItem key={item.to} {...item} disabled />
          ))}
        </div>
      </nav>

      <div className="border-t border-border px-2 py-2 space-y-0.5 shrink-0">
        <SidebarAction
          icon={Settings}
          label="Configurações"
          onClick={() => toast.info("Configurações em desenvolvimento")}
        />
        <SidebarAction
          icon={HelpCircle}
          label="Suporte"
          onClick={() => toast.info("Suporte em desenvolvimento")}
        />
      </div>

      <div className="border-t border-border px-3 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
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
          "flex items-center gap-3 rounded-md text-sm transition px-3 py-2",
          isActive && !disabled
            ? "bg-muted text-primary font-medium border-l-2 border-primary pl-[10px]"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          disabled && "opacity-50 pointer-events-none"
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </NavLink>
  )
}

function SidebarAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition px-3 py-2"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </button>
  )
}
