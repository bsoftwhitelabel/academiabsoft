import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock4,
  MapPin,
  Activity,
  Sparkles,
  Bell,
  TrendingUp,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
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

// ─── Demo events ────────────────────────────────────────────────────────

type CalSession = {
  id: string;
  number: number;
  status: "UPCOMING" | "OPEN_CHECKIN" | "IN_PROGRESS" | "CLOSED";
  scheduledStart: Date;
  scheduledEnd: Date;
  trainingAction: {
    code: string;
    location: string | null;
    course: { name: string; code: string };
    entity: { name: string } | null;
  };
};

function buildDemoSessions(year: number, month: number): CalSession[] {
  const today = new Date();
  const baseY = year;
  const baseM = month;
  const mk = (
    day: number,
    hour: number,
    durationH: number,
    courseName: string,
    courseCode: string,
    taCode: string,
    location: string,
    entity: string,
    sessionNumber: number,
    status: CalSession["status"]
  ): CalSession => {
    const start = new Date(baseY, baseM, day, hour, 0);
    const end = new Date(baseY, baseM, day, hour + durationH, 0);
    return {
      id: `demo-${courseCode}-${day}-${hour}`,
      number: sessionNumber,
      status,
      scheduledStart: start,
      scheduledEnd: end,
      trainingAction: {
        code: taCode,
        location,
        course: { name: courseName, code: courseCode },
        entity: { name: entity },
      },
    };
  };

  const todayDay = today.getMonth() === baseM ? today.getDate() : 15;

  return [
    mk(Math.max(1, todayDay - 14), 18, 4, "Segurança e Higiene no Trabalho", "SHT", "T2026-SHT-01", "Porto · Sala BV Areosa", "Decathlon", 1, "CLOSED"),
    mk(Math.max(1, todayDay - 7), 18, 4, "Segurança e Higiene no Trabalho", "SHT", "T2026-SHT-01", "Porto · Sala BV Areosa", "Decathlon", 2, "CLOSED"),
    mk(todayDay, 18, 4, "Segurança e Higiene no Trabalho", "SHT", "T2026-SHT-01", "Porto · Sala BV Areosa", "Decathlon", 3, "IN_PROGRESS"),
    mk(Math.min(28, todayDay + 7), 18, 4, "Segurança e Higiene no Trabalho", "SHT", "T2026-SHT-01", "Porto · Sala BV Areosa", "Decathlon", 4, "UPCOMING"),
    mk(Math.min(28, todayDay + 14), 18, 4, "Segurança e Higiene no Trabalho", "SHT", "T2026-SHT-01", "Porto · Sala BV Areosa", "Decathlon", 5, "UPCOMING"),
    mk(Math.max(2, todayDay - 4), 19, 1, "Inglês Técnico para Logística", "ING", "T2026-ING-12", "Online · Microsoft Teams", "Decathlon", 4, "CLOSED"),
    mk(Math.min(28, todayDay + 2), 19, 1, "Inglês Técnico para Logística", "ING", "T2026-ING-12", "Online · Microsoft Teams", "Decathlon", 5, "UPCOMING"),
    mk(Math.min(28, todayDay + 5), 14, 3, "Microsoft Excel Intermédio", "EXC-INT", "T2026-EXC-04", "Lisboa · Hub Criativo", "Decathlon", 1, "UPCOMING"),
  ];
}

