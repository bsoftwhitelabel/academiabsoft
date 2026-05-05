import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Timer,
  Award,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActiveSessionBanner } from "@/components/trainee/active-session-banner";
import { CourseProgressCard } from "@/components/trainee/course-progress-card";
import { ActivityTimeline } from "@/components/trainee/activity-timeline";
import { MilestoneCard } from "@/components/trainee/milestone-card";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type {
  ActiveSession,
  ActivityItem,
  TraineeActiveCourse,
} from "@/lib/mock-data";

export const metadata = { title: "Painel" };

type Props = { params: { tenantSlug: string } };

const FALLBACK_COURSE_COVER =
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop&q=80";

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDateLong(d: Date): string {
  return d.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 7) return `${days}d atrás`;
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

export default async function TraineeDashboard({ params }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  const trainee = await prisma.trainee.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!trainee) {
    return (
      <DashboardShell hasBottomNav>
        <div className="rounded-2xl border border-dashed border-border bg-surface-low/40 px-8 py-16 text-center">
          <Inbox className="mx-auto mb-4 h-10 w-10 text-ink-faint" />
          <h2 className="text-xl font-bold text-navy">
            Perfil de formando não encontrado
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            Contacta o administrador para criar o teu perfil.
          </p>
        </div>
      </DashboardShell>
    );
  }

  const greetingName = session.fullName.split(" ")[0];
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  const last48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  // ─── Parallel fetch ─────────────────────────────────────────────────────
  const [
    activeSession,
    enrollments,
    completedActions,
    certificatesCount,
    totalAttendedHoursAgg,
    recentAttendances,
    recentCertificates,
  ] = await Promise.all([
    // The session that is currently in_progress OR upcoming today
    prisma.session.findFirst({
      where: {
        attendances: { some: { traineeId: trainee.id } },
        scheduledEnd: { gte: now },
        scheduledStart: { lte: inOneHour },
      },
      include: {
        trainingAction: {
          include: {
            course: { select: { name: true, slug: true } },
            trainers: {
              include: {
                trainer: { include: { user: { select: { fullName: true } } } },
              },
            },
          },
        },
      },
      orderBy: { scheduledStart: "asc" },
    }),
    // All enrollments (active courses) with progress + next session
    prisma.enrollment.findMany({
      where: {
        traineeId: trainee.id,
        trainingAction: { status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
      },
      include: {
        trainingAction: {
          include: {
            course: {
              select: {
                name: true,
                coverImageUrl: true,
                trainingArea: { select: { name: true } },
              },
            },
            entity: { select: { name: true } },
            sessions: {
              orderBy: { number: "asc" },
              select: {
                id: true,
                number: true,
                status: true,
                scheduledStart: true,
              },
            },
            _count: { select: { sessions: true } },
          },
        },
      },
      orderBy: { enrolledAt: "desc" },
      take: 4,
    }),
    // Completed training actions count
    prisma.enrollment.count({
      where: {
        traineeId: trainee.id,
        trainingAction: { status: "COMPLETED" },
      },
    }),
    prisma.certificate.count({ where: { traineeId: trainee.id } }),
    // Sum attended hours from PRESENT/CHECKED_IN/MANUAL_PRESENT attendances
    prisma.attendance.findMany({
      where: {
        traineeId: trainee.id,
        status: { in: ["PRESENT", "CHECKED_IN", "MANUAL_PRESENT"] },
      },
      select: {
        session: { select: { scheduledStart: true, scheduledEnd: true } },
      },
    }),
    // Recent attendance activity
    prisma.attendance.findMany({
      where: {
        traineeId: trainee.id,
        OR: [
          { checkedInAt: { gte: last48h } },
          { signatureEnabledAt: { gte: last48h } },
          { updatedAt: { gte: last48h } },
        ],
      },
      include: {
        session: {
          include: {
            trainingAction: {
              include: { course: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.certificate.findMany({
      where: { traineeId: trainee.id, issuedAt: { gte: last48h } },
      include: {
        trainingAction: {
          include: { course: { select: { name: true } } },
        },
      },
      orderBy: { issuedAt: "desc" },
      take: 3,
    }),
  ]);

  // ─── Compute aggregates ─────────────────────────────────────────────────
  const totalAttendedHours = totalAttendedHoursAgg.reduce((acc, a) => {
    const ms =
      a.session.scheduledEnd.getTime() - a.session.scheduledStart.getTime();
    return acc + ms / (60 * 60 * 1000);
  }, 0);

  // ─── Active session card data ───────────────────────────────────────────
  const activeSessionData: ActiveSession | null = activeSession
    ? {
        id: activeSession.id,
        trainingActionId: activeSession.trainingActionId,
        courseName: activeSession.trainingAction.course.name,
        courseSlug: activeSession.trainingAction.course.slug,
        scheduledStart: fmtTime(activeSession.scheduledStart),
        scheduledEnd: fmtTime(activeSession.scheduledEnd),
        dateLabel: fmtDateLong(activeSession.scheduledStart),
        modality: activeSession.trainingAction.modality,
        location:
          [
            activeSession.trainingAction.location,
            activeSession.trainingAction.room,
          ]
            .filter(Boolean)
            .join(" · ") || "Sem local",
        trainerName:
          activeSession.trainingAction.trainers.find((t) => t.isPrimary)
            ?.trainer.user.fullName ??
          activeSession.trainingAction.trainers[0]?.trainer.user.fullName ??
          "Formador",
        isLive:
          activeSession.scheduledStart <= now &&
          activeSession.scheduledEnd >= now,
      }
    : null;

  // ─── Active courses cards ───────────────────────────────────────────────
  const activeCourses: TraineeActiveCourse[] = enrollments.map((e) => {
    const ta = e.trainingAction;
    const closedCount = ta.sessions.filter((s) => s.status === "CLOSED").length;
    const progress =
      ta._count.sessions > 0
        ? Math.round((closedCount / ta._count.sessions) * 100)
        : 0;
    const next = ta.sessions.find(
      (s) => s.scheduledStart >= now && s.status !== "CLOSED"
    );
    return {
      id: e.id,
      name: ta.course.name,
      category: ta.course.trainingArea?.name ?? "Sem área",
      group: ta.entity?.name ? `Turma ${ta.code}` : `Turma ${ta.code}`,
      progress,
      imageUrl: ta.course.coverImageUrl ?? FALLBACK_COURSE_COVER,
      sessionsAttended: closedCount,
      sessionsTotal: ta._count.sessions,
      nextSessionLabel: next
        ? `${fmtDateLong(next.scheduledStart)} · ${fmtTime(
            next.scheduledStart
          )}`
        : "Sem próxima sessão",
      href: next
        ? `/${params.tenantSlug}/portal/sessions/${next.id}/checkin`
        : `/${params.tenantSlug}/portal/courses`,
    };
  });

  // ─── Activity timeline ──────────────────────────────────────────────────
  const activities: ActivityItem[] = [];

  for (const a of recentAttendances) {
    const courseName = a.session.trainingAction.course.name;
    if (a.signatureState === "SIGNED" && a.updatedAt >= last48h) {
      activities.push({
        id: `att-sig-${a.id}`,
        title: "Assinatura efetuada",
        description: `${courseName} · sessão ${a.session.number}`,
        timestamp: relativeTime(a.updatedAt),
        type: "presence",
      });
    } else if (a.checkedInAt && a.checkedInAt >= last48h) {
      activities.push({
        id: `att-ci-${a.id}`,
        title: "Check-in registado",
        description: `${courseName} · sessão ${a.session.number}`,
        timestamp: relativeTime(a.checkedInAt),
        type: "presence",
      });
    }
  }

  for (const c of recentCertificates) {
    activities.push({
      id: `cert-${c.id}`,
      title: "Certificado emitido",
      description: c.trainingAction.course.name,
      timestamp: relativeTime(c.issuedAt),
      type: "certificate",
    });
  }

  activities.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const trimmedActivities = activities.slice(0, 6);

  // ─── Milestone (next certification target) ──────────────────────────────
  const nextMilestoneTarget =
    totalAttendedHours < 50
      ? 50
      : totalAttendedHours < 100
      ? 100
      : totalAttendedHours < 250
      ? 250
      : 500;
  const milestoneLevel =
    totalAttendedHours >= 250
      ? "Master"
      : totalAttendedHours >= 100
      ? "Avançado"
      : totalAttendedHours >= 50
      ? "Intermédio"
      : "Iniciado";

  return (
    <DashboardShell hasBottomNav>
      <div className="mb-6 md:mb-8">
        <h1 className="text-h1 font-bold tracking-tight text-navy">
          Olá, {greetingName}!
        </h1>
        <p className="mt-1 text-body-lg text-ink-muted">
          Bem-vindo ao teu painel · {enrollments.length} curso
          {enrollments.length !== 1 && "s"} em curso
        </p>
      </div>

      {/* active session hero (only if exists) */}
      {activeSessionData && (
        <div className="mb-6 md:mb-8">
          <ActiveSessionBanner
            session={activeSessionData}
            checkInHref={`/${params.tenantSlug}/portal/sessions/${activeSessionData.id}/checkin`}
          />
        </div>
      )}

      {/* stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <StatCard
          label="Cursos Concluídos"
          value={String(completedActions)}
          icon={CheckCircle2}
          variant="blue"
        />
        <StatCard
          label="Horas Acumuladas"
          value={`${Math.round(totalAttendedHours)}h`}
          icon={Timer}
          variant="gold"
        />
        <StatCard
          label="Certificados"
          value={String(certificatesCount)}
          icon={Award}
          variant="emerald"
        />
      </div>

      {/* active courses */}
      <section className="mb-8 md:mb-10">
        <header className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-h2 font-bold text-navy">Os meus cursos</h2>
            <p className="mt-0.5 text-xs text-ink-subtle">
              {activeCourses.length} em curso · próxima sessão em destaque
            </p>
          </div>
          <Link
            href={`/${params.tenantSlug}/portal/courses`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-navy"
          >
            Ver todos
            <ChevronRight className="h-4 w-4" />
          </Link>
        </header>

        {activeCourses.length === 0 ? (
          <EmptyCoursesPlaceholder tenantSlug={params.tenantSlug} />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {activeCourses.slice(0, 4).map((course) => (
              <CourseProgressCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>

      {/* secondary row: activities + milestone */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <header className="mb-6 flex items-center justify-between">
            <h3 className="text-h3 font-bold text-navy">Atividade recente</h3>
            <Link
              href={`/${params.tenantSlug}/portal/history`}
              className="text-xs font-semibold text-blue-600 hover:text-navy"
            >
              Histórico completo
            </Link>
          </header>
          {trimmedActivities.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              Sem atividade nas últimas 48h.
            </p>
          ) : (
            <ActivityTimeline activities={trimmedActivities} />
          )}
        </div>
        <MilestoneCard
          level={milestoneLevel}
          description={`A caminho do nível ${
            milestoneLevel === "Master" ? "Master" : "seguinte"
          }`}
          currentHours={Math.round(totalAttendedHours)}
          targetHours={nextMilestoneTarget}
        />
      </div>
    </DashboardShell>
  );
}

function EmptyCoursesPlaceholder({ tenantSlug }: { tenantSlug: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface-low/40 px-6 py-12 text-center">
      <Inbox className="mx-auto mb-3 h-8 w-8 text-ink-faint" />
      <h3 className="text-base font-bold text-navy">Sem cursos ativos</h3>
      <p className="mt-1 text-sm text-ink-muted">
        Inscreve-te num curso do catálogo para começar.
      </p>
      <Link
        href={`/${tenantSlug}/catalog`}
        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-navy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-navy/90"
      >
        Explorar catálogo
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
