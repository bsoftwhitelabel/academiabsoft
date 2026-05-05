import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Award,
  Clock4,
  CalendarDays,
  ArrowRight,
  CheckCircle2,
  PauseCircle,
  TrendingUp,
  Sparkles,
  Filter,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { SessionRequired } from "@/components/dashboard/session-required";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Meus Cursos" };

type Props = {
  params: { tenantSlug: string };
  searchParams: { filter?: string };
};

// ─── Demo fallback ──────────────────────────────────────────────────────

type EnrollmentRow = {
  id: string;
  enrolledAt: Date;
  trainingActionId: string;
  trainingAction: {
    code: string;
    status: "DRAFT" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED" | "CANCELLED";
    location: string | null;
    course: {
      name: string;
      code: string;
      slug: string;
      durationHours: number;
      modality: "PRESENCIAL" | "ELEARNING" | "BLENDED";
      coverImageUrl: string | null;
      certificationLevel: "PARTICIPACAO" | "APROVEITAMENTO" | "COMPETENCIAS";
    };
    entity: { name: string } | null;
    sessions: Array<{ id: string; status: string; scheduledStart: Date }>;
    _count: { sessions: number };
  };
  _count: { attendances: number };
};

const DEMO_ENROLLMENTS: EnrollmentRow[] = [
  {
    id: "demo-1",
    enrolledAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    trainingActionId: "demo-ta-1",
    trainingAction: {
      code: "T2026-SHT-01",
      status: "IN_PROGRESS" as const,
      location: "Porto · Sala BV Areosa",
      course: {
        name: "Segurança e Higiene no Trabalho",
        code: "SHT-001",
        slug: "seguranca-higiene-trabalho",
        durationHours: 35,
        modality: "PRESENCIAL" as const,
        coverImageUrl:
          "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=500&fit=crop&q=80",
        certificationLevel: "APROVEITAMENTO" as const,
      },
      entity: { name: "Decathlon Portugal" },
      sessions: [
        { id: "demo-s1", status: "CLOSED", scheduledStart: new Date(Date.now() - 14 * 86400000) },
        { id: "demo-s2", status: "CLOSED", scheduledStart: new Date(Date.now() - 7 * 86400000) },
        { id: "demo-s3", status: "IN_PROGRESS", scheduledStart: new Date() },
        { id: "demo-s4", status: "UPCOMING", scheduledStart: new Date(Date.now() + 7 * 86400000) },
        { id: "demo-s5", status: "UPCOMING", scheduledStart: new Date(Date.now() + 14 * 86400000) },
      ],
      _count: { sessions: 5 },
    },
    _count: { attendances: 3 },
  },
  {
    id: "demo-2",
    enrolledAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    trainingActionId: "demo-ta-2",
    trainingAction: {
      code: "T2026-ING-12",
      status: "IN_PROGRESS" as const,
      location: "Online · Microsoft Teams",
      course: {
        name: "Inglês Técnico para Logística",
        code: "ING-A2",
        slug: "ingles-tecnico-logistica",
        durationHours: 60,
        modality: "ELEARNING" as const,
        coverImageUrl:
          "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=500&fit=crop&q=80",
        certificationLevel: "PARTICIPACAO" as const,
      },
      entity: { name: "Decathlon Portugal" },
      sessions: [
        { id: "demo-s6", status: "CLOSED", scheduledStart: new Date(Date.now() - 30 * 86400000) },
        { id: "demo-s7", status: "CLOSED", scheduledStart: new Date(Date.now() - 21 * 86400000) },
        { id: "demo-s8", status: "CLOSED", scheduledStart: new Date(Date.now() - 14 * 86400000) },
        { id: "demo-s9", status: "CLOSED", scheduledStart: new Date(Date.now() - 7 * 86400000) },
        { id: "demo-s10", status: "UPCOMING", scheduledStart: new Date(Date.now() + 2 * 86400000) },
      ],
      _count: { sessions: 5 },
    },
    _count: { attendances: 4 },
  },
  {
    id: "demo-3",
    enrolledAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    trainingActionId: "demo-ta-3",
    trainingAction: {
      code: "T2025-EXC-09",
      status: "COMPLETED" as const,
      location: "Lisboa · Hub Criativo",
      course: {
        name: "Microsoft Excel Avançado",
        code: "EXC-ADV",
        slug: "microsoft-excel-avancado",
        durationHours: 24,
        modality: "BLENDED" as const,
        coverImageUrl:
          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop&q=80",
        certificationLevel: "APROVEITAMENTO" as const,
      },
      entity: { name: "Decathlon Portugal" },
      sessions: Array.from({ length: 4 }, (_, i) => ({
        id: `demo-completed-${i}`,
        status: "CLOSED",
        scheduledStart: new Date(Date.now() - (60 - i * 7) * 86400000),
      })),
      _count: { sessions: 4 },
    },
    _count: { attendances: 4 },
  },
];

