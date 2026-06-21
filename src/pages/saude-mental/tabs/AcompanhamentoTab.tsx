import { useCampaigns } from "../useCampaigns"
import { useCampaignLinks } from "../useCampaignLinks"

export function AcompanhamentoTab({ campaignId }: { campaignId: string }) {
  const campaignsQ = useCampaigns()
  const linksQ = useCampaignLinks(campaignId)

  const camp = (campaignsQ.data?.campaigns ?? []).find(
    (c) => c.id === campaignId
  )
  const areas = linksQ.data?.areas ?? []

  const esperadosTotal = areas.reduce((s, a) => s + a.esperados, 0)
  const usadosTotal = areas.reduce((s, a) => s + a.counts.usado, 0)
  const adesaoPct =
    esperadosTotal > 0 ? Math.round((usadosTotal / esperadosTotal) * 100) : 0

  const metaPct = camp?.metaAmostragemPct ?? 75
  const areasAbaixo = areas
    .filter((a) => {
      const pct = a.esperados > 0 ? (a.counts.usado / a.esperados) * 100 : 0
      return a.esperados > 0 && pct < metaPct
    })
    .map((a) => a.area)

  return (
    <section className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label="Adesão global"
          right={
            <Donut percent={adesaoPct} />
          }
          sub="Participação em tempo real"
        />
        <KpiCard
          label="Respostas recebidas"
          right={
            <div className="text-right">
              <div className="text-3xl font-semibold tabular-nums text-foreground">
                {usadosTotal}
              </div>
              <div className="text-sm text-muted-foreground">
                / {esperadosTotal}
              </div>
            </div>
          }
          sub={`Meta mínima de ${metaPct}%`}
        />
        <KpiCard
          label="Áreas abaixo da meta"
          right={
            <div className="text-3xl font-semibold tabular-nums text-destructive">
              {areasAbaixo.length}
            </div>
          }
          sub={
            areasAbaixo.length > 0
              ? areasAbaixo.join(", ")
              : "Todas acima da meta"
          }
        />
      </div>

      {/* Tabela por área */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h4 className="font-semibold text-foreground">
            Acompanhamento por área
          </h4>
        </div>
        {linksQ.isPending ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            A carregar...
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Área
                </th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Esperados
                </th>
                <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Respondidos
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-1/4">
                  Adesão
                </th>
                <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {areas.map((a) => {
                const pct =
                  a.esperados > 0
                    ? Math.round((a.counts.usado / a.esperados) * 100)
                    : 0
                const acima = pct >= metaPct
                return (
                  <tr key={a.areaId} className="hover:bg-muted/30">
                    <td className="px-6 py-3 font-semibold text-foreground">
                      {a.area}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums">
                      {a.esperados}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums">
                      {a.counts.usado}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={
                              "h-full " +
                              (acima ? "bg-emerald-600" : "bg-destructive")
                            }
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        <span className="text-[13px] tabular-nums font-semibold w-10">
                          {pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {acima ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 uppercase whitespace-nowrap">
                          Acima da meta
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border border-destructive bg-destructive/10 text-destructive uppercase whitespace-nowrap">
                          Abaixo da meta
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
              {areas.length === 0 && !linksQ.isPending ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-muted-foreground"
                  >
                    Sem áreas. Gera tokens primeiro na tab Distribuir.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

function KpiCard({
  label,
  right,
  sub,
}: {
  label: string
  right: React.ReactNode
  sub?: string
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-6 flex items-center gap-6 min-h-[120px]">
      <div className="flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {sub ? (
          <p className="text-sm text-muted-foreground mt-2">{sub}</p>
        ) : null}
      </div>
      <div className="shrink-0">{right}</div>
    </div>
  )
}

function Donut({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          strokeWidth="3"
          className="stroke-muted"
        />
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${clamped}, 100`}
          className="stroke-primary"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold tabular-nums text-foreground">
        {clamped}%
      </div>
    </div>
  )
}
