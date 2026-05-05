import { SessionRequired } from "@/components/dashboard/session-required";
import {
  History,
  Activity,
  CheckCircle2,
  Clock4,
  XCircle,
  PenLine,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn, formatTime } from "@/lib/utils";

export const metadata = { title: "Histórico" };

type Props = { params: { tenantSlug: string } };

export default async function PortalHistoryPage({ params }: Props) {
  const session = await getSession();
  if (!session) {
    return <SessionRequired tenantSlug={params.tenantSlug} title="Histórico" hasBottomNav />;
  }

  const trainee = await prisma.trainee.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!trainee) {
    return (
      <DashboardShell hasBottomNav>
        <PageHeader title="Histórico" />
        <p className="text-sm text-ink-muted">
          Perfil de formando não encontrado.
        </p>
      </DashboardShell>
    );
  }

  const attendances = await prisma.attendance.findMany({
    where: { traineeId: trainee.id },
    include: {
      session: {
        include: {
          trainingAction: {
            include: {
              course: { select: { name: true, code: true } },
              entity: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const presentCount = attendances.filter(
    (a) =>
      a.status === "PRESENT" ||
      a.status === "CHECKED_IN" ||
      a.status === "MANUAL_PRESENT"
  ).length;
  const signedCount = attendances.filter(
    (a) => a.signatureState === "SIGNED"
  ).length;
  const earlyLeaveCount = attendances.filter(
    (a) => a.status === "EARLY_LEAVE"
  ).length;

  // Group by month
  const groups = new Map<string, typeof attendances>();
  for (const a of attendances) {
    const date = new Date(a.session.scheduledStart);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const arr = groups.get(key) ?? [];
    arr.push(a);
    groups.set(key, arr);
  }

  const sortedGroups = Array.from(groups.entries()).sort((a, b) =>
    b[0].localeCompare(a[0])
  );

  return (
    <DashboardShell hasBottomNav>
      <PageHeader
        breadcrumb={[{ label: "Histórico" }]}
        title="Histórico de presenças"
        description={`${attendances.length} sessões registadas · ordenadas por data`}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={String(attendances.length)} icon={Activity} variant="blue" />
        <StatCard label="Presenças" value={String(presentCount)} icon={CheckCircle2} variant="emerald" />
        <StatCard label="Assinadas" value={String(signedCount)} icon={PenLine} variant="gold" />
        <StatCard label="Saídas antecipadas" value={String(earlyLeaveCount)} icon={Clock4} variant="purple" />
      </div>

      {attendances.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-low/40 px-8 py-16 text-center">
          <History className="mx-auto mb-4 h-10 w-10 text-ink-faint" />
          <h3 className="text-base font-bold text-navy">Sem histórico ainda</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Quando assistires à primeira sessão, ficará aqui registada.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedGroups.map(([key, items]) => {
            const [y, m] = key.split("-");
            const monthName = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(
              "pt-PT",
              { month: "long", year: "numeric" }
            );
            return (
              <section
                key={key}
                className="overflow-hidden rounded-2xl border border-border bg-card"
              >
                <header className="border-b border-border bg-surface-low/30 px-6 py-3">
                  <h2 className="text-sm font-bold capitalize text-navy">
                    {monthName} · {items.length} sessões
                  </h2>
                </header>
                <ol className="divide-y divide-border">
                  {items.map((a) => (
                    <AttendanceRow key={a.id} attendance={a} />
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}

type Attendance = Awaited<
  ReturnType<typeof prisma.attendance.findMany>
>[number] & {
  session: {
    scheduledStart: Date;
    scheduledEnd: Date;
    number: number;
    trainingAction: {
      code: string;
      course: { name: string; code: string };
      entity: { name: string } | null;
    };
  };
};

function AttendanceRow({ attendance }: { attendance: Attendance }) {
  const date = new Date(attendance.session.scheduledStart);
  const ta = attendance.session.trainingAction;

  let statusLabel = "—";
  let statusIcon = Activity;
  let statusCls = "bg-slate-100 text-slate-600";
  if (
    attendance.status === "PRESENT" ||
    attendance.status === "CHECKED_IN" ||
    attendance.status === "MANUAL_PRESENT"
  ) {
    statusLabel = attendance.status === "MANUAL_PRESENT" ? "Manual" : "Presente";
    statusIcon = CheckCircle2;
    statusCls = "bg-emerald-50 text-emerald-700";
  } else if (attendance.status === "EARLY_LEAVE") {
    statusLabel = "Saída antecipada";
    statusIcon = Clock4;
    statusCls = "bg-amber-50 text-amber-700";
  } else if (attendance.status === "ABSENT") {
    statusLabel = "Ausente";
    statusIcon = XCircle;
    statusCls = "bg-red-50 text-red-700";
  } else if (attendance.status === "PENDING") {
    statusLabel = "Pendente";
    statusCls = "bg-slate-100 text-slate-600";
  }

  const StatusIcon = statusIcon;

  return (
    <li className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-surface-low/30">
      {/* date column */}
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-navy/8 text-center">
        <div>
          <div className="text-base font-bold tabular-nums text-navy">
            {date.getDate()}
          </div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-ink-subtle">
            {date.toLocaleDateString("pt-PT", { month: "short" })}
          </div>
        </div>
      </div>

      {/* main */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-bold text-navy">
          {ta.course.name}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <Clock4 className="h-3 w-3" />
            {formatTime(attendance.session.scheduledStart)}–
            {formatTime(attendance.session.scheduledEnd)}
          </span>
          {ta.entity?.name && <span>· {ta.entity.name}</span>}
          <span>·</span>
          <span className="font-mono text-[10px] uppercase tracking-wider">
            {ta.code} · sessão {attendance.session.number}
          </span>
        </div>
      </div>

      {/* status */}
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            statusCls
          )}
        >
          <StatusIcon className="h-3 w-3" strokeWidth={2.5} />
          {statusLabel}
        </span>
        {attendance.signatureState === "SIGNED" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold-700">
            <PenLine className="h-3 w-3" strokeWidth={2.5} />
            Assinada
          </span>
        )}
      </div>
    </li>
  );
}
