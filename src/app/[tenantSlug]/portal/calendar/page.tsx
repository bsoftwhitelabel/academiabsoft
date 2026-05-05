import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock4,
  MapPin,
  Activity,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { SessionRequired } from "@/components/dashboard/session-required";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn, formatTime } from "@/lib/utils";

export const metadata = { title: "Calendário" };

type Props = {
  params: { tenantSlug: string };
  searchParams: { month?: string; year?: string };
};

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export default async function PortalCalendarPage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session) {
    return <SessionRequired tenantSlug={params.tenantSlug} title="Calendário" hasBottomNav />;
  }

  const trainee = await prisma.trainee.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!trainee) {
    return (
      <DashboardShell hasBottomNav>
        <PageHeader title="Calendário" />
        <p className="text-sm text-ink-muted">Perfil de formando não encontrado.</p>
      </DashboardShell>
    );
  }

  const today = new Date();
  const year = Number(searchParams.year ?? today.getFullYear());
  const month = Number(searchParams.month ?? today.getMonth() + 1) - 1; // 0-indexed
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);

  const sessions = await prisma.session.findMany({
    where: {
      scheduledStart: { gte: monthStart, lte: monthEnd },
      trainingAction: {
        enrollments: { some: { traineeId: trainee.id } },
      },
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
  });

  // group sessions by date (yyyy-mm-dd)
  const sessionsByDate = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const key = ymd(new Date(s.scheduledStart));
    const arr = sessionsByDate.get(key) ?? [];
    arr.push(s);
    sessionsByDate.set(key, arr);
  }

  // build calendar grid: 6 weeks × 7 days
  const days = buildCalendarDays(year, month);

  // upcoming sessions list (next 7)
  const upcoming = await prisma.session.findMany({
    where: {
      scheduledStart: { gte: today },
      trainingAction: {
        enrollments: { some: { traineeId: trainee.id } },
      },
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
  });

  return (
    <DashboardShell hasBottomNav>
      <PageHeader
        breadcrumb={[{ label: "Calendário" }]}
        title="Calendário"
        description={`${sessions.length} sessões em ${MONTH_NAMES[month]} ${year}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* calendar */}
        <div className="rounded-xl border border-border bg-card p-5 md:p-6">
          {/* nav */}
          <header className="mb-5 flex items-center justify-between">
            <Link
              href={`/${params.tenantSlug}/portal/calendar?month=${prevMonth.getMonth() + 1}&year=${prevMonth.getFullYear()}`}
              className="grid h-9 w-9 place-items-center rounded-md border border-border text-ink-muted transition-colors hover:bg-surface-low hover:text-navy"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <h2 className="text-h2 font-bold text-navy tabular-nums">
              {MONTH_NAMES[month]} {year}
            </h2>
            <Link
              href={`/${params.tenantSlug}/portal/calendar?month=${nextMonth.getMonth() + 1}&year=${nextMonth.getFullYear()}`}
              className="grid h-9 w-9 place-items-center rounded-md border border-border text-ink-muted transition-colors hover:bg-surface-low hover:text-navy"
              aria-label="Mês seguinte"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </header>

          {/* grid header */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-ink-subtle"
              >
                {w}
              </div>
            ))}
          </div>

          {/* grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => {
              const dateKey = ymd(day.date);
              const daySessions = sessionsByDate.get(dateKey) ?? [];
              const isToday = ymd(today) === dateKey;
              const isOtherMonth = day.date.getMonth() !== month;
              return (
                <div
                  key={i}
                  className={cn(
                    "aspect-square flex flex-col gap-1 rounded-lg border p-1.5 text-xs",
                    isToday
                      ? "border-emerald-400 bg-emerald-50/60 ring-2 ring-emerald-200"
                      : isOtherMonth
                      ? "border-border/40 bg-surface-low/30"
                      : "border-border bg-card hover:bg-surface-low/40"
                  )}
                >
                  <div
                    className={cn(
                      "text-[11px] font-bold tabular-nums",
                      isToday
                        ? "text-emerald-700"
                        : isOtherMonth
                        ? "text-ink-faint"
                        : "text-navy"
                    )}
                  >
                    {day.date.getDate()}
                  </div>
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {daySessions.slice(0, 3).map((s) => (
                      <Link
                        key={s.id}
                        href={`/${params.tenantSlug}/portal/sessions/${s.id}/checkin`}
                        className={cn(
                          "block truncate rounded px-1 py-0.5 text-[9px] font-bold transition-opacity hover:opacity-85",
                          s.status === "IN_PROGRESS"
                            ? "bg-emerald-500 text-white"
                            : s.status === "CLOSED"
                            ? "bg-navy/15 text-navy"
                            : "bg-gold/15 text-gold-700"
                        )}
                        title={s.trainingAction.course.name}
                      >
                        {formatTime(s.scheduledStart)} {s.trainingAction.course.code}
                      </Link>
                    ))}
                    {daySessions.length > 3 && (
                      <div className="truncate text-[9px] font-medium text-ink-subtle">
                        +{daySessions.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* legend */}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-xs text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              Em curso
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-gold/40" />
              Agendada
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-navy/15" />
              Concluída
            </span>
          </div>
        </div>

        {/* sidebar: upcoming */}
        <aside>
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-h3 font-bold text-navy">Próximas sessões</h3>
            {upcoming.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-surface-low/40 p-4 text-center text-xs text-ink-muted">
                Sem sessões agendadas
              </p>
            ) : (
              <ol className="space-y-3">
                {upcoming.map((s) => {
                  const isToday = ymd(new Date(s.scheduledStart)) === ymd(today);
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/${params.tenantSlug}/portal/sessions/${s.id}/checkin`}
                        className="flex items-start gap-3 rounded-lg border border-border bg-surface-low/30 p-3 transition-colors hover:border-navy/30 hover:bg-surface-low"
                      >
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-card text-blue-600 ring-1 ring-blue-200/60">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 text-xs font-bold text-navy">
                            {s.trainingAction.course.name}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[10px] text-ink-muted">
                            <span className="inline-flex items-center gap-1">
                              <Clock4 className="h-3 w-3" />
                              {formatTime(s.scheduledStart)}
                            </span>
                            {s.trainingAction.entity?.name && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {s.trainingAction.entity.name}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-ink-subtle">
                            {s.trainingAction.code} · sessão {s.number}
                          </p>
                        </div>
                        {isToday && (
                          <span className="shrink-0 rounded-full bg-gold/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold-700">
                            Hoje
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
            <h4 className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold text-blue-800">
              <CalendarDays className="h-3.5 w-3.5" />
              Sincronizar com Google/Outlook
            </h4>
            <p className="text-xs leading-relaxed text-ink-muted">
              Em breve · subscreve as tuas sessões via .ics no calendário pessoal.
            </p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  // weekday Mon=0 .. Sun=6 (Portuguese week)
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - offset);
  const days: { date: Date }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({ date: d });
  }
  return days;
}
