import { useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  ChevronRight,
  Settings as SettingsIcon,
  Ruler,
  Users,
  Plus,
  Trash2,
  ShieldCheck,
  Rocket,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { useClientOrgs } from "@/hooks/useLookups"
import { useInstrument } from "./useInstrument"
import { useCreateCampaign } from "./useCreateCampaign"

const COMPRIMENTOS = [
  { value: "curto" as const, label: "CURTO", desc: "instrumento reduzido" },
  { value: "medio" as const, label: "MÉDIO", desc: "instrumento intermédio" },
  { value: "longo" as const, label: "LONGO", desc: "instrumento completo" },
]

const formSchema = z.object({
  clientOrgId: z.string().min(1, "Empresa cliente obrigatória"),
  inicio: z.string().optional(),
  fim: z.string().optional(),
  metaAmostragemPct: z.number().int().min(0).max(100),
  comprimento: z.enum(["curto", "medio", "longo"]),
  areas: z
    .array(
      z.object({
        area: z.string().min(1, "Nome de área obrigatório"),
        esperados: z.number().int().min(0).max(10000),
      })
    )
    .min(1, "Adiciona pelo menos uma área"),
})
type FormValues = z.infer<typeof formSchema>

/**
 * Nova Campanha. Transcrição do mock
 * referencias/Modulo A/nova_campanha_configura_o/code.html.
 */
export function NovaCampanhaPage() {
  const navigate = useNavigate()
  const orgs = useClientOrgs()
  const instr = useInstrument()
  const create = useCreateCampaign()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientOrgId: "",
      inicio: "",
      fim: "",
      metaAmostragemPct: 80,
      comprimento: "medio",
      areas: [
        { area: "Produção", esperados: 60 },
        { area: "Administrativo", esperados: 25 },
        { area: "Logística", esperados: 18 },
      ],
    },
  })
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "areas",
  })

  const watched = form.watch()
  const totalEsperado = useMemo(
    () =>
      (watched.areas ?? []).reduce(
        (s, a) => s + (Number.isFinite(Number(a.esperados)) ? Number(a.esperados) : 0),
        0
      ),
    [watched.areas]
  )
  const metaMin = useMemo(
    () => Math.ceil(totalEsperado * ((watched.metaAmostragemPct ?? 0) / 100)),
    [totalEsperado, watched.metaAmostragemPct]
  )

  async function onSubmit(values: FormValues) {
    try {
      const r = await create.mutateAsync({
        clientOrgId: values.clientOrgId,
        comprimento: values.comprimento,
        inicio: values.inicio || null,
        fim: values.fim || null,
        metaAmostragemPct: values.metaAmostragemPct,
        areas: values.areas.map((a) => ({
          area: a.area,
          esperados: Number(a.esperados),
        })),
      })
      toast.success("Campanha criada")
      navigate(`/admin/saude-mental/campanhas`, { replace: true })
      return r
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro a criar campanha")
    }
  }

  const versaoInstrumento = instr.data?.instrument?.versao ?? "-"
  const etiqueta = instr.data?.instrument?.etiquetaValidacao ?? ""

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="p-8 max-w-[1440px] mx-auto"
    >
      {/* Header */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <nav className="flex gap-1 items-center text-muted-foreground mb-1">
            <Link
              to="/admin/saude-mental/campanhas"
              className="text-[11px] font-semibold uppercase tracking-wider hover:text-foreground"
            >
              Campanhas
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
              Nova Campanha
            </span>
          </nav>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Nova Campanha
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure o instrumento e a população alvo
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground italic">
            Instrumento {etiqueta || "(sem etiqueta)"}
          </span>
          <div className="w-2 h-2 rounded-full bg-muted-foreground/60" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* Configurações Gerais */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-1 text-foreground">
              <SettingsIcon className="h-4 w-4" /> Configurações Gerais
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Empresa Cliente
                </label>
                <Controller
                  control={form.control}
                  name="clientOrgId"
                  render={({ field }) => (
                    <select
                      {...field}
                      className="w-full h-10 px-2 rounded-lg border border-border bg-transparent text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Seleccione a empresa…</option>
                      {(orgs.data ?? []).map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {form.formState.errors.clientOrgId ? (
                  <p className="text-xs text-destructive mt-1">
                    {form.formState.errors.clientOrgId.message}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Início do Período
                </label>
                <input
                  type="date"
                  {...form.register("inicio")}
                  className="w-full h-10 px-2 rounded-lg border border-border bg-transparent text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Fim do Período
                </label>
                <input
                  type="date"
                  {...form.register("fim")}
                  className="w-full h-10 px-2 rounded-lg border border-border bg-transparent text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                  Meta de Amostragem (%)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    {...form.register("metaAmostragemPct", {
                      valueAsNumber: true,
                    })}
                    className="flex-1 accent-primary"
                  />
                  <div className="w-20 tabular-nums text-right text-sm font-semibold text-foreground">
                    {watched.metaAmostragemPct ?? 0}%
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Comprimento */}
          <section className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-1 text-foreground">
              <Ruler className="h-4 w-4" /> Comprimento do Instrumento
            </h3>
            <Controller
              control={form.control}
              name="comprimento"
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-4">
                  {COMPRIMENTOS.map((c) => {
                    const active = field.value === c.value
                    return (
                      <button
                        type="button"
                        key={c.value}
                        onClick={() => field.onChange(c.value)}
                        className={
                          "group cursor-pointer rounded-lg p-4 transition-all flex flex-col gap-2 text-left " +
                          (active
                            ? "border-2 border-primary bg-muted/40"
                            : "border border-border bg-card hover:border-primary/50")
                        }
                      >
                        <div className="flex justify-between items-start">
                          <span
                            className={
                              "text-[11px] font-semibold uppercase tracking-wider " +
                              (active ? "text-primary" : "text-muted-foreground")
                            }
                          >
                            {c.label}
                          </span>
                          <CheckCircle2
                            className={
                              "h-4 w-4 " +
                              (active
                                ? "text-primary fill-primary/20"
                                : "text-muted-foreground/40")
                            }
                          />
                        </div>
                        <div className="text-lg font-semibold text-foreground">
                          {c.desc}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            />
          </section>

          {/* População Alvo */}
          <section className="bg-card border border-border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-1 text-foreground">
                <Users className="h-4 w-4" /> População Alvo
              </h3>
              <button
                type="button"
                onClick={() => append({ area: "", esperados: 0 })}
                className="flex items-center gap-1 text-primary text-[11px] font-semibold uppercase hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> Adicionar Área
              </button>
            </div>
            <div className="overflow-hidden border border-border rounded-lg">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Área
                    </th>
                    <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">
                      N.º Esperado
                    </th>
                    <th className="px-4 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fields.map((f, i) => (
                    <tr key={f.id}>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          {...form.register(`areas.${i}.area` as const)}
                          className="w-full bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-sm"
                          placeholder="Nome da área"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input
                          type="number"
                          min={0}
                          {...form.register(`areas.${i}.esperados` as const, {
                            valueAsNumber: true,
                          })}
                          className="w-24 bg-transparent border border-transparent hover:border-border focus:border-primary rounded px-2 py-1 text-sm text-right tabular-nums"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => remove(i)}
                          className="text-muted-foreground hover:text-destructive"
                          title="Remover"
                        >
                          <Trash2 className="h-[18px] w-[18px]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {fields.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-4 text-center text-sm text-muted-foreground"
                      >
                        Sem áreas. Adiciona pelo menos uma.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            {form.formState.errors.areas ? (
              <p className="text-xs text-destructive mt-2">
                {form.formState.errors.areas.message ??
                  "Verifica as áreas configuradas."}
              </p>
            ) : null}
          </section>
        </div>

        {/* Sidebar Info Column */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Anonymity Banner */}
          <div className="bg-primary text-primary-foreground rounded-lg p-6 flex flex-col gap-4 relative overflow-hidden">
            <ShieldCheck className="absolute -right-2 -top-2 h-32 w-32 opacity-10" />
            <div className="flex items-center gap-2 relative z-10">
              <ShieldCheck className="h-5 w-5" />
              <h4 className="text-lg font-semibold">Garantia de Anonimato</h4>
            </div>
            <p className="text-sm leading-relaxed relative z-10 opacity-90">
              As respostas são anónimas e agregadas. Resultados por área só são
              mostrados acima de 5 respondentes. Nenhum endereço ou
              identificador é associado às respostas.
            </p>
            <div className="p-2 bg-white/5 rounded border border-white/10 text-[11px] uppercase tracking-wider font-bold relative z-10 opacity-90">
              Padrão RGPD e ética organizacional
            </div>
          </div>

          {/* Preview */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Resumo da Campanha
            </h4>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">
                  Amostra Total
                </span>
                <span className="text-lg font-semibold tabular-nums text-foreground">
                  {totalEsperado} colaboradores
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">
                  Instrumento
                </span>
                <span className="text-lg font-semibold text-foreground">
                  {versaoInstrumento}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">
                  Meta Mínima
                </span>
                <span className="text-lg font-semibold tabular-nums text-foreground">
                  {metaMin} respostas
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer Actions */}
      <footer className="mt-10 flex justify-end items-center gap-4 py-6 border-t border-border">
        <Link
          to="/admin/saude-mental/campanhas"
          className="px-6 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-sm font-semibold"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={create.isPending}
          className="px-10 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-colors text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
        >
          {create.isPending ? "A criar…" : "Lançar campanha"}
          <Rocket className="h-[18px] w-[18px]" />
        </button>
      </footer>
    </form>
  )
}
