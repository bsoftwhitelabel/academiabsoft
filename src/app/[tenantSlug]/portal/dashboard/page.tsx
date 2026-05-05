import Link from "next/link";
import {
  CheckCircle2,
  Timer,
  Award,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActiveSessionBanner } from "@/components/trainee/active-session-banner";
import { CourseProgressCard } from "@/components/trainee/course-progress-card";
import { ActivityTimeline } from "@/components/trainee/activity-timeline";
import { MilestoneCard } from "@/components/trainee/milestone-card";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  MOCK_TRAINEE,
  MOCK_ACTIVE_SESSION,
  MOCK_TRAINEE_COURSES,
  MOCK_ACTIVITIES,
  MOCK_MILESTONE,
  type ActiveSession,
  type ActivityItem,
  type TraineeActiveCourse,
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
  // No redirect — middleware already enforces. If session is missing for any
  // reason, fall back to demo data so the page is never blank.

  const greetingName = session
    ? session.fullName.split(" ")[0]
    : MOCK_TRAINEE.preferredName;

  // Try to load real data only if there's a session
  let realData: {
    completedActions: number;
    certificatesCount: number;
    totalAttendedHours: number;
    activeSession: ActiveSession | null;
    activeCourses: TraineeActiveCourse[];
    activities: ActivityItem[];
  } | null = null;

  if (session) {
    realData = await loadTraineeData(session.userId, params.tenantSlug);
  }

  // Decide: real data when present, mock as fallback for empty sections
  const completedActions = realData?.completedActions ?? 4;
  const certificatesCount = realData?.certificatesCount ?? 3;
  const totalAttendedHours = realData?.totalAttendedHours ?? 125;

  const activeSession =
    realData?.activeSession ?? MOCK_ACTIVE_SESSION;

  const activeCourses =
    realData && realData.activeCourses.length > 0
      ? realData.activeCourses
      : MOCK_TRAINEE_COURSES;

  const activities =
    realData && realData.activities.length > 0
      ? realData.activities
      : MOCK_ACTIVITIES;

  const isUsingDemoData =
    !realData ||
    (realData.activeCourses.length === 0 && realData.completedActions === 0);

  // Milestone progressive
  const nextMilestoneTarget =
    totalAttendedHours < 50
      ? 50
      : totalAttendedHours < 100
      ? 100
      : totalAttendedHours < 250
      ? 250
      : 500;
  const milestoneLevel = isUsingDemoData
    ? MOCK_MILESTONE.level
    : totalAttendedHours >= 250
    ? "Master"
    : totalAttendedHours >= 100
    ? "Avançado"
    : totalAttendedHours >= 50
    ? "Intermédio"
    : "Iniciado";
  const milestoneDescription = isUsingDemoData
    ? MOCK_MILESTONE.description
    : `A caminho do nível ${
        milestoneLevel === "Master" ? "Master" : "seguinte"
      }`;
  const milestoneCurrent = isUsingDemoData
    ? MOCK_MILESTONE.currentHours
    : Math.round(totalAttendedHours);
  const milestoneTarget = isUsingDemoData
    ? MOCK_MILESTONE.targetHours
    : nextMilestoneTarget;

  return (
    <DashboardShell hasBottomNav>
      {/* welcome */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-h1 font-bold tracking-tight text-navy">
          Olá, {greetingName}!
        </h1>
        <p className="mt-1 text-body-lg text-ink-muted">
          Bem-vindo ao seu painel. Confira suas atividades para hoje.
        </p>
        {isUsingDemoData && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-700 ring-1 ring-gold/20">
            <Sparkles className="h-3 w-3" strokeWidth={2.75} />
            Conteúdo demo · serão substituídos pelos teus dados reais
          </span>
        )}
      </div>

      {/* active session hero */}
      <div className="mb-6 md:mb-8">
        <ActiveSessionBanner
          session={activeSession}
          checkInHref={`/${params.tenantSlug}/portal/sessions/${activeSession.id}/checkin`}
        />
      </div>

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
            <h2 className="text-h2 font-bold text-navy">Meus Cursos Ativos</h2>
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {activeCourses.slice(0, 4).map((course) => (
            <CourseProgressCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* secondary row: activities + milestone */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <header className="mb-6 flex items-center justify-between">
            <h3 className="text-h3 font-bold text-navy">Atividades Recentes</h3>
            <Link
              href={`/${params.tenantSlug}/portal/history`}
              className="text-xs font-semibold text-blue-600 hover:text-navy"
            >
              Histórico completo
            </Link>
          </header>
          <ActivityTimeline activities={activities} />
        </div>
        <MilestoneCard
          level={milestoneLevel}
          description={milestoneDescription}
          currentHours={milestoneCurrent}
          targetHours={milestoneTarget}
        />
      </div>
    </DashboardShell>
  );
}

// ─── Real data loader ──────────────────────────────────────────────────────

async function loadTraineeData(userId: string, tenantSlug: string) {
  const trainee = await prisma.trainee.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!trainee) {
    return {
      completedActions: 0,
      certificatesCount: 0,
      totalAttendedHours: 0,
      activeSession: null,
      activeCourses: [],
      activities: [],
    };
  }

  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
  const last48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  const [
    activeSessionRow,
    enrollments,
    completedActions,
    certificatesCount,
    presentAttendances,
    recentAttendances,
    recentCertificates,
  ] = await Promise.all([
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
    prisma.enrollment.count({
      where: {
        traineeId: trainee.id,
        trainingAction: { status: "COMPLETED" },
      },
    }),
    prisma.certificate.count({ where: { traineeId: trainee.id } }),
    prisma.attendance.findMany({
      where: {
        traineeId: trainee.id,
        status: { in: ["PRESENT", "CHECKED_IN", "MANUAL_PRESENT"] },
      },
      select: {
        session: { select: { scheduledStart: true, scheduledEnd: true } },
      },
    }),
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

  const totalAttendedHours = presentAttendances.reduce((acc, a) => {
    const ms =
      a.session.scheduledEnd.getTime() - a.session.scheduledStart.getTime();
    return acc + ms / (60 * 60 * 1000);
  }, 0);

  const activeSession: ActiveSession | null = activeSessionRow
    ? {
        id: activeSessionRow.id,
        trainingActionId: activeSessionRow.trainingActionId,
        courseName: activeSessionRow.trainingAction.course.name,
        courseSlug: activeSessionRow.trainingAction.course.slug,
        scheduledStart: fmtTime(activeSessionRow.scheduledStart),
        scheduledEnd: fmtTime(activeSessionRow.scheduledEnd),
        dateLabel: fmtDateLong(activeSessionRow.scheduledStart),
        modality: activeSessionRow.trainingAction.modality,
        location:
          [
            activeSessionRow.trainingAction.location,
            activeSessionRow.trainingAction.room,
          ]
            .filter(Boolean)
            .join(" · ") || "Sem local",
        trainerName:
          activeSessionRow.trainingAction.trainers.find((t) => t.isPrimary)
            ?.trainer.user.fullName ??
          activeSessionRow.trainingAction.trainers[0]?.trainer.user.fullName ??
          "Formador",
        isLive:
          activeSessionRow.scheduledStart <= now &&
          activeSessionRow.scheduledEnd >= now,
      }
    : null;

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
      group: `Turma ${ta.code}`,
      progress,
      imageUrl: ta.course.coverImageUrl ?? FALLBACK_COURSE_COVER,
      sessionsAttended: closedCount,
      sessionsTotal: ta._count.sessions,
      nextSessionLabel: next
        ? `${fmtDateLong(next.scheduledStart)} · ${fmtTime(next.scheduledStart)}`
        : "Sem próxima sessão",
      href: next
        ? `/${tenantSlug}/portal/sessions/${next.id}/checkin`
        : `/${tenantSlug}/portal/courses`,
    };
  });

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

  return {
    completedActions,
    certificatesCount,
    totalAttendedHours,
    activeSession,
    activeCourses,
    activities: activities.slice(0, 6),
  };
}
