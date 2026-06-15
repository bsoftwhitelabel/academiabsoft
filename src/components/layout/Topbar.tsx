import { useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Bell, User as UserIcon, LogOut } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/stores/auth.store"
import { signOut } from "@/hooks/useAuth"

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  "training-plans": "Planos de Formação",
  courses: "Cursos",
  actions: "Ações de Formação",
  trainers: "Formadores",
  trainees: "Formandos",
  questionarios: "Questionários",
  management: "Gestão",
  analytics: "Relatórios",
  approvals: "Aprovações",
  projects: "Projetos",
}

const TRAINER_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  sessions: "Minhas Sessões",
  materials: "Materiais",
}

function resolveTitle(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean)
  const tIdx = segments.indexOf("trainer")
  if (tIdx >= 0) {
    const sub = segments[tIdx + 1]
    // /trainer/sessions/:id -> "Sessão"
    if (sub === "sessions" && segments[tIdx + 2]) return "Sessão"
    return TRAINER_TITLES[sub] ?? "Portal do Formador"
  }
  const idx = segments.indexOf("admin")
  const key = idx >= 0 ? segments[idx + 1] : segments[0]
  return TITLES[key] ?? "Academia Digital"
}

export function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  const title = useMemo(() => resolveTitle(location.pathname), [location.pathname])
  const email = user?.email ?? "Utilizador"
  const initial = (user?.email?.charAt(0) ?? "?").toUpperCase()

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

  return (
    <header className="sticky top-0 z-10 h-16 shrink-0 bg-background border-b flex items-center justify-between px-6">
      <h2 className="text-base font-semibold">{title}</h2>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notificações">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium"
            >
              {initial}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toast.info("Perfil em desenvolvimento")}>
              <UserIcon className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
