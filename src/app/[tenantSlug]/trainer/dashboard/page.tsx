import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  Users,
  Clock4,
  CheckCircle2,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn, formatDate, formatTime } from "@/lib/utils";

export const metadata = { title: "Dashboard · Formador" };

type Props = { params: { tenantSlug: string } };

export default async function TrainerDashboardPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  const trainerProfile =
    session.role === "TRAINER"
      ? await prisma.trainer.findUnique({
          where: { userId: session.userId },
          select: { id: true },
        })
      : null;

  const trainerFilter = trainerProfile
    ? { trainers: { some: { trainerId: trainerProfile.id } } }
    : {};

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [
    todaySessions,
    weekSessions,
    activeTurmas,
    totalTrainees,
    upcomingSessions,
  ] = await Promise.all([
    prisma.session.findMany({
      where: {
        trainingAction: { tenantId: session.tenantId, ...trainerFilter },
        scheduledStart: { gte: today, lt: tomorrow },
      },
      include: {
        trainingAction: {
          include: {
            course: { select: { name: true, code: true } },
            entity: { select: { name: true } },
            _count: { select: { enrollments: true } },
          },
        },
        _count: { select: { attendances: true } },
      },
      orderBy: { scheduledStart: "asc" },
    }),
    prisma.session.count({
      where: {
        trainingAction: { tenantId: session.tenantId, ...trainerFilter },
        scheduledStart: { gte: today, lt: nextWeek },
      },
    }),
    prisma.trainingAction.count({
      where: {
        tenantId: session.tenantId,
        status: "IN_PROGRESS",
        ...trainerFilter,
      },
    }),
    prisma.enrollment.count({
      where: {
        trainingAction: { tenantId: session.tenantId, ...trainerFilter },
      },
    }),
    prisma.session.findMany({
      where: {
        trainingAction: { tenantId: session.tenantId, ...trainerFilter },
        scheduledStart: { gte: today },
      },
      include: {
        trainingAction: {
          include: {
            course: { select: { name: true, code: true } },
            entity: { select: { name: true } },
          },
        },
      },
      orderBy: { scheduledStart: "asc" },
      take: 5,
    }),
  ]);

  const firstName = session.fullName.split(" ")[0];
  const liveSession = todaySessions.find((s) => s.status === "IN_PROGRESS");

  return (
    <DashboardShell>
      <div className="mb-6 md:mb-8">
        <h1 className="text-h1 font-bold tracking-tight text-navy">
          Olá, {firstName}!
        </h1>
        <p className="mt-1 text-body-lg text-ink-muted">
          {todaySessions.length === 0
            ? "Sem sessões agendadas para hoje. Use o tempo para preparar materiais."
            : `${todaySessions.length} sessão${todaySessions.length > 1 ? "ões" : ""} agendada${todaySessions.length > 1 ? "s" : ""} para hoje.`}
        </p>
      </div>

      {/* Live session hero (if any) */}
      {liveSession && (
        <Link
          href={`/${params.tenantSlug}/trainer/sessions/${liveSession.id}/attendance`}
          className="mb-6 block overflow-hidden rounded-2xl bg-navy-radial p-6 text-white shadow-card-elevated transition-transform hover:scale-[1.005] md:mb-8 md:p-8"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
            Sessão ao vivo agora
          </div>
          <h2 className="text-balance text-2xl font-bold leading-tight md:text-[28px]">
            {liveSession.trainingAction.course.name}
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-surface-low/85">
            <span className="inline-flex items-center gap-1.5">
              <Clock4 className="h-4 w-4" />
              {formatTime(liveSession.scheduledStart)} – {formatTime(liveSession.scheduledEnd)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {liveSession.trainingAction._count.enrollments} formandos ·{" "}
              {liveSession._count.attendances} check-ins
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wider">
              {liveSession.trainingAction.code} · Sessão {liveSession.number}
            </span>
          </div>
          <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-bold text-navy shadow-lg shadow-gold/20">
            Abrir controlo de presenças
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          </div>
        </Link>
      )}

      {/* KPI strip */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Sessões hoje" value={String(todaySessions.length)} icon={Clock4} variant="emerald" />
        <StatCard label="Esta semana" value={String(weekSessions)} icon={CalendarDays} variant="blue" />
        <StatCard label="Turmas em curso" value={String(activeTurmas)} icon={Activity} variant="gold" />
        <StatCard label="Formandos sob tutela" value={String(totalTrainees)} icon={Users} variant="purple" />
      </div>

      {/* Upcoming sessions list */}
      <section className="rounded-xl border border-border bg-card p-6">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-h3 font-bold text-navy">Próximas sessões</h2>
            <p className="text-xs text-ink-subtle">
              {upcomingSessions.length} agendada
              {upcomingSessions.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href={`/${params.tenantSlug}/trainer/sessions`}
            className="text-xs font-bold text-blue-600 hover:text-navy"
          >
            Ver todas as turmas →
          </Link>
        </header>

        <ol className="space-y-3">
          {upcomingSessions.length === 0 ? (
            <li className="rounded-lg border border-dashed border-border bg-surface-low/40 p-8 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-ink-faint" />
              <p className="text-sm font-bold text-navy">
                Nenhuma sessão agendada
              </p>
              <p className="mt-1 text-xs text-ink-muted">
                Sessões futuras aparecem aqui automaticamente.
              </p>
            </li>
          ) : (
            upcomingSessions.map((s) => {
              const isToday = isSameDay(new Date(s.scheduledStart), new Date());
              const isLive = s.status === "IN_PROGRESS";
              return (
                <li key={s.id}>
                  <Link
                    href={`/${params.tenantSlug}/trainer/sessions/${s.id}/attendance`}
                    className={cn(
                      "group flex items-center gap-4 rounded-lg border p-4 transition-colors",
                      isLive
                        ? "border-emerald-300/60 bg-emerald-50/30 hover:bg-emerald-50/50"
                        : "border-border bg-surface-low/30 hover:bg-surface-low/60"
                    )}
                  >
                    <div
                      className={cn(
                        "grid h-12 w-12 shrink-0 place-items-center rounded-lg ring-1",
                        isLive
                          ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
                          : "bg-card text-navy ring-border"
                      )}
                    >
                      <span className="text-xs font-bold tabular-nums">
                        {formatTime(s.scheduledStart)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-bold text-navy">
                        {s.trainingAction.course.name}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {s.trainingAction.entity?.name ?? "—"} ·{" "}
                        <span className="font-mono">
                          {s.trainingAction.code}
                        </span>{" "}
                        · Sessão {s.number}
                      </p>
                    </div>
                    {isLive ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                        Ao vivo
                      </span>
                    ) : isToday ? (
                      <span className="shrink-0 rounded-full bg-gold/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-700">
                        Hoje
                      </span>
                    ) : (
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-ink-subtle">
                        {formatDate(s.scheduledStart)}
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-navy" />
                  </Link>
                </li>
              );
            })
          )}
        </ol>
      </section>
    </DashboardShell>
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
