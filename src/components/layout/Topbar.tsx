import { useNavigate } from "react-router-dom"
import { useTheme } from "next-themes"
import { Search, Sun, Moon, Bell, User as UserIcon, LogOut } from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
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

function deriveInitials(email: string | undefined): string {
  if (!email) return "?"
  const parts = email.split(/[.@_\-+]/).filter(Boolean)
  if (parts.length === 0) return "?"
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("")
}

export function Topbar() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { resolvedTheme, setTheme } = useTheme()

  const email = user?.email ?? "Utilizador"
  const initials = deriveInitials(user?.email)
  const isDark = resolvedTheme === "dark"

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
    <header className="sticky top-0 z-10 h-[52px] shrink-0 bg-card border-b border-border flex items-center justify-between px-4 gap-4">
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Pesquisar"
          placeholder="Pesquisar..."
          className="pl-9 h-9 bg-background border-input"
        />
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label={isDark ? "Tema claro" : "Tema escuro"}
          onClick={() => setTheme(isDark ? "light" : "dark")}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
          <span
            aria-hidden
            className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-destructive ring-2 ring-card"
          />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" aria-hidden />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold"
              aria-label="Menu de utilizador"
            >
              {initials}
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
