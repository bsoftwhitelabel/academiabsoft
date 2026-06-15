import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Session } from "@supabase/supabase-js"
import type { Tenant } from "@/stores/tenant.store"

interface AuthState {
  user: User | null
  session: Session | null
  tenant: Tenant | null
  isLoading: boolean
  setUser: (user: User | null, session?: Session | null) => void
  setTenant: (tenant: Tenant | null) => void
  setLoading: (isLoading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      tenant: null,
      isLoading: true,
      setUser: (user, session) =>
        set((state) => ({
          user,
          session: session !== undefined ? session : state.session,
          isLoading: false,
        })),
      setTenant: (tenant) => set({ tenant }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, session: null, tenant: null, isLoading: false }),
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        tenant: state.tenant,
      }),
    }
  )
)
