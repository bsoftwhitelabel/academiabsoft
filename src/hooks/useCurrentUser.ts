import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/stores/auth.store"

export interface AppUser {
  id: string
  email: string
  role: string
  tenantId: string
  firstName: string | null
  lastName: string | null
}

// O JWT não traz role custom; a ligação auth->app users é por email
// (auth.uid() não casa com users.id cuid). Resolve o utilizador da app.
export function useCurrentUser() {
  const email = useAuthStore((s) => s.user?.email)
  return useQuery({
    queryKey: ["current-app-user", email],
    enabled: !!email,
    queryFn: async (): Promise<AppUser | null> => {
      const { data, error } = await supabase
        .from("users")
        .select("id,email,role,tenantId,firstName,lastName")
        .eq("email", email as string)
        .maybeSingle()
      if (error) throw error
      return (data as AppUser) ?? null
    },
  })
}

export function useIsSuperAdmin() {
  const q = useCurrentUser()
  return q.data?.role === "SUPER_ADMIN"
}
