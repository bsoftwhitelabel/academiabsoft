import Link from "next/link";
import {
  Heart,
  Brain,
  Users,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { HeroSection } from "@/components/catalog/hero-section";
import { CorporateCta } from "@/components/catalog/corporate-cta";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import {
  WORKSHOP_BLOCKS,
  WORKSHOP_TOTALS,
  WORKSHOP_PROGRAMMES,
  type WorkshopBlock,
} from "@/lib/workshops-data";

export const metadata = {
  title: "Workshops de Saúde Mental, Bem-Estar e Performance",
  description:
    "9 blocos · 40 workshops de 1h cada · alinhados com NR1 e regulamentação europeia. Para empresas que querem reduzir burnout, cumprir compliance e construir cultura de cuidado real.",
};

type Props = { params: { tenantSlug: string } };

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _typecheck(_p: Props) {}

const PILLARS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Brain,
    title: "Saúde Mental",
    description: "Reconhecer sinais de sofrimento e dar resposta de primeira linha.",
  },
  {
    icon: Heart,
    title: "Bem-Estar",
    description: "Hábitos sustentáveis que reduzem absentismo e burnout.",
  },
  {
    icon: Users,
    title: "Equipas",
    description: "Comunicação emocional, escuta ativa e relações de pertença.",
  },
];

const ACCENT_RING: Record<WorkshopBlock["accent"], string> = {
  navy: "ring-navy/20 bg-navy/8 text-navy",
  gold: "ring-gold/30 bg-gold/10 text-gold-700",
  emerald: "ring-emerald-200 bg-emerald-50 text-emerald-700",
  blue: "ring-blue-200 bg-blue-50 text-blue-700",
  purple: "ring-purple-200 bg-purple-50 text-purple-700",
  rose: "ring-rose-200 bg-rose-50 text-rose-700",
  amber: "ring-amber-200 bg-amber-50 text-amber-700",
};

export default function WorkshopsPage({ params: _params }: Props) {
  return (
    <>
      <HeroSection
        badge="Programa NR1 · Saúde Ocupacional"
        title="Workshops de Saúde Mental, Bem-Estar e Performance"
        subtitle={`${WORKSHOP_TOTALS.blocks} blocos temáticos · ${WORKSHOP_TOTALS.workshops} workshops de 1 hora · construídos para equipas que querem reduzir burnout, cumprir NR1 e construir cultura de cuidado real.`}
        primaryCta={{ label: "Ver curriculum", href: "#curriculum" }}
        secondaryCta={{ label: "Pedir proposta empresa", href: "#programmes" }}
      />

      {/* 3 pillars + key metrics */}
      <section className="border-b border-border bg-surface-low/40">
        <div className="mx-auto max-w-container px-4 py-12 md:px-8 md:py-16">
          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-card-elevated"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gold-50 text-gold-700">
                  <p.icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy">{p.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                    {p.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Blocos temáticos" value={String(WORKSHOP_TOTALS.blocks)} />
            <Stat label="Workshops" value={String(WORKSHOP_TOTALS.workshops)} />
            <Stat label="Duração unitária" value="1h" />
            <Stat label="Combinações possíveis" value="∞" />
          </div>
        </div>
      </section>

      {/* curriculum overview — 9 blocks */}
      <section
        id="curriculum"
        className="mx-auto max-w-container px-4 py-12 md:px-8 md:py-20"
      >
        <header className="mb-10 max-w-2xl">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-700 ring-1 ring-gold/20">
            <Sparkles className="h-3 w-3" strokeWidth={2.75} />
            Curriculum modular
          </span>
          <h2 className="text-balance text-3xl font-bold leading-tight text-navy md:text-4xl">
            9 blocos · 40 workshops · combine como precisar
          </h2>
          <p className="mt-3 text-base leading-relaxed text-ink-muted">
            Cada workshop é uma unidade autónoma de 1 hora, facilitado por
            especialistas certificados em saúde ocupacional. Pode escolher um
            bloco completo, mix-and-match por área, ou adotar o programa
            integrado de 6 meses.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {WORKSHOP_BLOCKS.map((block) => (
            <BlockCard key={block.slug} block={block} />
          ))}
        </div>
      </section>

      {/* detailed list per block */}
      <section className="border-y border-border bg-surface-low/30">
        <div className="mx-auto max-w-container px-4 py-12 md:px-8 md:py-20">
          <header className="mb-10 max-w-2xl">
            <h2 className="text-balance text-3xl font-bold leading-tight text-navy md:text-4xl">
              Lista completa de workshops
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-muted">
              Os {WORKSHOP_TOTALS.workshops} workshops detalhados por bloco. Cada um
              tem objetivo prático, formato de entrega e pode ser combinado com
              outros do mesmo bloco ou de blocos diferentes.
            </p>
          </header>

          <div className="space-y-12">
            {WORKSHOP_BLOCKS.map((block) => (
              <BlockDetailRow key={block.slug} block={block} />
            ))}
          </div>
        </div>
      </section>

      {/* 3 programmes */}
      <section id="programmes" className="mx-auto max-w-container px-4 py-12 md:px-8 md:py-20">
        <header className="mb-10 text-center">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-navy/8 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-navy">
            <ShieldCheck className="h-3 w-3" strokeWidth={2.75} />
            3 formatos · sob medida para a sua organização
          </span>
          <h2 className="text-balance text-3xl font-bold leading-tight text-navy md:text-4xl">
            Pacotes pré-configurados
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-ink-muted">
            Use estes formatos como ponto de partida. Cada empresa tem o seu
            ritmo — ajustamos a profundidade, o calendário e a entrega.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {WORKSHOP_PROGRAMMES.map((p) => (
            <ProgrammeCard key={p.name} {...p} />
          ))}
        </div>
      </section>

      <CorporateCta />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <p className="text-2xl font-bold tabular-nums text-navy md:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
        {label}
      </p>
    </div>
  );
}

