import { useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"

export function useAuth() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, session, isLoading, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    let mounted = true

    async function init() {
      setLoading(true)
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setUser(data.session?.user ?? null, data.session ?? null)
    }
    init()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setUser(nextSession?.user ?? null, nextSession ?? null)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [setUser, setLoading])

  useEffect(() => {
    if (isLoading) return
    if (!session && location.pathname !== "/login") {
      navigate("/login", { replace: true })
    }
  }, [isLoading, session, location.pathname, navigate])

  return { user, session, isLoading }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
