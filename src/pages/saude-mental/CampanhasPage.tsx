import { Link, useNavigate } from "react-router-dom"
import {
  Plus,
  Search,
  FilterX,
  Eye,
  FileText,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useCampaigns, type PsyCampaignRow } from "./useCampaigns"

const COMPRIMENTO_LABEL: Record<PsyCampaignRow["comprimento"], string> = {
  curto: "CURTO",
  medio: "MÉDIO",
  longo: "LONGO",
}

const ESTADO_LABEL: Record<PsyCampaignRow["estado"], string> = {
  rascunho: "Rascunho",
  em_curso: "Em curso",
  encerrada: "Encerrada",
}

/**
 * Lista de campanhas psicossociais do tenant.
 * Transcrição de referencias/Modulo A/campanhas_de_avalia_o_psicossocial_listagem/code.html.
 */
export function CampanhasPage() {
  const q = useCampaigns()
  const campaigns = q.data?.campaigns ?? []

  return (
    <main className="p-8 max-w-[1440px] w-full mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Campanhas de Avaliação Psicossocial
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestão e monitorização de avaliações de riscos psicossociais
          </p>
        </div>
        <Link
          to="/admin/saude-mental/campanhas/nova"
          className="bg-primary text-primary-foreground h-10 px-6 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-all"
        >
          <Plus className="h-5 w-5" />
          Nova Campanha
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-lg p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative group">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground" />
            <input
              type="text"
              placeholder="Pesquisar empresa"
              className="w-full h-10 pl-10 pr-2 bg-transparent border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        </div>
        <div className="w-44">
          <select className="w-full h-10 px-2 bg-transparent border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer">
            <option value="">Estado</option>
            <option value="rascunho">Rascunho</option>
            <option value="em_curso">Em curso</option>
            <option value="encerrada">Encerrada</option>
          </select>
        </div>
        <div className="w-44">
          <select className="w-full h-10 px-2 bg-transparent border border-border rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer">
            <option value="">Período</option>
            <option>Últimos 30 dias</option>
            <option>Trimestre actual</option>
          </select>
        </div>
        <button
          type="button"
          className="text-muted-foreground text-sm font-medium px-4 hover:text-foreground transition-colors flex items-center gap-1"
        >
          <FilterX className="h-[18px] w-[18px]" />
          Limpar
        </button>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Empresa
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
                  Instrumento
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Período
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Estado
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Adesão
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">
                  Respostas
                </th>
                <th className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">
                  Acções
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {q.isPending ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-muted-foreground"
                  >
                    A carregar…
                  </td>
                </tr>
              ) : null}
              {q.isError ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-sm text-destructive"
                  >
                    Erro a carregar campanhas: {(q.error as Error).message}
                  </td>
                </tr>
              ) : null}
              {!q.isPending && campaigns.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-sm text-muted-foreground"
                  >
                    Sem campanhas. Cria a primeira em "Nova Campanha".
                  </td>
                </tr>
              ) : null}
              {campaigns.map((c) => (
                <CampaignRow key={c.id} c={c} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className="px-6 py-4 border-t border-border bg-muted/40 flex justify-between items-center">
          <span className="text-[13px] text-muted-foreground">
            A mostrar {campaigns.length} de {campaigns.length} campanhas
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              className="h-8 w-8 flex items-center justify-center rounded border border-border text-muted-foreground hover:bg-card transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              className="h-8 w-8 flex items-center justify-center rounded bg-primary text-primary-foreground text-[13px] font-bold"
            >
              1
            </button>
            <button
              type="button"
              disabled
              className="h-8 w-8 flex items-center justify-center rounded border border-border text-muted-foreground hover:bg-card transition-colors disabled:opacity-40"
            >
              <ChevronRight className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

function CampaignRow({ c }: { c: PsyCampaignRow }) {
  const navigate = useNavigate()
  const adesaoPct = c.esperados > 0 ? Math.round((c.respostas / c.esperados) * 100) : 0
  const periodo =
    c.inicio && c.fim
      ? `${formatDate(c.inicio)} a ${formatDate(c.fim)}`
      : c.inicio
        ? `desde ${formatDate(c.inicio)}`
        : "sem datas"

  const isClosed = c.estado === "encerrada"
  const isDraft = c.estado === "rascunho"

  return (
    <tr className="hover:bg-muted/30 transition-colors h-12">
      <td className="px-6 py-2 text-[13px] font-medium text-foreground">
        {c.clientOrgName}
      </td>
      <td className="px-6 py-2 text-center">
        <span className="inline-flex items-center px-2 py-0.5 border border-border text-muted-foreground bg-muted rounded-full text-[10px] font-bold tracking-wider">
          {COMPRIMENTO_LABEL[c.comprimento]}
        </span>
      </td>
      <td className="px-6 py-2 text-[13px] tabular-nums text-muted-foreground">
        {periodo}
      </td>
      <td className="px-6 py-2">
        <EstadoBadge estado={c.estado} />
      </td>
      <td className="px-6 py-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden min-w-[60px]">
            <div
              className={
                isClosed
                  ? "h-full bg-emerald-600"
                  : isDraft
                    ? "h-full bg-muted-foreground/40"
                    : "h-full bg-primary"
              }
              style={{ width: `${Math.min(100, adesaoPct)}%` }}
            />
          </div>
          <span
            className={
              "text-[13px] tabular-nums font-semibold " +
              (isClosed
                ? "text-emerald-700 dark:text-emerald-400"
                : isDraft
                  ? "text-muted-foreground"
                  : "text-foreground")
            }
          >
            {adesaoPct}%
          </span>
        </div>
      </td>
      <td className="px-6 py-2 text-[13px] tabular-nums text-right text-foreground">
        {c.respostas}
      </td>
      <td className="px-6 py-2 text-right">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={() => navigate(`/admin/saude-mental/campanhas/${c.id}`)}
            className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-all"
            aria-label={`Abrir campanha ${c.clientOrgName}`}
            title="Abrir campanha"
          >
            <Eye className="h-[18px] w-[18px]" />
          </button>
          {isDraft ? (
            <>
              <button
                type="button"
                disabled
                aria-label="Editar (em desenvolvimento)"
                title="Edição em desenvolvimento"
                className="p-1 text-muted-foreground/40 rounded cursor-not-allowed"
              >
                <Pencil className="h-[18px] w-[18px]" />
              </button>
              <button
                type="button"
                disabled
                aria-label="Eliminar (em desenvolvimento)"
                title="Eliminação em desenvolvimento"
                className="p-1 text-muted-foreground/40 rounded cursor-not-allowed"
              >
                <Trash2 className="h-[18px] w-[18px]" />
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled
              aria-label="Relatório PDF (em desenvolvimento)"
              title="Exportação PDF em desenvolvimento"
              className="p-1 text-muted-foreground/40 rounded cursor-not-allowed"
            >
              <FileText className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

function EstadoBadge({ estado }: { estado: PsyCampaignRow["estado"] }) {
  const dotClass =
    estado === "encerrada"
      ? "bg-emerald-600"
      : estado === "em_curso"
        ? "bg-primary"
        : "bg-muted-foreground/60"
  const textClass =
    estado === "encerrada"
      ? "text-emerald-700 dark:text-emerald-400"
      : estado === "em_curso"
        ? "text-foreground"
        : "text-muted-foreground"
  return (
    <div
      className={`flex items-center gap-1 text-[11px] font-semibold uppercase ${textClass}`}
    >
      <span className={`w-2 h-2 rounded-full ${dotClass}`} />
      {ESTADO_LABEL[estado]}
    </div>
  )
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  } catch {
    return iso
  }
}