const DEMO_CERT_MAP = new Map<string, { trainingActionId: string; verificationCode: string; pdfUrl: string | null; issuedAt: Date }>([
  [
    "demo-ta-3",
    {
      trainingActionId: "demo-ta-3",
      verificationCode: "DEMO-CERT-EXC-0042",
      pdfUrl: null,
      issuedAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
    },
  ],
]);

export default async function PortalCoursesPage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session) {
    return <SessionRequired tenantSlug={params.tenantSlug} title="Meus Cursos" hasBottomNav />;
  }

  const trainee = await prisma.trainee.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  // Real enrollments (or empty array)
  const realEnrollments = trainee
    ? await prisma.enrollment.findMany({
        where: { traineeId: trainee.id },
        include: {
          trainingAction: {
            include: {
              course: {
                select: {
                  name: true,
                  code: true,
                  slug: true,
                  durationHours: true,
                  modality: true,
                  coverImageUrl: true,
                  certificationLevel: true,
                },
              },
              entity: { select: { name: true } },
              sessions: {
                select: {
                  id: true,
                  status: true,
                  scheduledStart: true,
                },
                orderBy: { scheduledStart: "asc" },
              },
              _count: { select: { sessions: true } },
            },
          },
          _count: { select: { attendances: true } },
        },
        orderBy: { enrolledAt: "desc" },
      })
    : [];

  const realCerts = trainee
    ? await prisma.certificate.findMany({
        where: { traineeId: trainee.id },
        select: {
          trainingActionId: true,
          verificationCode: true,
          pdfUrl: true,
          issuedAt: true,
        },
      })
    : [];

  const isUsingDemoData = realEnrollments.length === 0;
  const enrollments: EnrollmentRow[] = isUsingDemoData
    ? DEMO_ENROLLMENTS
    : (realEnrollments as unknown as EnrollmentRow[]);
  const certByActionId = isUsingDemoData
    ? DEMO_CERT_MAP
    : new Map(realCerts.map((c) => [c.trainingActionId, c]));

  const filter = searchParams.filter ?? "all";
  const filteredEnrollments = enrollments.filter((e) => {
    if (filter === "active")
      return e.trainingAction.status === "IN_PROGRESS" ||
             e.trainingAction.status === "SCHEDULED";
    if (filter === "completed")
      return e.trainingAction.status === "COMPLETED";
    if (filter === "archived")
      return e.trainingAction.status === "ARCHIVED" ||
             e.trainingAction.status === "CANCELLED";
    return true;
  });

  const stats = {
    total: enrollments.length,
    active: enrollments.filter(
      (e) =>
        e.trainingAction.status === "IN_PROGRESS" ||
        e.trainingAction.status === "SCHEDULED"
    ).length,
    completed: enrollments.filter(
      (e) => e.trainingAction.status === "COMPLETED"
    ).length,
    totalHours: enrollments.reduce(
      (acc, e) => acc + e.trainingAction.course.durationHours,
      0
    ),
  };

  // Highlight: course currently in progress with most progress
  const featuredActive = enrollments
    .filter((e) => e.trainingAction.status === "IN_PROGRESS")
    .sort((a, b) => {
      const pa = a._count.attendances / Math.max(1, a.trainingAction._count.sessions);
      const pb = b._count.attendances / Math.max(1, b.trainingAction._count.sessions);
      return pb - pa;
    })[0];

  return (
    <DashboardShell hasBottomNav>
      <PageHeader
        breadcrumb={[{ label: "Meus Cursos" }]}
        title="Meus Cursos"
        description="Todas as suas inscrições · ativas, concluídas e arquivadas"
        actions={
          <Link
            href={`/${params.tenantSlug}/catalog`}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-navy px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-navy/90"
          >
            <BookOpen className="h-4 w-4" />
            Explorar catálogo
          </Link>
        }
      />

      {isUsingDemoData && (
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-700 ring-1 ring-gold/20">
          <Sparkles className="h-3 w-3" strokeWidth={2.75} />
          Conteúdo demo · serão substituídos pelas tuas inscrições reais
        </div>
      )}

      {/* KPI strip */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Inscrições" value={String(stats.total)} icon={BookOpen} variant="blue" />
        <StatCard label="Em curso" value={String(stats.active)} icon={Clock4} variant="emerald" />
        <StatCard label="Concluídos" value={String(stats.completed)} icon={Award} variant="gold" />
        <StatCard label="Horas totais" value={`${stats.totalHours}h`} icon={CalendarDays} variant="purple" />
      </div>

      {/* Featured active course banner */}
      {featuredActive && filter === "all" && (
        <FeaturedCourseBanner
          enrollment={featuredActive}
          tenantSlug={params.tenantSlug}
        />
      )}

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-ink-subtle">
          <Filter className="h-3 w-3" />
          Filtrar:
        </span>
        <FilterTab
          href={`/${params.tenantSlug}/portal/courses`}
          active={filter === "all"}
          label="Todos"
          count={stats.total}
        />
        <FilterTab
          href={`/${params.tenantSlug}/portal/courses?filter=active`}
          active={filter === "active"}
          label="Em curso"
          count={stats.active}
        />
        <FilterTab
          href={`/${params.tenantSlug}/portal/courses?filter=completed`}
          active={filter === "completed"}
          label="Concluídos"
          count={stats.completed}
        />
        <FilterTab
          href={`/${params.tenantSlug}/portal/courses?filter=archived`}
          active={filter === "archived"}
          label="Arquivados"
          count={enrollments.length - stats.active - stats.completed}
        />
      </div>

      {/* Cards grid */}
      {filteredEnrollments.length === 0 ? (
        <EmptyFilter filter={filter} tenantSlug={params.tenantSlug} />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredEnrollments.map((enr) => (
            <EnrollmentCard
              key={enr.id}
              enrollment={enr}
              tenantSlug={params.tenantSlug}
              certificate={certByActionId.get(enr.trainingActionId)}
            />
          ))}
        </div>
      )}

      {/* Quick links footer */}
      <section className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        <QuickLink
          icon={CalendarDays}
          href={`/${params.tenantSlug}/portal/calendar`}
          title="Ver calendário"
          description="Sessões agendadas dos teus cursos"
        />
        <QuickLink
          icon={Award}
          href={`/${params.tenantSlug}/portal/certificates`}
          title="Os meus certificados"
          description="Downloads e códigos de verificação"
        />
        <QuickLink
          icon={TrendingUp}
          href={`/${params.tenantSlug}/portal/history`}
          title="Histórico completo"
          description="Todas as sessões assistidas"
        />
      </section>
    </DashboardShell>
  );
}

