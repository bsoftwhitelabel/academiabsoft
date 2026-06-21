import { useMemo } from "react"
import {
  AlertTriangle,
  Layers,
  Settings as SettingsIcon,
  Info,
  Save,
} from "lucide-react"
import { toast } from "sonner"
import { labelPsyGroup } from "@/lib/psy/labels"
import { useInstrument } from "./useInstrument"

/**
 * Configuração do Instrumento.
 *
 * Transcrição do mock referencias/Modulo A/configura_o_do_instrumento_governa_o_do_motor/code.html
 * com adaptações: ícones lucide, cores via tokens do projecto, dados reais do
 * tenant via GET /api/psy/instrument. Edição inline desactivada nesta fase.
 */
export function InstrumentoPage() {
  const q = useInstrument()

  const thresholds = useMemo(() => {
    const map = {
      classificacao: { favoravel_ate: 0, atencao_ate: 0, risco_ate: 0 },
      igrp: { z1: 0, z2: 0, z3: 0 },
      criticidade: { p3_min: 0, p2_min: 0, p1_min: 0 },
    }
    for (const t of q.data?.thresholds ?? []) {
      const slot = map[t.tipo as keyof typeof map] as Record<string, number>
      if (slot && t.chave in slot) slot[t.chave] = t.valor
    }
    return map
  }, [q.data])

  if (q.isPending) {
    return (
      <div className="p-8 text-sm text-muted-foreground">A carregar…</div>
    )
  }
  if (q.isError) {
    return (
      <div className="p-8 text-sm text-destructive">
        Erro a carregar instrumento: {(q.error as Error).message}
      </div>
    )
  }
  const inst = q.data!.instrument
  const dims = q.data!.dimensions
  const versionShort = inst.versao

  return (
    <main className="p-8 flex flex-col gap-8">
      {/* Warning Banner */}
      <section>
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 px-6 py-3 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong>Instrumento {inst.etiquetaValidacao}.</strong> Cortes,
            pesos e impactos são provisórios, definidos por especialista, ainda
            não validados clinicamente. Editáveis sem necessidade de nova
            publicação de código.
          </p>
        </div>
      </section>

      {/* Configuration Header */}
      <div className="flex items-end justify-between">
        <div>
          <nav className="flex gap-2 text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">
            <span>Saúde Mental</span>
            <span>/</span>
            <span className="text-foreground">Configuração do Instrumento</span>
          </nav>
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            Configuração do Instrumento
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled
            aria-label="Reverter alterações (em desenvolvimento)"
            title="Edição inline em desenvolvimento"
            className="px-4 py-2 border border-border rounded-lg text-sm font-medium opacity-50 cursor-not-allowed"
          >
            Reverter Alterações
          </button>
          <button
            type="button"
            disabled
            aria-label="Publicar alterações (em desenvolvimento)"
            title="Publicação de versões em desenvolvimento"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed"
          >
            Publicar Alterações
          </button>
        </div>
      </div>

      {/* Global Cuts (Bento Grid Style) */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="h-4 w-4 text-foreground" />
          <h3 className="text-lg font-semibold text-foreground">
            Cortes Globais
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Classificação */}
          <div className="bg-card border border-border p-6 rounded-xl">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-6">
              CORTES DE CLASSIFICAÇÃO
            </p>
            <div className="space-y-4">
              <ThresholdRow
                label="Percentil Baixo"
                value={thresholds.classificacao.favoravel_ate}
              />
              <ThresholdRow
                label="Percentil Médio"
                value={thresholds.classificacao.atencao_ate}
              />
              <ThresholdRow
                label="Percentil Elevado"
                value={thresholds.classificacao.risco_ate}
              />
            </div>
          </div>
          {/* IGRP Bands */}
          <div className="bg-card border border-border p-6 rounded-xl">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-6">
              BANDAS DO IGRP
            </p>
            <div className="space-y-4">
              <ThresholdRow label="Mínimo (Z1)" value={thresholds.igrp.z1} />
              <ThresholdRow label="Moderado (Z2)" value={thresholds.igrp.z2} />
              <ThresholdRow label="Crítico (Z3)" value={thresholds.igrp.z3} />
            </div>
          </div>
          {/* Criticality */}
          <div className="bg-card border border-border p-6 rounded-xl">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-6">
              CORTES DE CRITICIDADE
            </p>
            <div className="space-y-4">
              <ThresholdRow
                label="Threshold Alerta"
                value={thresholds.criticidade.p3_min}
              />
              <ThresholdRow
                label="Threshold Risco"
                value={thresholds.criticidade.p2_min}
              />
              <ThresholdRow
                label="Threshold Grave"
                value={thresholds.criticidade.p1_min}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Dimensions Table */}
      <section className="flex-1 min-h-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-foreground" />
            <h3 className="text-lg font-semibold text-foreground">
              Tabela de Dimensões
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled
              aria-label="Exportar configuração (em desenvolvimento)"
              title="Exportação em desenvolvimento"
              className="text-xs font-semibold px-3 py-1.5 border border-border rounded-lg opacity-50 cursor-not-allowed"
            >
              Exportar Configuração
            </button>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Dimensão
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Bloco
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Grupo
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-32">
                    Impacto (Peso)
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-center">
                    N.º Perguntas
                  </th>
                </tr>
              </thead>
              <tbody className="text-[13px] divide-y divide-border">
                {dims.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-muted/50 transition-colors group"
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {d.nome}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.bloco ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground uppercase">
                        {labelPsyGroup(d.grupo).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {d.tipo === "Risco" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border border-destructive bg-destructive/10 text-destructive">
                          RISCO
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                          PROTETIVA
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={2}
                          max={4}
                          defaultValue={d.impacto}
                          disabled
                          className="w-12 h-7 text-center tabular-nums text-xs font-bold bg-muted border border-border rounded disabled:opacity-70"
                        />
                        <span className="text-[10px] text-muted-foreground">
                          (2–4)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums font-medium">
                      {d.questionCount}
                    </td>
                  </tr>
                ))}
                {dims.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-muted-foreground"
                    >
                      Sem dimensões configuradas.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-4 flex items-center justify-between py-4 border-t border-border">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            Versão do Instrumento: {versionShort}
          </span>
        </div>
        <div className="flex gap-4 items-center">
          <p className="text-[10px] text-muted-foreground font-medium">
            Estado: {inst.estado}
          </p>
          <button
            type="button"
            disabled
            className="bg-primary text-primary-foreground font-semibold px-6 py-2 rounded-lg text-sm hover:opacity-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Em desenvolvimento"
          >
            <Save className="h-4 w-4" />
            Guardar como nova versão
          </button>
        </div>
      </footer>
    </main>
  )
}

function ThresholdRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        type="number"
        value={value}
        disabled
        className="w-16 h-8 text-center tabular-nums text-sm font-semibold bg-muted border border-border rounded-lg disabled:opacity-80"
      />
    </div>
  )
}
