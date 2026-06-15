import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// "há 2 horas", "há 1 dia" — relativo a agora, pt-PT.
export function formatRelativeTime(isoDate: string): string {
  const then = new Date(isoDate).getTime()
  if (isNaN(then)) return "—"
  const diffMs = then - Date.now()
  const rtf = new Intl.RelativeTimeFormat("pt-PT", { numeric: "auto" })
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000000],
    ["month", 2592000000],
    ["day", 86400000],
    ["hour", 3600000],
    ["minute", 60000],
    ["second", 1000],
  ]
  for (const [unit, ms] of units) {
    if (Math.abs(diffMs) >= ms || unit === "second") {
      return rtf.format(Math.round(diffMs / ms), unit)
    }
  }
  return "agora"
}

// "2026-05-19" (data local, p/ nome de ficheiro).
export function todayISO(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}