export default async function PortalCalendarPage({ params, searchParams }: Props) {
  const session = await getSession();

  // No early bail — page always renders with demo fallback when no session.
  const trainee = session
    ? await prisma.trainee.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      })
    : null;

  const today = new Date();
  const year = Number(searchParams.year ?? today.getFullYear());
  const month = Number(searchParams.month ?? today.getMonth() + 1) - 1;
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);

  // Real sessions in this month
  const realSessions = trainee
    ? await prisma.session.findMany({
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
      })
    : [];

  // Real upcoming next 7
  const realUpcoming = trainee
    ? await prisma.session.findMany({
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
      })
    : [];

  const isUsingDemoData = realSessions.length === 0;
  const sessions: CalSession[] = isUsingDemoData
    ? buildDemoSessions(year, month)
    : (realSessions as unknown as CalSession[]);
  const upcoming: CalSession[] = isUsingDemoData
    ? buildDemoSessions(today.getFullYear(), today.getMonth())
        .filter((s) => s.scheduledStart >= today)
        .slice(0, 5)
    : (realUpcoming as unknown as CalSession[]);

  const sessionsByDate = new Map<string, CalSession[]>();
  for (const s of sessions) {
    const key = ymd(new Date(s.scheduledStart));
    const arr = sessionsByDate.get(key) ?? [];
    arr.push(s);
    sessionsByDate.set(key, arr);
  }

  const days = buildCalendarDays(year, month);

  // Stats
  const totalThisMonth = sessions.length;
  const closedThisMonth = sessions.filter((s) => s.status === "CLOSED").length;
  const upcomingThisMonth = sessions.filter(
    (s) => s.scheduledStart >= today && s.status !== "CLOSED"
  ).length;
  const totalHoursThisMonth = sessions.reduce((acc, s) => {
    const hrs =
      (new Date(s.scheduledEnd).getTime() -
        new Date(s.scheduledStart).getTime()) /
      (60 * 60 * 1000);
    return acc + hrs;
  }, 0);

  // Today's sessions
  const todaySessions = sessions.filter(
    (s) => ymd(new Date(s.scheduledStart)) === ymd(today)
  );

  return (
    <DashboardShell hasBottomNav>
      <PageHeader
        breadcrumb={[{ label: "Calendário" }]}
        title="Calendário"
        description={`${MONTH_NAMES[month]} ${year} · ${totalThisMonth} sessão${totalThisMonth !== 1 ? "es" : ""}`}
      />

      {isUsingDemoData && (
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-700 ring-1 ring-gold/20">
          <Sparkles className="h-3 w-3" strokeWidth={2.75} />
          Conteúdo demo · serão substituídos pelas tuas sessões reais
        </div>
      )}

      {/* Stats strip */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Sessões mês"
          value={String(totalThisMonth)}
          icon={CalendarDays}
          variant="blue"
        />
        <StatCard
          label="Já realizadas"
          value={String(closedThisMonth)}
          icon={Activity}
          variant="emerald"
        />
        <StatCard
          label="Agendadas"
          value={String(upcomingThisMonth)}
          icon={Clock4}
          variant="gold"
        />
        <StatCard
          label="Horas totais"
          value={`${Math.round(totalHoursThisMonth)}h`}
          icon={TrendingUp}
          variant="purple"
        />
      </div>

      {/* Today highlight */}
      {todaySessions.length > 0 && (
        <section className="mb-6 rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 p-5 ring-1 ring-emerald-200/50">
          <header className="mb-3 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-700">
              Hoje · {todaySessions.length} sessão{todaySessions.length !== 1 ? "es" : ""}
            </h2>
          </header>
          <div className="space-y-2">
            {todaySessions.map((s) => (
              <Link
                key={s.id}
                href={`/${params.tenantSlug}/portal/sessions/${s.id}/checkin`}
                className="flex items-center justify-between gap-3 rounded-lg bg-card p-3 transition-colors hover:bg-emerald-50"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Clock4 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy">
                      {s.trainingAction.course.name}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {formatTime(s.scheduledStart)}–{formatTime(s.scheduledEnd)} ·{" "}
                      {s.trainingAction.location ?? "Sem local"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-ink-subtle" />
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Calendar grid */}
        <div className="rounded-xl border border-border bg-card p-5 md:p-6">
          <header className="mb-5 flex items-center justify-between">
            <Link
              href={`/${params.tenantSlug}/portal/calendar?month=${prevMonth.getMonth() + 1}&year=${prevMonth.getFullYear()}`}
              className="grid h-9 w-9 place-items-center rounded-md border border-border text-ink-muted transition-colors hover:bg-surface-low hover:text-navy"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <div className="text-center">
              <h2 className="text-h2 font-bold text-navy tabular-nums">
                {MONTH_NAMES[month]} {year}
              </h2>
              {(year !== today.getFullYear() ||
                month !== today.getMonth()) && (
                <Link
                  href={`/${params.tenantSlug}/portal/calendar`}
                  className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:text-navy"
                >
                  Ir para hoje
                </Link>
              )}
            </div>
            <Link
              href={`/${params.tenantSlug}/portal/calendar?month=${nextMonth.getMonth() + 1}&year=${nextMonth.getFullYear()}`}
              className="grid h-9 w-9 place-items-center rounded-md border border-border text-ink-muted transition-colors hover:bg-surface-low hover:text-navy"
              aria-label="Mês seguinte"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          </header>

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

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 inline-flex items-center gap-1.5 text-h3 font-bold text-navy">
              <Bell className="h-4 w-4 text-gold" />
              Próximas sessões
            </h3>
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

          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
            <h4 className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold text-blue-800">
              <CalendarDays className="h-3.5 w-3.5" />
              Sincronizar com calendário
            </h4>
            <p className="text-xs leading-relaxed text-ink-muted">
              Em breve · subscreve as tuas sessões via .ics no Google Calendar,
              Outlook ou Apple Calendar.
            </p>
          </div>

          <Link
            href={`/${params.tenantSlug}/portal/courses`}
            className="block rounded-xl border border-border bg-card p-4 transition-colors hover:bg-surface-low/30"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
              Atalho
            </p>
            <p className="mt-1 text-sm font-bold text-navy">
              Ver os meus cursos →
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Acede aos detalhes de cada inscrição.
            </p>
          </Link>
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