function BlockCard({ block }: { block: WorkshopBlock }) {
  const Icon = block.icon;
  return (
    <Link
      href={`#block-${block.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-lg ring-1",
            ACCENT_RING[block.accent]
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
          Bloco {String(block.number).padStart(2, "0")}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-bold leading-tight text-navy">
        {block.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">
        {block.description}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
        <span className="font-bold text-navy">
          {block.workshops.length} workshops · {block.workshops.length}h
        </span>
        <span className="inline-flex items-center gap-1 text-blue-600 transition-transform group-hover:translate-x-0.5">
          Ver detalhe
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

function BlockDetailRow({ block }: { block: WorkshopBlock }) {
  const Icon = block.icon;
  return (
    <article id={`block-${block.slug}`} className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
      <header>
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1",
              ACCENT_RING[block.accent]
            )}
          >
            <Icon className="h-6 w-6" strokeWidth={2} />
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
              Bloco {String(block.number).padStart(2, "0")} · {block.workshops.length} workshops
            </p>
            <h3 className="mt-1 text-xl font-bold leading-tight text-navy">
              {block.title}
            </h3>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {block.description}
        </p>
      </header>

      <ul className="space-y-2">
        {block.workshops.map((w) => (
          <li
            key={w.code}
            className="flex flex-wrap items-start gap-3 rounded-xl border border-border bg-card p-4"
          >
            <span className="mt-0.5 rounded-md bg-surface-low px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-ink-muted">
              {w.code}
            </span>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold leading-snug text-navy">
                {w.title}
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {w.objective}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                w.format === "Presencial"
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
                  : w.format === "Online"
                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200/50"
                  : "bg-gold-50 text-gold-700 ring-1 ring-gold-200/50"
              )}
            >
              {w.format}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function ProgrammeCard({
  name,
  description,
  investmentPerPerson,
  durationLabel,
  bestFor,
  blocks,
  isFeatured,
}: {
  name: string;
  description: string;
  investmentPerPerson: number;
  durationLabel: string;
  bestFor: string;
  blocks: number;
  isFeatured?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5",
        isFeatured
          ? "border-gold ring-2 ring-gold/20 shadow-card-hover"
          : "border-border shadow-card-elevated"
      )}
    >
      {isFeatured && (
        <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-md bg-gold px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-navy">
          <Sparkles className="h-3 w-3" strokeWidth={2.75} />
          Mais escolhido
        </div>
      )}
      <h3 className="text-lg font-bold text-navy">{name}</h3>
      <p className="mt-1 text-sm text-ink-muted">{description}</p>

      <div className="my-5 border-y border-border py-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
          A partir de
        </p>
        <p className="mt-1 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tabular-nums text-navy">
            {formatCurrency(investmentPerPerson)}
          </span>
          <span className="text-xs text-ink-muted">/ pessoa</span>
        </p>
        <p className="mt-1 text-[11px] text-ink-subtle">
          {durationLabel} · {blocks} workshops · sem IVA
        </p>
      </div>

      <ul className="mb-5 space-y-2 text-sm text-ink-muted">
        <Bullet>Dossier técnico-pedagógico DGERT incluído</Bullet>
        <Bullet>Formadores certificados (CCP)</Bullet>
        <Bullet>Logo do cliente nos documentos</Bullet>
        <Bullet>Relatório executivo pós-programa</Bullet>
      </ul>

      <p className="mb-5 rounded-lg bg-surface-low/60 p-3 text-[11px] leading-relaxed text-ink-muted">
        <strong className="text-navy">Indicado para:</strong> {bestFor}
      </p>

      <Button
        asChild
        className={cn(
          "mt-auto h-11 w-full font-bold",
          isFeatured
            ? "bg-navy text-white hover:bg-navy/90"
            : "border border-border bg-card text-navy hover:bg-surface-low"
        )}
      >
        <a href="#contact">
          Solicitar proposta
          <ArrowRight className="h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2.5} />
      <span className="text-xs leading-relaxed">{children}</span>
    </li>
  );
}
