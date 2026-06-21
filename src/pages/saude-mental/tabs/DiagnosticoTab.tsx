import { useAgregados, type AgregadoComputeResult } from "../useAgregados"
import { useCampaignLinks } from "../useCampaignLinks"
import { labelPsyGroup } from "@/lib/psy/labels"

export function DiagnosticoTab({ campaignId }: { campaignId: string }) {
  const q = useAgregados(campaignId)
  const linksQ = useCampaignLinks(campaignId)
  const areaNameById = new Map(
    (linksQ.data?.areas ?? []).map((a) => [a.areaId, a.area])
  )

  if (q.isPending) {
    return <div className="text-sm text-muted-foreground">A carregar...</div>
  }
  if (q.isError) {
    return (
      <div className="text-sm text-destructive">
        Erro: {(q.error as Error).message}
      </div>
    )
  }
  const geral = q.data!.geral
  if (geral.insuficiente) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <p className="text-base font-semibold text-foreground">
          Amostra insuficiente
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {geral.n} respostas. Mínimo {geral.minN}.
        </p>
      </div>
    )
  }

  const porArea = q.data!.por_area
  const areaIds = Object.keys(porArea).sort()
  // Top dimensões para o heatmap, limita a 8 para legibilidade.
  const heatmapDims = geral.top.slice(0, 8)

  return (
    <section className="flex flex-col gap-6">
      {/* Heatmap dim x area */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex justify-between items-start mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Heatmap por área
            </h3>
            <p className="text-xs text-muted-foreground">
              Pontuação (0-100) das top dimensões cruzada com áreas (gating
              N&gt;=5)
            </p>
          </div>
          <Legenda />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="p-2 w-1/3">Dimensão</th>
                {areaIds.map((aid) => (
                  <th key={aid} className="p-2 text-center">
                    {areaNameById.get(aid) ?? aid.slice(0, 12)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapDims.map((d) => (
                <tr key={d.dimensionId} className="border-t border-border">
                  <td className="p-2 font-medium text-foreground">{d.nome}</td>
                  {areaIds.map((aid) => {
                    const ag = porArea[aid]
                    const cell = cellForArea(ag, d.dimensionId)
                    return (
                      <td key={aid} className="p-1">
                        {cell.kind === "value" ? (
                          <div
                            className={`h-8 flex items-center justify-center text-[11px] font-semibold rounded ${heatColor(cell.score)}`}
                            title={`Pontuação ${cell.score}`}
                          >
                            {cell.score}
                          </div>
                        ) : (
                          <div
                            className="h-8 flex items-center justify-center text-[10px] font-semibold rounded bg-muted text-muted-foreground"
                            title="Amostra insuficiente"
                          >
                            n&lt;5
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {heatmapDims.length === 0 ? (
                <tr>
                  <td
                    colSpan={areaIds.length + 1}
                    className="px-2 py-6 text-center text-sm text-muted-foreground"
                  >
                    Sem dimensões para mostrar.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Planos de acção (placeholder) */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Planos de acção
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          Recomendações por dimensão crítica. Os textos reais estão a redigir.
        </p>
        <ul className="space-y-3">
          {geral.top.slice(0, 5).map((d) => (
            <li
              key={d.dimensionId}
              className="border border-border rounded p-4 flex items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {d.nome}
                </p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">
                  {labelPsyGroup(d.grupo)} - {d.tipo} - Bloco {d.bloco ?? "-"}
                </p>
                <p className="text-sm text-muted-foreground mt-2 italic">
                  Plano de acção a redigir.
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {d.classificacao}
                </p>
                <p className="text-2xl font-bold tabular-nums text-foreground mt-1">
                  {d.pontuacao}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function cellForArea(
  ag: AgregadoComputeResult | undefined,
  dimensionId: string
): { kind: "value"; score: number } | { kind: "insuficiente" } {
  if (!ag || ag.insuficiente) return { kind: "insuficiente" }
  const d = ag.dimensoes.find((x) => x.dimensionId === dimensionId)
  if (!d) return { kind: "insuficiente" }
  return { kind: "value", score: d.pontuacao }
}

function heatColor(score: number): string {
  // 0-100. Baixo = vermelho (risco). Alto = verde (favorável).
  // Pontuação = ((media-1)/4)*100; alto = pior em Risco. Mas no agregado, o
  // motor já orienta -> pontuação reflete o nível de risco da dimensão.
  // Para o heatmap: alto=mau (escala risco).
  if (score >= 75) return "bg-red-200 text-red-900 dark:bg-red-950/40 dark:text-red-200"
  if (score >= 50) return "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
  if (score >= 25) return "bg-amber-50 text-amber-800"
  return "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
}

function Legenda() {
  return (
    <div className="flex flex-col items-end">
      <div className="h-2 w-32 bg-gradient-to-r from-emerald-400 via-amber-300 to-red-500 rounded-full mb-1" />
      <div className="flex justify-between w-32 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  )
}
