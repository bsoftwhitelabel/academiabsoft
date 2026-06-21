import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ChevronLeft } from "lucide-react"
import { useCampaigns } from "./useCampaigns"
import { DistribuirTab } from "./tabs/DistribuirTab"
import { AcompanhamentoTab } from "./tabs/AcompanhamentoTab"
import { ResultadosTab } from "./tabs/ResultadosTab"
import { DiagnosticoTab } from "./tabs/DiagnosticoTab"

type TabKey = "distribuir" | "acompanhamento" | "resultados" | "diagnostico"

const TABS: { key: TabKey; label: string }[] = [
  { key: "distribuir", label: "Distribuir" },
  { key: "acompanhamento", label: "Acompanhamento" },
  { key: "resultados", label: "Resultados" },
  { key: "diagnostico", label: "Diagnóstico" },
]

export function CampanhaDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const campaignId = id ?? ""
  const [tab, setTab] = useState<TabKey>("distribuir")

  // Header mostra o nome do cliente; reaproveita a lista (já em cache).
  const campaignsQ = useCampaigns()
  const camp = (campaignsQ.data?.campaigns ?? []).find((c) => c.id === campaignId)

  return (
    <main className="p-8 max-w-[1440px] w-full mx-auto space-y-6">
      {/* Breadcrumb + título */}
      <div className="flex flex-col gap-1">
        <Link
          to="/admin/saude-mental/campanhas"
          className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground w-fit"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Campanhas
        </Link>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {camp?.clientOrgName ?? "Campanha"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Avaliação Psicossocial - {comprimentoLabel(camp?.comprimento)}
              {camp?.estado ? ` - ${estadoLabel(camp.estado)}` : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((t) => {
            const active = tab === t.key
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors " +
                  (active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border")
                }
              >
                {t.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Conteúdo */}
      <div>
        {tab === "distribuir" && <DistribuirTab campaignId={campaignId} />}
        {tab === "acompanhamento" && (
          <AcompanhamentoTab campaignId={campaignId} />
        )}
        {tab === "resultados" && <ResultadosTab campaignId={campaignId} />}
        {tab === "diagnostico" && <DiagnosticoTab campaignId={campaignId} />}
      </div>
    </main>
  )
}

function comprimentoLabel(c: string | undefined): string {
  if (c === "curto") return "comprimento curto"
  if (c === "medio") return "comprimento médio"
  if (c === "longo") return "comprimento longo"
  return ""
}
function estadoLabel(e: string): string {
  if (e === "rascunho") return "Rascunho"
  if (e === "em_curso") return "Em curso"
  if (e === "encerrada") return "Encerrada"
  return e
}