// ─── Subcomponents ──────────────────────────────────────────────────────

type Enrollment = EnrollmentRow;

type CertInfo = {
  trainingActionId: string;
  verificationCode: string;
  pdfUrl: string | null;
  issuedAt: Date;
} | undefined;

function FeaturedCourseBanner({
  enrollment,
  tenantSlug,
}: {
  enrollment: Enrollment;
  tenantSlug: string;
}) {
  const ta = enrollment.trainingAction;
  const now = new Date();
  const nextSession = ta.sessions.find(
    (s) => s.scheduledStart >= now && s.status !== "CLOSED"
  );
  const progress = Math.round(
    (enrollment._count.attendances / Math.max(1, ta._count.sessions)) * 100
  );

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-navy/15 bg-card shadow-card-elevated">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
        <div className="relative aspect-[16/10] bg-surface-mid lg:aspect-auto">
          {ta.course.coverImageUrl && (
            <Image
              src={ta.course.coverImageUrl}
              alt={ta.course.name}
              fill
              sizes="(max-width: 1024px) 100vw, 280px"
              className="object-cover"
            />
          )}
          <div className="absolute left-3 top-3">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              Em destaque
            </span>
          </div>
        </div>
        <div className="flex flex-col p-6 md:p-7">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
            {ta.entity?.name ?? "Sem cliente"} · {ta.code}
          </p>
          <h2 className="mt-1 text-h2 font-bold leading-tight text-navy">
            {ta.course.name}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            Já assististe <strong className="text-navy">{enrollment._count.attendances}</strong> de {ta._count.sessions} sessões.
            Continua assim!
          </p>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold">
              <span className="text-ink-muted">Progresso</span>
              <span className="text-navy tabular-nums">{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-mid">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-light to-gold transition-all"
                style={{ width: `${Math.max(progress, 4)}%` }}
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="text-xs text-ink-muted">
              {nextSession ? (
                <>
                  <span className="font-bold text-navy">Próxima sessão:</span>{" "}
                  {formatDate(nextSession.scheduledStart)}
                </>
              ) : (
                "Sem próxima sessão agendada"
              )}
            </div>
            <Link
              href={
                nextSession
                  ? `/${tenantSlug}/portal/sessions/${nextSession.id}/checkin`
                  : `/${tenantSlug}/catalog/${ta.course.slug}`
              }
              className="inline-flex items-center gap-1.5 rounded-md bg-navy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-navy/90"
            >
              {nextSession ? "Ir para sessão" : "Ver detalhes"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function EnrollmentCard({
  enrollment,
  tenantSlug,
  certificate,
}: {
  enrollment: Enrollment;
  tenantSlug: string;
  certificate: CertInfo;
}) {
  const ta = enrollment.trainingAction;
  const course = ta.course;
  const isActive = ta.status === "IN_PROGRESS" || ta.status === "SCHEDULED";
  const isCompleted = ta.status === "COMPLETED";

  const progressPct =
    ta._count.sessions > 0
      ? Math.min(
          100,
          Math.round((enrollment._count.attendances / ta._count.sessions) * 100)
        )
      : 0;

  const now = new Date();
  const nextSession = ta.sessions.find(
    (s) => s.scheduledStart >= now && s.status !== "CLOSED"
  );

  let ctaHref: string;
  let ctaLabel: string;
  if (isActive && nextSession) {
    ctaHref = `/${tenantSlug}/portal/sessions/${nextSession.id}/checkin`;
    ctaLabel = "Próxima sessão →";
  } else if (isCompleted && certificate) {
    ctaHref = `/${tenantSlug}/portal/certificates`;
    ctaLabel = "Ver certificado →";
  } else {
    ctaHref = `/${tenantSlug}/catalog/${course.slug}`;
    ctaLabel = "Ver detalhe →";
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="relative aspect-[16/10] bg-surface-mid">
        {course.coverImageUrl ? (
          <Image
            src={course.coverImageUrl}
            alt={course.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-faint">
            <BookOpen className="h-12 w-12" />
          </div>
        )}
        <div className="absolute right-3 top-3">
          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-navy/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              <CheckCircle2 className="h-3 w-3" strokeWidth={2.75} />
              Concluído
            </span>
          ) : isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              Em curso
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              <PauseCircle className="h-3 w-3" />
              Pausado
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
          {course.code} · {ta.code}
        </p>
        <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-navy">
          {course.name}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <Clock4 className="h-3 w-3" />
            {course.durationHours}h
          </span>
          <span>·</span>
          <span>
            {course.modality === "PRESENCIAL"
              ? "Presencial"
              : course.modality === "ELEARNING"
              ? "E-learning"
              : "Híbrido"}
          </span>
          <span>·</span>
          <span>
            {course.certificationLevel === "APROVEITAMENTO"
              ? "C/ Aproveitamento"
              : "Participação"}
          </span>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold">
            <span className="text-ink-muted">
              Sessões · {enrollment._count.attendances}/{ta._count.sessions}
            </span>
            <span className="text-navy tabular-nums">{progressPct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-mid">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isCompleted
                  ? "bg-emerald-500"
                  : progressPct >= 50
                  ? "bg-gold"
                  : "bg-gold-light"
              )}
              style={{ width: `${Math.max(progressPct, 4)}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs">
          <span className="font-medium text-ink-muted">
            {ta.entity?.name ?? `Inscrito ${formatDate(enrollment.enrolledAt)}`}
          </span>
          <Link
            href={ctaHref}
            className="font-bold text-blue-600 hover:text-navy"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </article>
  );
}

function FilterTab({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "bg-navy text-white shadow-card-elevated"
          : "bg-surface-low text-ink-muted hover:bg-surface-mid hover:text-navy"
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
          active ? "bg-white/20" : "bg-card"
        )}
      >
        {count}
      </span>
    </Link>
  );
}

function EmptyFilter({ filter, tenantSlug }: { filter: string; tenantSlug: string }) {
  const messages: Record<string, { title: string; body: string }> = {
    active: {
      title: "Sem cursos em curso",
      body: "Quando inscreveres num curso novo, aparece aqui em destaque.",
    },
    completed: {
      title: "Ainda sem cursos concluídos",
      body: "Conclui o teu primeiro curso para começares a colecionar certificados.",
    },
    archived: {
      title: "Sem cursos arquivados",
      body: "Cursos cancelados ou arquivados aparecem aqui.",
    },
  };
  const msg = messages[filter] ?? {
    title: "Sem cursos para mostrar",
    body: "Tente outro filtro ou consulte o catálogo.",
  };
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-low/40 px-8 py-16 text-center">
      <BookOpen className="mx-auto mb-3 h-10 w-10 text-ink-faint" />
      <h3 className="text-base font-bold text-navy">{msg.title}</h3>
      <p className="mt-1 text-xs text-ink-muted">{msg.body}</p>
      <Link
        href={`/${tenantSlug}/catalog`}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-navy"
      >
        Ver catálogo
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

function QuickLink({
  icon: Icon,
  href,
  title,
  description,
}: {
  icon: typeof CalendarDays;
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-navy/20 hover:shadow-card-hover"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-navy/8 text-navy">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold text-navy">{title}</h3>
        <p className="mt-1 text-xs text-ink-muted">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-navy" />
    </Link>
  );
}
