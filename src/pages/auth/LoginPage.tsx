import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff, Mail, Lock, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"
import { toast } from "sonner"

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("admin@oportoforte.com")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      // 1. Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      if (!data.session) throw new Error("Sessão não criada")

      // 2. Força o store a refletir a sessão JÁ (antes do navigate), senão
      //    a página destino vê user=null e volta a mostrar o login (BUG 2).
      if (data.session.user) {
        useAuthStore.getState().setUser(data.session.user, data.session)
      }

      // 3. Garante que a sessão propagou no client (RLS depende de
      //    auth.uid()) antes de consultar o role (BUG 1).
      const { data: sessionCheck } = await supabase.auth.getSession()
      if (!sessionCheck.session) {
        await new Promise((r) => setTimeout(r, 200))
      }

      // 4. Role do utilizador autenticado, agora com sessão activa.
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role")
        .eq("email", email)
        .maybeSingle()

      const role = (userData as { role?: string } | null)?.role
      const landing =
        !userError && role === "TRAINER"
          ? "/trainer/dashboard"
          : "/admin/dashboard"

      toast.success("Login efetuado")
      navigate(landing, { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao entrar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold">Academia Digital</h1>
            <p className="text-sm text-muted-foreground">
              Inicia sessão na tua área
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail
                aria-hidden
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Palavra-passe</Label>
              <button
                type="button"
                onClick={() =>
                  toast.info("Recuperação de palavra-passe em desenvolvimento")
                }
                className="text-xs text-primary hover:underline"
              >
                Esqueci-me da palavra-passe
              </button>
            </div>
            <div className="relative">
              <Lock
                aria-hidden
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-9 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={
                  showPassword ? "Esconder palavra-passe" : "Mostrar palavra-passe"
                }
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "A entrar..." : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Precisas de ajuda?{" "}
          <button
            type="button"
            onClick={() => toast.info("Contacto: suporte@oportoforte.com")}
            className="text-primary hover:underline"
          >
            Contactar suporte
          </button>
        </p>
      </div>
    </div>
  )
}
