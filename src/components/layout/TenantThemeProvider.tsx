import type { CSSProperties, ReactNode } from "react"
import { useTenantStore } from "@/stores/tenant.store"

/**
 * Injeta as CSS variables do tenant activo de forma dinâmica.
 *
 * O Tailwind (config do Bloco 1) consome `--primary` e `--accent` como
 * triplets HSL via `hsl(var(--primary))`. Por isso `primaryColor` e
 * `accentColor` do tenant devem vir no formato "H S% L%" (ex: "217 91% 35%").
 * Quando o tenant não define um valor, mantém o tema default do globals.css.
 */
export function TenantThemeProvider({ children }: { children: ReactNode }) {
  const tenant = useTenantStore((s) => s.tenant)

  const style: CSSProperties = {}
  if (tenant?.primaryColor) {
    ;(style as Record<string, string>)["--primary"] = tenant.primaryColor
    ;(style as Record<string, string>)["--ring"] = tenant.primaryColor
  }
  if (tenant?.accentColor) {
    ;(style as Record<string, string>)["--accent"] = tenant.accentColor
  }
  if (tenant?.logoUrl) {
    ;(style as Record<string, string>)["--tenant-logo-url"] = `url("${tenant.logoUrl}")`
  }

  return (
    <div className="contents" data-tenant={tenant?.slug} style={style}>
      {children}
    </div>
  )
}
