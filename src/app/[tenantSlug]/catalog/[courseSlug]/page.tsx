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
import { getTenantBySlug } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import type { MockCourse } from "@/lib/mock-data";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

export const dynamicParams = true;

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&h=800&fit=crop&q=80";

type Props = {
  params: { tenantSlug: string; courseSlug: string };
};

function slugifyAreaName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export async function generateMetadata({ params }: Props) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant) return { title: "Curso" };
  const course = await prisma.course.findUnique({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: params.courseSlug },
    },
    select: { name: true, marketingDescription: true },
  });
  return {
    title: course?.name ?? "Curso",
    description: course?.marketingDescription,
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  if (!tenant) notFound();

  const course = await prisma.course.findUnique({
    where: {
      tenantId_slug: { tenantId: tenant.id, slug: params.courseSlug },
    },
    include: {
      trainingArea: { select: { id: true, name: true } },
      modules: { orderBy: { order: "asc" } },
    },
  });
  if (!course) notFound();
  if (!course.isPublic) notFound();

  const now = new Date();
  const [upcomingEditions, relatedCourses] = await Promise.all([
    prisma.trainingAction.findMany({
      where: {
        courseId: course.id,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        endDate: { gte: now },
      },
      include: {
        entity: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { startDate: "asc" },
      take: 4,
    }),
    course.trainingAreaId
      ? prisma.course.findMany({
          where: {
            tenantId: tenant.id,
            trainingAreaId: course.trainingAreaId,
            isPublic: true,
            status: "ACTIVE",
            id: { not: course.id },
          },
          include: {
            trainingArea: { select: { name: true } },
            _count: { select: { trainingActions: true } },
          },
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
          take: 3,
        })
      : Promise.resolve([]),
  ]);

  const tags = course.tagsRaw ? course.tagsRaw.split(",").map((t) => t.trim()) : [];
  const areaName = course.trainingArea?.name ?? "Sem área";
  const areaSlug = course.trainingArea ? slugifyAreaName(course.trainingArea.name) : "no-area";

  const related: MockCourse[] = relatedCourses.map((c) => ({
    id: c.id,
    slug: c.slug,
    code: c.code,
    name: c.name,
    shortName: c.shortName ?? c.name,
    area: c.trainingArea?.name ?? "Sem área",
    areaSlug: c.trainingArea ? slugifyAreaName(c.trainingArea.name) : "no-area",
    modality: c.modality,
    durationHours: c.durationHours,
    priceEur: c.priceEur ? Number(c.priceEur) : null,
    isFeatured: c.isFeatured,
    isPublic: c.isPublic,
    coverImageUrl: c.coverImageUrl ?? FALLBACK_COVER,
    marketingDescription: c.marketingDescription ?? "",
    certificationLevel: c.certificationLevel,
    tags: c.tagsRaw ? c.tagsRaw.split(",").map((t) => t.trim()) : [],
    turmasCount: c._count.trainingActions,
  }));

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

  const objectives = course.objetivosEspecificos
    ? course.objetivosEspecificos.split("\n").filter((l) => l.trim())
    : sampleObjectives(areaName);

  const modules = course.modules.length
    ? course.modules.map((m) => ({
        name: m.name,
        description: m.description ?? "",
        hours: m.durationHours,
      }))
    : sampleModules(course.durationHours);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-container px-4 py-6 md:px-8 md:py-8">
        <Link
          href={`/${params.tenantSlug}/catalog?area=${areaSlug}`}
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-navy"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar ao catálogo
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card-elevated">
              <div className="relative aspect-[16/9] bg-surface-mid">
                <Image
                  src={course.coverImageUrl ?? FALLBACK_COVER}
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
                    {areaName}
                  </span>
                  {tags.slice(0, 3).map((tag) => (
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
                {course.marketingDescription && (
                  <p className="mt-3 text-pretty text-base leading-relaxed text-ink-muted">
                    {course.marketingDescription}
                  </p>
                )}

                <div className="mt-6 flex flex-wrap gap-2 border-t border-border pt-6">
                  <Spec icon={Clock} label="Duração" value={`${course.durationHours}h`} />
                  <Spec icon={ModIcon} label="Modalidade" value={modalityLabel[course.modality]} />
                  <Spec
                    icon={Award}
                    label="Certificação"
                    value={
                      course.certificationLevel === "APROVEITAMENTO"
                        ? "C/ Aproveitamento"
                        : course.certificationLevel === "COMPETENCIAS"
                        ? "Competências"
                        : "Participação"
                    }
                  />
                  <Spec icon={BadgeCheck} label="DGERT" value={course.code} />
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-8">
              {(course.objetivosGerais || course.marketingDescription) && (
                <Section title="Sobre este curso">
                  <p className="whitespace-pre-line text-base leading-relaxed text-ink-muted">
                    {course.objetivosGerais ?? course.marketingDescription}
                  </p>
                </Section>
              )}

              <Section title="Objetivos de aprendizagem">
                <ul className="space-y-2.5">
                  {objectives.map((obj, i) => (
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

              <Section title={`Programa do curso (${modules.length})`}>
                <div className="space-y-3">
                  {modules.map((mod, i) => (
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
                        {mod.description && (
                          <p className="mt-1 text-xs text-ink-muted">
                            {mod.description}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 rounded-md bg-surface-low px-2 py-1 text-xs font-medium text-ink-muted">
                        {mod.hours}h
                      </span>
                    </div>
                  ))}
                </div>
              </Section>

              {upcomingEditions.length > 0 && (
                <Section title="Próximas edições">
                  <div className="space-y-3">
                    {upcomingEditions.map((edition) => {
                      const spotsLeft = edition.maxTrainees
                        ? Math.max(
                            0,
                            edition.maxTrainees - edition._count.enrollments
                          )
                        : null;
                      return (
                        <div
                          key={edition.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700">
                              <CalendarDays className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-navy">
                                {formatDate(edition.startDate)} →{" "}
                                {formatDate(edition.endDate)}
                              </p>
                              <p className="text-xs text-ink-muted">
                                {edition.location ?? "Local a confirmar"}
                                {edition.entity?.name && (
                                  <> · {edition.entity.name}</>
                                )}
                              </p>
                            </div>
                          </div>
                          {spotsLeft !== null ? (
                            <span
                              className={cn(
                                "rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
                                spotsLeft > 5
                                  ? "bg-emerald-50 text-emerald-700"
                                  : spotsLeft > 0
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700"
                              )}
                            >
                              {spotsLeft > 5
                                ? "Disponível"
                                : spotsLeft > 0
                                ? `Últimas ${spotsLeft} vagas`
                                : "Esgotado"}
                            </span>
                          ) : (
                            <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                              Inscrições abertas
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}
            </div>
          </div>

          <aside>
            <div className="sticky top-6 space-y-4">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card-elevated">
                <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                  Investimento
                </p>
                {course.priceEur !== null && course.priceEur !== undefined ? (
                  <>
                    <p className="mt-1 text-3xl font-bold leading-none text-navy">
                      {formatCurrency(Number(course.priceEur))}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Por participante · IVA incluído
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-2xl font-bold leading-tight text-navy">
                    Sob consulta
                  </p>
                )}

                <Button
                  asChild
                  className="mt-5 h-11 w-full bg-navy text-white hover:bg-navy/90"
                >
                  <Link href={`/${params.tenantSlug}/onboarding`}>
                    Inscrever-me agora
                    <ArrowRight className="h-4 w-4" />
                  </Link>
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
                <Link
                  href={`/${params.tenantSlug}/catalog/workshops#contact`}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-gold-700 hover:text-navy"
                >
                  Pedir proposta
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-h2 font-bold text-navy">
              Outros cursos em {areaName}
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
    Tecnologia: [
      "Identificar vetores de ataque comuns na organização.",
      "Implementar autenticação multi-fator e segurança de identidade.",
      "Responder a incidentes seguindo as boas práticas RGPD.",
      "Estabelecer cultura de segurança no quotidiano.",
    ],
    Liderança: [
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
