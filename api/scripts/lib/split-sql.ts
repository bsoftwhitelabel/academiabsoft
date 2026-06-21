/**
 * Split simples e correcto de SQL em statements separados.
 *
 * Suporta:
 *   - comentários linha (--), ignorados
 *   - dollar-quoted strings $$ ... $$ (não suporta tags nomeadas $tag$, mas
 *     v11/v12 não usam tags nomeadas)
 *   - strings simples 'texto'
 *
 * NÃO suporta (porque não aparecem nas nossas migrações):
 *   - dollar-quoted com tag $foo$ ... $foo$
 *   - comentários de bloco aninhados
 */
export function splitSqlStatements(sqlText: string): string[] {
  // Remove comentários linha primeiro
  const lines = sqlText.split(/\r?\n/).map((l) => {
    // Remover -- até fim da linha, MAS não dentro de string (heurística simples)
    let out = ""
    let inSingle = false
    for (let i = 0; i < l.length; i++) {
      const ch = l[i]
      if (ch === "'" && l[i - 1] !== "\\") inSingle = !inSingle
      if (!inSingle && ch === "-" && l[i + 1] === "-") break
      out += ch
    }
    return out
  })
  const text = lines.join("\n")

  const out: string[] = []
  let buf = ""
  let inDollar = false
  let inSingle = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    // $$ toggle (apenas $$ sem tag)
    if (!inSingle && ch === "$" && text[i + 1] === "$") {
      buf += "$$"
      inDollar = !inDollar
      i++
      continue
    }
    if (!inDollar && ch === "'" && text[i - 1] !== "\\") {
      inSingle = !inSingle
      buf += ch
      continue
    }
    if (ch === ";" && !inDollar && !inSingle) {
      const t = buf.trim()
      if (t) out.push(t)
      buf = ""
      continue
    }
    buf += ch
  }
  const t = buf.trim()
  if (t) out.push(t)
  return out
}
