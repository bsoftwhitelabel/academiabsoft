import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Clock,
  Users,
  Monitor,
  Layers,
  BadgeCheck,
  Award,
  ArrowLeft,
  CalendarDays,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CourseCard } from "@/components/catalog/course-card";
import { getCourseBySlug, getCourses } from "@/lib/mock-data";
import { formatCurrency, cn } from "@/lib/utils";

export const dynamicParams = true;

type Props = {
  params: { tenantSlug: string; courseSlug: string };
};

export function generateMetadata({ params }: Props) {
  const course = getCourseBySlug(params.courseSlug);
  return {
    title: course?.name ?? "Curso",
    description: course?.marketingDescription,
  };
}

export default function CourseDetailPage({ params }: Props) {
  const course = getCourseBySlug(params.courseSlug);
  if (!course) notFound();

  const related = getCourses({ area: course.areaSlug })
    .filter((c) => c.id !== course.id)
    .slice(0, 3);

  const modalityIcon = {
    PRESENCIAL: Users,
    ELEARNING: Monitor,
    BLENDED: Layers,
  } as const;

  const modalityLabel = {
    PRESENCIAL: "Presencial",
    ELEARNING: "E-learning",
    BLENDED: "Híbrido",
  } as const;

  const ModIcon = modalityIcon[course.modality];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-container px-4 py-6 md:px-8 md:py-8">
        <Link
          href={`/${params.tenantSlug}/catalog`}
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-navy"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao catálogo
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          {/* main column */}
          <div>
            {/* hero */}
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card-elevated">
              <div className="relative aspect-[16/9] bg-surface-mid">
                <Image
                  src={course.coverImageUrl}
                  alt={course.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  priority
                  className="object-cover"
                />
                {course.isFeatured && (
                  <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-md bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-navy shadow-card-elevated">
                    <Sparkles className="h-3 w-3" strokeWidth={2.75} />
                    Destaque do mês
                  </div>
                )}
              </div>

              <div className="p-6 md:p-8">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-navy/8 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-navy ring-1 ring-navy/10">
                    {course.area}
                  </span>
                  {course.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-surface-low px-2 py-0.5 text-xs font-medium text-ink-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-navy md:text-4xl">
                  {course.name}
                </h1>
                <p className="mt-3 text-pretty text-base leading-relaxed text-ink-muted">
                  {course.marketingDescription}
                </p>

                <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-6">
                  <Spec icon={Clock} label="Duração" value={`${course.durationHours}h`} />
                  <Spec icon={ModIcon} label="Modalidade" value={modalityLabel[course.modality]} />
                  <Spec
                    icon={Award}
                    label="Certificação"
                    value={
                      course.certificationLevel === "APROVEITAMENTO"
                        ? "C/ Aproveitamento"
                        : "Participação"
                    }
                  />
                  <Spec icon={BadgeCheck} label="DGERT" value={course.code} />
                </div>
              </div>
            </div>

            {/* tabs / sections */}
            <div className="mt-8 space-y-8">
              <Section title="Sobre este curso">
                <p className="text-base leading-relaxed text-ink-muted">
                  {course.marketingDescription}
                </p>
                <p className="text-base leading-relaxed text-ink-muted">
                  Este curso é certificado pela DGERT e cumpre todos os
                  requisitos exigidos pela {course.area.toLowerCase()} em
                  contexto laboral. Cada turma é facilitada por formadores
                  com Certificado de Competências Pedagógicas (CCP) e
                  experiência prática de campo.
                </p>
              </Section>

              <Section title="Objetivos de aprendizagem">
                <ul className="space-y-2.5">
                  {sampleObjectives(course.area).map((obj, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <BadgeCheck
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                        strokeWidth={2.5}
                      />
                      <span className="text-sm text-foreground">{obj}</span>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section title="Programa do curso">
                <div className="space-y-3">
                  {sampleModules(course.durationHours).map((mod, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-navy text-white">
                        <span className="text-sm font-bold tabular-nums">
                          {i + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-navy">
                          {mod.name}
                        </h4>
                        <p className="mt-1 text-xs text-ink-muted">
                          {mod.description}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-surface-low px-2 py-1 text-xs font-medium text-ink-muted">
                        {mod.hours}h
                      </span>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Próximas edições">
                <div className="space-y-3">
                  {sampleEditions().map((edition, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-navy">
                            {edition.label}
                          </p>
                          <p className="text-xs text-ink-muted">
                            {edition.location} · {edition.spots} vagas
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
                          edition.spots > 5
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        )}
                      >
                        {edition.spots > 5 ? "Disponível" : "Últimas vagas"}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </div>

          {/* sidebar */}
          <aside>
            <div className="sticky top-6 space-y-4">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card-elevated">
                {course.priceEur !== null ? (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                      Investimento
                    </p>
                    <p className="mt-1 text-3xl font-bold leading-none text-navy">
                      {formatCurrency(course.priceEur)}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Por participante · IVA incluído
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                      Investimento
                    </p>
                    <p className="mt-1 text-2xl font-bold leading-tight text-navy">
                      Sob consulta
                    </p>
                  </>
                )}

                <Button
                  asChild
                  className="mt-5 h-11 w-full bg-navy text-white hover:bg-navy/90"
                >
                  <a href="#enroll">
                    Inscrever-me agora
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="mt-2 h-11 w-full border-border text-navy hover:bg-surface-low"
                >
                  <a href="#contact">Falar com consultor</a>
                </Button>

                <div className="mt-5 space-y-2.5 border-t border-border pt-4 text-xs text-ink-muted">
                  <BulletItem text="Certificado DGERT digital" />
                  <BulletItem text="Materiais incluídos no Moodle" />
                  <BulletItem text="Avaliação prática integrada" />
                  <BulletItem text="Suporte do formador 24/7" />
                </div>
              </div>

              <div className="rounded-xl border border-gold/20 bg-gold/5 p-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gold-700">
                  Formação para empresa
                </p>
                <p className="mt-2 text-sm font-bold text-navy">
                  Quer formar a sua equipa toda?
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  Edições in-company, conteúdo adaptado ao seu setor, dossier
                  DGERT incluído.
                </p>
                <a
                  href="#corp"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-gold-700 hover:text-navy"
                >
                  Pedir proposta
                  <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-h2 font-bold text-navy">
              Outros cursos em {course.area}
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  href={`/${params.tenantSlug}/catalog/${c.slug}`}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Spec({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-surface-low px-3 py-2">
      <Icon className="h-4 w-4 text-navy" strokeWidth={2} />
      <div className="text-xs leading-tight">
        <div className="font-semibold text-navy">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-ink-subtle">
          {label}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-4 text-h2 font-bold text-navy">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function BulletItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
      {text}
    </div>
  );
}

function sampleObjectives(area: string): string[] {
  const map: Record<string, string[]> = {
    "Saúde e Bem-Estar": [
      "Reconhecer sinais de stress, ansiedade e burnout em si e na equipa.",
      "Aplicar técnicas de regulação emocional baseadas em evidência.",
      "Desenhar planos pessoais e organizacionais de bem-estar laboral.",
      "Cumprir requisitos NR1 e diretivas europeias de saúde ocupacional.",
    ],
    "Tecnologia": [
      "Identificar vetores de ataque comuns na organização.",
      "Implementar autenticação multi-fator e segurança de identidade.",
      "Responder a incidentes seguindo as boas práticas RGPD.",
      "Estabelecer cultura de segurança no quotidiano.",
    ],
    "Liderança": [
      "Conduzir feedback útil em conversas difíceis.",
      "Aplicar princípios ágeis na gestão de equipas.",
      "Tomar decisões alinhadas com valores e métricas.",
      "Desenvolver autonomia em colaboradores.",
    ],
    "Gestão e Negócios": [
      "Comunicar com clareza e assertividade em equipa.",
      "Gerir conflitos de forma construtiva.",
      "Conduzir reuniões orientadas a decisões.",
      "Estruturar feedback em ciclos de melhoria.",
    ],
  };
  return (
    map[area] ?? [
      "Adquirir os conhecimentos teóricos fundamentais da área.",
      "Aplicar as técnicas em contexto real e supervisionado.",
      "Desenvolver autonomia e capacidade crítica de avaliação.",
      "Obter certificação DGERT reconhecida no mercado nacional.",
    ]
  );
}

function sampleModules(totalHours: number) {
  if (totalHours <= 1) {
    return [
      {
        name: "Workshop completo",
        description:
          "Sessão única de 1 hora com prática estruturada e plano pessoal de aplicação.",
        hours: 1,
      },
    ];
  }
  if (totalHours <= 8) {
    return [
      {
        name: "Fundamentos teóricos",
        description:
          "Enquadramento legal, conceitos fundamentais e contexto da disciplina.",
        hours: Math.ceil(totalHours * 0.4),
      },
      {
        name: "Prática supervisionada",
        description:
          "Aplicação em contexto real com facilitação direta do formador.",
        hours: Math.floor(totalHours * 0.6),
      },
    ];
  }
  return [
    {
      name: "Enquadramento e legislação",
      description:
        "Quadro legal aplicável, exigências DGERT e responsabilidades do empregador.",
      hours: Math.ceil(totalHours * 0.2),
    },
    {
      name: "Métodos e técnicas",
      description:
        "Técnicas práticas suportadas em casos reais e modelos validados.",
      hours: Math.ceil(totalHours * 0.4),
    },
    {
      name: "Prática integrada",
      description:
        "Simulações e exercícios em equipa para consolidar competências.",
      hours: Math.ceil(totalHours * 0.3),
    },
    {
      name: "Avaliação final",
      description:
        "Avaliação prática e elaboração de plano de aplicação no posto de trabalho.",
      hours: Math.floor(totalHours * 0.1),
    },
  ];
}

function sampleEditions() {
  return [
    { label: "15 Maio 2026 · Manhãs (09h-13h)", location: "Porto · Sala BV Areosa", spots: 12 },
    { label: "02 Junho 2026 · Tardes (14h-18h)", location: "Online · Microsoft Teams", spots: 4 },
    { label: "12 Julho 2026 · Intensivo (3 dias)", location: "Lisboa · Hub Criativo", spots: 18 },
  ];
}
