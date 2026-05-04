import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  Users,
  MapPin,
  GraduationCap,
  ChevronRight,
  Activity,
  CheckCircle2,
  Clock4,
  PauseCircle,
  ListFilter,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn, formatDate } from "@/lib/utils";
import type { TrainingActionStatus } from "@prisma/client";

export const metadata = { title: "Sessões" };

type Props = { params: { tenantSlug: string } };

const STATUS_LABEL: Record<TrainingActionStatus, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendada",
  IN_PROGRESS: "Em curso",
  COMPLETED: "Concluída",
  ARCHIVED: "Arquivada",
  CANCELLED: "Cancelada",
};

const STATUS_STYLES: Record<TrainingActionStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-700 ring-slate-200/60",
  SCHEDULED: "bg-blue-50 text-blue-700 ring-blue-200/60",
  IN_PROGRESS: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  COMPLETED: "bg-navy/8 text-navy ring-navy/15",
  ARCHIVED: "bg-slate-50 text-slate-500 ring-slate-200/40",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200/60",
};

export default async function TrainerSessionsPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  // Fetch turmas. Trainers see only their own; admins/owners see all.
  const turmas = await prisma.trainingAction.findMany({
    where: {
      tenantId: session.tenantId,
      ...(session.role === "TRAINER"
        ? {
            trainers: {
              some: { trainer: { userId: session.userId } },
            },
          }
        : {}),
    },
    include: {
      course: { select: { name: true, code: true, durationHours: true } },
      entity: { select: { name: true } },
      sessions: {
        orderBy: { number: "asc" },
        select: { id: true, number: true, status: true, scheduledStart: true },
      },
      _count: { select: { enrollments: true, sessions: true } },
    },
    orderBy: [{ status: "asc" }, { startDate: "desc" }],
  });

  // Aggregate metrics
  const metrics = {
    total: turmas.length,
    inProgress: turmas.filter((t) => t.status === "IN_PROGRESS").length,
    scheduled: turmas.filter((t) => t.status === "SCHEDULED").length,
    completed: turmas.filter((t) => t.status === "COMPLETED").length,
  };

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[{ label: "Training Actions" }]}
        title="Sessões"
        description={
          session.role === "TRAINER"
            ? `As suas turmas ativas e agendadas · ${turmas.length} no total`
            : `Todas as turmas do tenant · ${turmas.length} no total`
        }
        actions={
          <>
            <Button
              variant="outline"
              className="h-10 gap-1.5 border-border bg-card text-navy hover:bg-surface-low"
            >
              <ListFilter className="h-4 w-4" />
              Filtros
            </Button>
            <Button className="h-10 gap-1.5 bg-navy text-white hover:bg-navy/90">
              <CalendarDays className="h-4 w-4" />
              Calendário
            </Button>
          </>
        }
      />

      {/* KPI strip */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total turmas" value={String(metrics.total)} icon={Activity} variant="blue" />
        <StatCard label="Em curso" value={String(metrics.inProgress)} icon={Clock4} variant="emerald" />
        <StatCard label="Agendadas" value={String(metrics.scheduled)} icon={CalendarDays} variant="gold" />
        <StatCard label="Concluídas" value={String(metrics.completed)} icon={CheckCircle2} variant="purple" />
      </div>

      {turmas.length === 0 ? (
        <EmptyState role={session.role} />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {turmas.map((turma) => (
            <TurmaCard
              key={turma.id}
              turma={turma}
              tenantSlug={params.tenantSlug}
            />
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

type TurmaWithRelations = Awaited<
  ReturnType<typeof prisma.trainingAction.findMany>
>[number] & {
  course: { name: string; code: string; durationHours: number };
  entity: { name: string } | null;
  sessions: Array<{
    id: string;
    number: number;
    status: string;
    scheduledStart: Date;
  }>;
  _count: { enrollments: number; sessions: number };
};

function TurmaCard({
  turma,
  tenantSlug,
}: {
  turma: TurmaWithRelations;
  tenantSlug: string;
}) {
  // Determine which session to deep-link to:
  // 1. The IN_PROGRESS one if exists, else
  // 2. The next UPCOMING one, else
  // 3. The last CLOSED one, else
  // 4. The first session.
  const inProgress = turma.sessions.find((s) => s.status === "IN_PROGRESS");
  const upcoming = turma.sessions.find((s) => s.status === "UPCOMING");
  const last = [...turma.sessions]
    .reverse()
    .find((s) => s.status === "CLOSED");
  const targetSession = inProgress ?? upcoming ?? last ?? turma.sessions[0];

  const completedSessions = turma.sessions.filter(
    (s) => s.status === "CLOSED"
  ).length;
  const progressPct =
    turma._count.sessions > 0
      ? Math.round((completedSessions / turma._count.sessions) * 100)
      : 0;

  const isLive = turma.status === "IN_PROGRESS";

  return (
    <article
      className={cn(
        "group flex flex-col rounded-2xl border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-card-hover",
        isLive
          ? "border-emerald-300/60 ring-1 ring-emerald-200/50"
          : "border-border"
      )}
    >
      {/* top row: code + status */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-lg ring-1",
              isLive
                ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
                : "bg-navy/8 text-navy ring-navy/15"
            )}
          >
            {isLive ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
            ) : (
              <GraduationCap className="h-5 w-5" strokeWidth={2} />
            )}
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink-subtle">
              {turma.code} · {turma.course.code}
            </p>
            <h3 className="mt-0.5 line-clamp-1 text-base font-bold leading-tight text-navy">
              {turma.course.name}
            </h3>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1",
            STATUS_STYLES[turma.status]
          )}
        >
          {STATUS_LABEL[turma.status]}
        </span>
      </div>

      {/* meta row */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {formatDate(turma.startDate)} → {formatDate(turma.endDate)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock4 className="h-3.5 w-3.5" />
          {turma.durationHours}h
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          {turma._count.enrollments} formandos
        </span>
      </div>

      {/* entity + location */}
      {(turma.entity || turma.location) && (
        <div className="mb-4 flex flex-wrap items-start gap-x-4 gap-y-1.5 rounded-lg bg-surface-low/50 px-3 py-2 text-xs">
          {turma.entity && (
            <span className="inline-flex items-center gap-1.5 font-semibold text-navy">
              <PauseCircle className="h-3.5 w-3.5" />
              {turma.entity.name}
            </span>
          )}
          {turma.location && (
            <span className="inline-flex items-center gap-1.5 text-ink-muted">
              <MapPin className="h-3.5 w-3.5" />
              {turma.location}
            </span>
          )}
        </div>
      )}

      {/* progress bar */}
      <div className="mb-5">
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold">
          <span className="text-ink-muted">
            Sessões · {completedSessions}/{turma._count.sessions}
            {inProgress && (
              <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                Sessão {inProgress.number} ao vivo
              </span>
            )}
          </span>
          <span className="text-navy tabular-nums">{progressPct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-mid">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isLive ? "bg-emerald-500" : "bg-gold"
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
          {turma.modality === "PRESENCIAL"
            ? "Presencial"
            : turma.modality === "ELEARNING"
            ? "E-learning"
            : "Híbrido"}
        </div>
        {targetSession ? (
          <Link
            href={`/${tenantSlug}/trainer/sessions/${targetSession.id}/attendance`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-navy/90"
          >
            {isLive ? "Abrir presenças" : "Ver sessões"}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="text-xs text-ink-subtle">Sem sessões</span>
        )}
      </div>
    </article>
  );
}

function EmptyState({ role }: { role: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-low/40 px-8 py-20 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-card text-ink-muted ring-1 ring-border">
        <Activity className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-navy">
        {role === "TRAINER" ? "Sem turmas atribuídas" : "Nenhuma turma criada"}
      </h3>
      <p className="mt-1 max-w-md text-sm text-ink-muted">
        {role === "TRAINER"
          ? "Quando o administrador te associar a uma turma, ela aparecerá aqui."
          : "Cria a primeira turma a partir do módulo de Cursos."}
      </p>
    </div>
  );
}
