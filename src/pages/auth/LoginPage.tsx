import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"
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
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border bg-background p-8"
      >
        <h1 className="text-center text-2xl font-semibold">Academia Digital</h1>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
              aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
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
    </div>
  )
}
