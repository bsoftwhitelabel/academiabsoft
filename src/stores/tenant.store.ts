import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Tenant {
  tenantId: string
  slug: string
  name: string
  primaryColor: string | null
  accentColor: string | null
  logoUrl: string | null
}

interface TenantState {
  tenant: Tenant | null
  setTenant: (tenant: Tenant | null) => void
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      tenant: null,
      setTenant: (tenant) => set({ tenant }),
    }),
    { name: "tenant-store" }
  )
)
