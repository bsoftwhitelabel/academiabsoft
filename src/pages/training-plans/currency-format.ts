// Helpers de formatação/parsing de moeda pt-PT. Sem JSX para que o
// CurrencyInput.tsx fique como ficheiro só-de-componente (regra
// react-refresh/only-export-components).

const FMT = new Intl.NumberFormat("pt-PT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatPtPtCurrency(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return ""
  return FMT.format(n)
}

/**
 * Parser tolerante: aceita "12.000,00 €", "12 000,00", "12000,5", "12000.50",
 * "12000". Heurística pt-PT: vírgula = decimal; ponto = milhares quando há
 * vírgula ou múltiplos pontos.
 */
export function parsePtPtCurrency(text: string | null | undefined): number | null {
  if (text == null) return null
  let s = String(text).replace(/€/g, "").replace(/\s/g, "").trim()
  if (!s) return null
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".")
  } else if (s.includes(",")) {
    s = s.replace(",", ".")
  } else {
    const dots = s.split(".").length - 1
    if (dots > 1) s = s.replace(/\./g, "")
  }
  s = s.replace(/[^0-9.-]/g, "")
  if (s === "" || s === "-" || s === ".") return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}
