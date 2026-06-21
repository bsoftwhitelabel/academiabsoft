import type { CSSProperties, ReactNode } from "react"
import { useTheme } from "next-themes"
import { useTenantStore } from "@/stores/tenant.store"

/**
 * Injeta as CSS variables do tenant activo no formato HSL ("H S% L%")
 * consumido pelo Tailwind via hsl(var(--primary)).
 *
 * Em modo escuro aumenta a luminosidade do primary do tenant ~+25%
 * para garantir legibilidade contra os fundos escuros do tema dark.
 */

function lighten(hslTriplet: string, delta: number): string {
  const m = hslTriplet
    .trim()
    .match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/)
  if (!m) return hslTriplet
  const h = m[1]
  const s = m[2]
  const l = Math.min(95, Math.max(5, Number(m[3]) + delta))
  return `${h} ${s}% ${l}%`
}

export function TenantThemeProvider({ children }: { children: ReactNode }) {
  const tenant = useTenantStore((s) => s.tenant)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const style: CSSProperties = {}
  if (tenant?.primaryColor) {
    const value = isDark
      ? lighten(tenant.primaryColor, 25)
      : tenant.primaryColor
    ;(style as Record<string, string>)["--primary"] = value
    ;(style as Record<string, string>)["--ring"] = value
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
