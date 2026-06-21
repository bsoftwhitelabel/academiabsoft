import { useState } from "react"
import { Copy, Send, RefreshCw, Check } from "lucide-react"
import { toast } from "sonner"
import { useCampaignLinks, type CampaignLinkToken } from "../useCampaignLinks"
import { useGenerateTokens } from "../useGenerateTokens"

export function DistribuirTab({ campaignId }: { campaignId: string }) {
  const linksQ = useCampaignLinks(campaignId)
  const generate = useGenerateTokens(campaignId)
  const [justCopied, setJustCopied] = useState<string | null>(null)

  async function onCopy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text)
      setJustCopied(key)
      setTimeout(() => setJustCopied((s) => (s === key ? null : s)), 1500)
    } catch {
      toast.error("Não foi possível copiar")
    }
  }

  async function onGenerate() {
    try {
      const r = await generate.mutateAsync({ expiraEmDias: 30 })
      toast.success(`${r.generated} links gerados (validade 30 dias)`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro a gerar tokens")
    }
  }

  const areas = linksQ.data?.areas ?? []
  const totalLinks = areas.reduce((s, a) => s + a.counts.total, 0)

  return (
    <section className="flex flex-col gap-6">
      {/* Banner anonimato */}
      <div className="bg-primary text-primary-foreground rounded-lg p-4 flex items-start gap-3">
        <Send className="h-5 w-5 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Distribuição de links anónimos</p>
          <p className="text-sm opacity-90 mt-1">
            Cada link é de uso único. Não é gravado IP, userAgent ou identidade
            do respondente. O email é descartado após o envio.
          </p>
        </div>
      </div>

      {/* Header de acção */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Gerar e distribuir links
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gera tokens por área conforme o número esperado. Entrega os URLs ao
            RH cliente; os respondentes acedem sem login.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalLinks > 0 ? (
            <button
              type="button"
              onClick={onGenerate}
              disabled={generate.isPending}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted disabled:opacity-50 flex items-center gap-2"
              title="Gera novos tokens (não apaga os existentes)"
            >
              <RefreshCw
                className={
                  "h-4 w-4 " + (generate.isPending ? "animate-spin" : "")
                }
              />
              Gerar mais
            </button>
          ) : (
            <button
              type="button"
              onClick={onGenerate}
              disabled={generate.isPending}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              {generate.isPending ? "A gerar..." : "Gerar links"}
            </button>
          )}
        </div>
      </div>

      {/* Estados */}
      {linksQ.isPending ? (
        <div className="text-sm text-muted-foreground">A carregar...</div>
      ) : linksQ.isError ? (
        <div className="text-sm text-destructive">
          Erro: {(linksQ.error as Error).message}
        </div>
      ) : null}

      {!linksQ.isPending && areas.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
          Esta campanha não tem áreas definidas.
        </div>
      ) : null}

      {/* Tabela por área */}
      {areas.map((a) => (
        <div
          key={a.areaId}
          className="bg-card border border-border rounded-lg overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-border flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-foreground">{a.area}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                {a.counts.total} tokens (esperados: {a.esperados}) - pendente {a.counts.pendente},
                enviado {a.counts.enviado}, usado {a.counts.usado}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const all = a.tokens.map((t) => t.url).join("\n")
                onCopy(all, `area-${a.areaId}`)
              }}
              className="text-xs font-semibold px-3 py-1.5 border border-border rounded hover:bg-muted flex items-center gap-1.5"
              disabled={a.tokens.length === 0}
            >
              {justCopied === `area-${a.areaId}` ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copiar todos
            </button>
          </div>
          {a.tokens.length === 0 ? (
            <div className="px-6 py-6 text-sm text-muted-foreground text-center">
              Sem tokens. Clica em "Gerar links" no topo.
            </div>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Link público
                  </th>
                  <th className="px-6 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-32">
                    Estado
                  </th>
                  <th className="px-6 py-2 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-24">
                    Acção
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {a.tokens.map((t) => (
                  <TokenRow
                    key={t.id}
                    token={t}
                    onCopy={() => onCopy(t.url, t.id)}
                    copied={justCopied === t.id}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </section>
  )
}

function TokenRow({
  token,
  onCopy,
  copied,
}: {
  token: CampaignLinkToken
  onCopy: () => void
  copied: boolean
}) {
  return (
    <tr className="hover:bg-muted/30">
      <td className="px-6 py-2 font-mono text-xs text-foreground truncate max-w-[420px]">
        {token.url}
      </td>
      <td className="px-6 py-2">
        <EstadoBadge estado={token.estado} />
      </td>
      <td className="px-6 py-2 text-right">
        <button
          type="button"
          onClick={onCopy}
          disabled={token.estado === "usado"}
          className="text-xs font-medium px-2 py-1 hover:bg-muted rounded inline-flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
          title={
            token.estado === "usado"
              ? "Token já usado, não pode ser reutilizado"
              : "Copiar link"
          }
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </td>
    </tr>
  )
}

function EstadoBadge({ estado }: { estado: CampaignLinkToken["estado"] }) {
  if (estado === "usado") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
        USADO
      </span>
    )
  }
  if (estado === "enviado") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border border-primary/40 bg-primary/10 text-foreground">
        ENVIADO
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border border-border bg-muted text-muted-foreground">
      PENDENTE
    </span>
  )
}
