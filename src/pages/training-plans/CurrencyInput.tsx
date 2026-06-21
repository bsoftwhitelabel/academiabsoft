import { useState } from "react"
import { Input } from "@/components/ui/input"
import { formatPtPtCurrency, parsePtPtCurrency } from "./currency-format"

interface Props {
  id?: string
  value: number | null
  onValueChange: (n: number | null) => void
  placeholder?: string
  "aria-invalid"?: boolean
}

/**
 * Input controlado com máscara pt-PT. Em foco mostra o que o utilizador
 * escreve. Em blur reformata o canónico ("12.000,00 €"). Guarda sempre
 * um número limpo via onValueChange.
 */
export function CurrencyInput({
  id,
  value,
  onValueChange,
  placeholder,
  ...rest
}: Props) {
  const [text, setText] = useState<string>(() => formatPtPtCurrency(value))
  const [focused, setFocused] = useState(false)
  const [lastSynced, setLastSynced] = useState<number | null>(value)

  // Derived state: quando o `value` controlado muda por fora (ex. reset,
  // load remoto), re-sincronizamos o display — mas só quando o input não
  // está em foco, para não destruir o que o utilizador escreve.
  if (!focused && value !== lastSynced) {
    setLastSynced(value)
    setText(formatPtPtCurrency(value))
  }

  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      placeholder={placeholder ?? "0,00 €"}
      value={text}
      onChange={(e) => {
        const raw = e.target.value
        setText(raw)
        onValueChange(parsePtPtCurrency(raw))
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false)
        setText(formatPtPtCurrency(value))
      }}
      aria-invalid={rest["aria-invalid"]}
    />
  )
}
