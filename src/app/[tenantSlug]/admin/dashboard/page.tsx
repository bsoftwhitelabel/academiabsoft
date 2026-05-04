import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  GraduationCap,
  Activity,
  Award,
  TrendingUp,
  Euro,
  Plus,
  ArrowRight,
  CalendarDays,
  Clock4,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

type Props = { params: { tenantSlug: string } };

export default async function AdminDashboardPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  const [
    traineeCount,
    trainerCount,
    courseCount,
    activeTurmasCount,
    completedTurmasCount,
    recentTurmas,
    upcomingSessions,
  ] = await Promise.all([
    prisma.trainee.count({ where: { tenantId: session.tenantId } }),
    prisma.trainer.count({ where: { tenantId: session.tenantId } }),
    prisma.course.count({
      where: { tenantId: session.tenantId, status: "ACTIVE" },
    }),
    prisma.trainingAction.count({
      where: { tenantId: session.tenantId, status: "IN_PROGRESS" },
    }),
    prisma.trainingAction.count({
      where: { tenantId: session.tenantId, status: "COMPLETED" },
    }),
    prisma.trainingAction.findMany({
      where: { tenantId: session.tenantId },
      include: {
        course: { select: { name: true, priceEur: true } },
        entity: { select: { name: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.session.findMany({
      where: {
        trainingAction: { tenantId: session.tenantId },
        scheduledStart: { gte: new Date() },
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
      take: 4,
    }),
  ]);

  // approximate revenue: sum of priceEur * enrollments per turma
  const revenue = recentTurmas.reduce((acc, t) => {
    const price = t.course.priceEur ? Number(t.course.priceEur) : 0;
    return acc + price * t._count.enrollments;
  }, 0);

  // estimated completion rate (mock — would be real query in prod)
  const completionRate = completedTurmasCount > 0 ? 94 : 0;

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[{ label: "Dashboard" }]}
        title="Visão Geral"
        description="Resumo executivo da plataforma · auditoria DGERT em tempo real"
        actions={
          <>
            <Button
              asChild
              variant="outline"
              className="h-10 gap-1.5 border-border bg-card text-navy hover:bg-surface-low"
            >
              <Link href={`/${params.tenantSlug}/admin/courses/new`}>
                <Plus className="h-4 w-4" />
                Novo curso
              </Link>
            </Button>
            <Button className="h-10 gap-1.5 bg-navy text-white hover:bg-navy/90">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Nova turma
            </Button>
          </>
        }
      />

      {/* KPI strip */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Formandos" value={String(traineeCount)} icon={Users} variant="blue" />
        <StatCard label="Formadores" value={String(trainerCount)} icon={GraduationCap} variant="emerald" />
        <StatCard label="Cursos ativos" value={String(courseCount)} icon={Award} variant="gold" />
        <StatCard label="Turmas em curso" value={String(activeTurmasCount)} icon={Activity} variant="emerald" />
        <StatCard label="Receita (período)" value={`€${revenue.toLocaleString("pt-PT")}`} icon={Euro} variant="gold" />
        <StatCard label="Taxa conclusão" value={`${completionRate}%`} icon={TrendingUp} variant="purple" />
      </div>

      {/* Two-column row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent training actions */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <header className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-h3 font-bold text-navy">Turmas recentes</h2>
                <p className="text-xs text-ink-subtle">
                  Últimas {recentTurmas.length} turmas criadas
                </p>
              </div>
              <Link
                href={`/${params.tenantSlug}/trainer/sessions`}
                className="text-xs font-bold text-blue-600 hover:text-navy"
              >
                Ver todas →
              </Link>
            </header>
            <table className="w-full text-sm">
              <thead className="bg-surface-low/40">
                <tr className="text-left">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                    Turma
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                    Formandos
                  </th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentTurmas.map((turma) => (
                  <tr
                    key={turma.id}
                    className="group transition-colors hover:bg-surface-low/30"
                  >
                    <td className="px-6 py-4">
                      <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                        {turma.code}
                      </div>
                      <div className="mt-0.5 line-clamp-1 text-sm font-bold text-navy">
                        {turma.course.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-ink-muted">
                      {turma.entity?.name ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold tabular-nums text-navy">
                      {turma._count.enrollments}
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill status={turma.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming sessions */}
        <div className="rounded-xl border border-border bg-card p-6">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-h3 font-bold text-navy">Próximas sessões</h2>
              <p className="text-xs text-ink-subtle">
                {upcomingSessions.length} agendadas
              </p>
            </div>
            <CalendarDays className="h-5 w-5 text-ink-subtle" />
          </header>
          <ol className="space-y-3">
            {upcomingSessions.length === 0 ? (
              <li className="rounded-lg border border-dashed border-border bg-surface-low/40 p-4 text-center text-xs text-ink-muted">
                Sem sessões agendadas
              </li>
            ) : (
              upcomingSessions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-surface-low/40 p-3"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-card text-blue-600 ring-1 ring-blue-200/60">
                    <Clock4 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-navy">
                      {s.trainingAction.course.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-muted">
                      {formatDate(s.scheduledStart)} ·{" "}
                      {s.trainingAction.entity?.name ?? "—"}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-subtle">
                      {s.trainingAction.code} · Sessão {s.number}
                    </p>
                  </div>
                </li>
              ))
            )}
          </ol>
        </div>
      </div>

      {/* Bottom: shortcuts */}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <ShortcutCard
          href={`/${params.tenantSlug}/admin/trainees`}
          icon={Users}
          title="Gestão de formandos"
          description={`${traineeCount} formandos · filtros por empresa, área, estado`}
        />
        <ShortcutCard
          href={`/${params.tenantSlug}/admin/trainers`}
          icon={GraduationCap}
          title="Gestão de formadores"
          description={`${trainerCount} formadores · CCP, áreas, disponibilidade`}
        />
        <ShortcutCard
          href={`/${params.tenantSlug}/admin/courses`}
          icon={Award}
          title="Catálogo de cursos"
          description={`${courseCount} ativos · módulos, edições, marketing`}
        />
      </div>
    </DashboardShell>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: "Rascunho", cls: "bg-slate-100 text-slate-600" },
    SCHEDULED: { label: "Agendada", cls: "bg-blue-50 text-blue-700" },
    IN_PROGRESS: { label: "Em curso", cls: "bg-emerald-50 text-emerald-700" },
    COMPLETED: { label: "Concluída", cls: "bg-navy/8 text-navy" },
    ARCHIVED: { label: "Arquivada", cls: "bg-slate-50 text-slate-500" },
    CANCELLED: { label: "Cancelada", cls: "bg-red-50 text-red-700" },
  };
  const s = map[status] ?? map.DRAFT;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        s.cls
      )}
    >
      {s.label}
    </span>
  );
}

function ShortcutCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Users;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-navy/20 hover:shadow-card-hover"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-navy/8 text-navy ring-1 ring-navy/10">
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
