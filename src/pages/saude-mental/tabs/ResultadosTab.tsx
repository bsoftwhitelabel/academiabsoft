import { useAgregados, type AgregadoMatrizCelula } from "../useAgregados"

export function ResultadosTab({ campaignId }: { campaignId: string }) {
  const q = useAgregados(campaignId)

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
          {geral.n} respostas recebidas. Mínimo {geral.minN} para apresentar
          resultados.
        </p>
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-6">
      {/* IGRP + IMO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IndicadorCard
          titulo="Índice Geral de Risco Psicossocial (IGRP)"
          sub="Métrica escalar de exposição a factores de stress"
          valor={geral.igrp.valor}
          banda={geral.igrp.banda}
          escala="alto-mau"
        />
        <IndicadorCard
          titulo="Índice de Maturidade Organizacional (IMO)"
          sub="Capacidade estrutural de resposta protetiva (provisório)"
          valor={geral.imo.valor}
          banda={geral.imo.banda}
          escala="alto-bom"
          provisorio
        />
      </div>

      {/* Matriz + Top */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 bg-card border border-border rounded-xl p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">
              Matriz de Criticidade
            </h3>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">
              Probabilidade vs Impacto, contagem de dimensões por célula
            </p>
          </div>
          <MatrizCriticidade matriz={geral.matriz} />
        </div>

        <div className="xl:col-span-5 bg-card border border-border rounded-xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Top dimensões
            </h3>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">
              Ordenadas por criticidade (probabilidade × impacto)
            </p>
          </div>
          <ul className="divide-y divide-border">
            {geral.top.slice(0, 10).map((d) => (
              <li
                key={d.dimensionId}
                className="py-2 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {d.nome}
                  </p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    {d.bloco ?? "-"} - {d.tipo}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PrioridadeBadge prioridade={d.prioridade} />
                  <span className="text-sm tabular-nums font-semibold text-foreground w-8 text-right">
                    {d.criticidade}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

function IndicadorCard({
  titulo,
  sub,
  valor,
  banda,
  escala,
  provisorio,
}: {
  titulo: string
  sub: string
  valor: number
  banda: string
  escala: "alto-mau" | "alto-bom"
  provisorio?: boolean
}) {
  const valorDisplay = Math.round(valor * 10) / 10
  const pct = Math.round(((valor - 1) / 4) * 100)
  const cor = bandaColor(banda, escala)
  return (
    <div className="bg-card border border-border p-6 rounded-xl flex flex-col">
      <div className="flex justify-between items-start mb-4 gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-foreground">{titulo}</h3>
          <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        </div>
        <div
          className={`px-2 py-1 rounded text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap ${cor.badge}`}
        >
          {banda}
          {provisorio ? " (prov.)" : ""}
        </div>
      </div>
      <div className="flex items-end gap-6 mt-auto">
        <div className="text-5xl font-bold text-foreground leading-none tabular-nums">
          {valorDisplay}
        </div>
        <div className="flex-1 pb-2">
          <div className="flex justify-between text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
            <span>Min: 1.0</span>
            <span>Max: 5.0</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden relative">
            <div
              className={`absolute h-full ${cor.bar}`}
              style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function bandaColor(
  banda: string,
  escala: "alto-mau" | "alto-bom"
): { badge: string; bar: string } {
  // Para escala "alto-bom" (IMO), invertemos a interpretação.
  const mau = "bg-destructive/10 text-destructive border border-destructive/30"
  const alerta = "bg-amber-50 text-amber-800 border border-amber-300"
  const ok = "bg-emerald-50 text-emerald-700 border border-emerald-300"
  const barMau = "bg-destructive"
  const barAlerta = "bg-amber-500"
  const barOk = "bg-emerald-600"

  const isBad =
    escala === "alto-mau"
      ? banda === "Muito Alto" || banda === "Alto"
      : banda === "Maturidade Baixa" || banda === "Maturidade Média"
  const isMid =
    escala === "alto-mau"
      ? banda === "Médio"
      : banda === "Maturidade Alta"
  if (isBad) return { badge: mau, bar: barMau }
  if (isMid) return { badge: alerta, bar: barAlerta }
  return { badge: ok, bar: barOk }
}

function PrioridadeBadge({
  prioridade,
}: {
  prioridade: "P1" | "P2" | "P3" | "P4"
}) {
  const cls =
    prioridade === "P1"
      ? "bg-destructive/10 text-destructive border-destructive/40"
      : prioridade === "P2"
        ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300"
        : prioridade === "P3"
          ? "bg-muted text-muted-foreground border-border"
          : "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400"
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${cls}`}
    >
      {prioridade}
    </span>
  )
}

function MatrizCriticidade({ matriz }: { matriz: AgregadoMatrizCelula[] }) {
  // Render 4 probabilidades (1..4) na vertical (4 em cima), 3 impactos (2,3,4) na horizontal
  const probs: Array<1 | 2 | 3 | 4> = [4, 3, 2, 1]
  const impactos: Array<2 | 3 | 4> = [2, 3, 4]
  return (
    <div className="flex">
      <div className="w-12 flex flex-col justify-between py-8 pr-4">
        <div className="origin-center -rotate-90 whitespace-nowrap text-[11px] font-semibold uppercase tracking-wider text-muted-foreground translate-y-12">
          PROBABILIDADE
        </div>
      </div>
      <div className="flex-1">
        <div className="grid grid-cols-3 gap-1 border-l-2 border-b-2 border-border pb-1 pl-1">
          {probs.flatMap((p) =>
            impactos.map((i) => {
              const cell = matriz.find((c) => c.prob === p && c.impacto === i)
              const n = cell?.n ?? 0
              const score = p * i
              const cellColor = matrizCellColor(score)
              return (
                <div
                  key={`p${p}-i${i}`}
                  className={`h-20 ${cellColor} rounded flex items-center justify-center font-bold text-foreground tabular-nums`}
                  title={`Prob ${p} x Impacto ${i} (criticidade ${score}): ${n} dimensão(ões)`}
                >
                  {n}
                </div>
              )
            })
          )}
        </div>
        <div className="flex justify-between mt-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span>I = 2</span>
          <span>I = 3</span>
          <span>I = 4</span>
        </div>
        <div className="text-center mt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          IMPACTO
        </div>
      </div>
    </div>
  )
}

function matrizCellColor(score: number): string {
  // criticidade = prob * impacto, varia 2..16. P1>=12 P2>=8 P3>=4 senão P4.
  if (score >= 12) return "bg-red-700/80 text-white"
  if (score >= 8) return "bg-red-400/70"
  if (score >= 4) return "bg-amber-300/60"
  return "bg-amber-100"
}
