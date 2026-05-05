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

export default async function PortalCoursesPage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session) {
    return <SessionRequired tenantSlug={params.tenantSlug} title="Meus Cursos" hasBottomNav />;
  }

  const trainee = await prisma.trainee.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!trainee) {
    return (
      <DashboardShell hasBottomNav>
        <PageHeader title="Meus Cursos" />
        <p className="text-sm text-ink-muted">
          O perfil de formando não foi encontrado.
        </p>
      </DashboardShell>
    );
  }

  const enrollments = await prisma.enrollment.findMany({
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
  });

  // Map course → certificate (for completed)
  const certificates = await prisma.certificate.findMany({
    where: { traineeId: trainee.id },
    select: {
      trainingActionId: true,
      verificationCode: true,
      pdfUrl: true,
      issuedAt: true,
    },
  });
  const certByActionId = new Map(
    certificates.map((c) => [c.trainingActionId, c])
  );

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

  return (
    <DashboardShell hasBottomNav>
      <PageHeader
        breadcrumb={[{ label: "Meus Cursos" }]}
        title="Meus Cursos"
        description="Todas as suas inscrições · ativas, concluídas e arquivadas"
      />

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total inscrições" value={String(stats.total)} icon={BookOpen} variant="blue" />
        <StatCard label="Em curso" value={String(stats.active)} icon={Clock4} variant="emerald" />
        <StatCard label="Concluídos" value={String(stats.completed)} icon={Award} variant="gold" />
        <StatCard label="Horas totais" value={`${stats.totalHours}h`} icon={CalendarDays} variant="purple" />
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
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
          count={
            enrollments.length - stats.active - stats.completed
          }
        />
      </div>

      {/* Cards */}
      {filteredEnrollments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-low/40 px-8 py-16 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-ink-faint" />
          <h3 className="text-base font-bold text-navy">
            Nenhum curso nesta categoria
          </h3>
          <p className="mt-1 text-xs text-ink-muted">
            Tente outro filtro ou consulte o catálogo.
          </p>
          <Link
            href={`/${params.tenantSlug}/catalog`}
            className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-navy"
          >
            Ver catálogo
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
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
    </DashboardShell>
  );
}

type Enrollment = Awaited<
  ReturnType<typeof prisma.enrollment.findMany>
>[number] & {
  trainingAction: {
    code: string;
    status: "DRAFT" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED" | "CANCELLED";
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

type CertInfo = {
  trainingActionId: string;
  verificationCode: string;
  pdfUrl: string | null;
  issuedAt: Date;
} | undefined;

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

  // Approximate progress: attendances / total sessions
  const progressPct =
    ta._count.sessions > 0
      ? Math.min(
          100,
          Math.round((enrollment._count.attendances / ta._count.sessions) * 100)
        )
      : 0;

  // Smart CTA: next upcoming session for active, certificate for completed, fallback to catalog detail
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
      {/* cover */}
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

      {/* body */}
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

        {/* progress */}
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
            {ta.entity?.name
              ? ta.entity.name
              : `Inscrito ${formatDate(enrollment.enrolledAt)}`}
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
