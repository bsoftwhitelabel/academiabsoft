import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Users,
  Award,
  TrendingUp,
  Clock4,
  Euro,
  FileSpreadsheet,
  FileText,
  Activity,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn, formatCurrency } from "@/lib/utils";

export const metadata = { title: "Relatórios DGERT" };

type Props = { params: { tenantSlug: string } };

export default async function AdminReportsPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  // ─── Fetch aggregate data ──────────────────────────────────────────────
  const [
    totalTrainees,
    totalSessions,
    completedTurmas,
    enrollments,
    coursesByArea,
    topCourses,
    recentTurmas,
    entityStats,
  ] = await Promise.all([
    prisma.trainee.count({ where: { tenantId: session.tenantId } }),
    prisma.session.count({
      where: { trainingAction: { tenantId: session.tenantId } },
    }),
    prisma.trainingAction.count({
      where: { tenantId: session.tenantId, status: "COMPLETED" },
    }),
    prisma.enrollment.findMany({
      where: { trainingAction: { tenantId: session.tenantId } },
      include: {
        trainingAction: {
          select: { durationHours: true, courseId: true, status: true },
        },
      },
    }),
    prisma.course.groupBy({
      by: ["trainingAreaId"],
      where: { tenantId: session.tenantId, status: "ACTIVE" },
      _count: { id: true },
    }),
    prisma.course.findMany({
      where: { tenantId: session.tenantId },
      include: {
        _count: { select: { trainingActions: true } },
        trainingActions: {
          select: { _count: { select: { enrollments: true } } },
        },
      },
      orderBy: { trainingActions: { _count: "desc" } },
      take: 6,
    }),
    prisma.trainingAction.findMany({
      where: { tenantId: session.tenantId, status: { in: ["IN_PROGRESS", "COMPLETED"] } },
      include: {
        course: { select: { name: true, priceEur: true } },
        entity: { select: { name: true } },
        _count: { select: { enrollments: true, sessions: true } },
      },
      orderBy: { startDate: "desc" },
      take: 8,
    }),
    prisma.entity.findMany({
      where: { tenantId: session.tenantId },
      include: {
        _count: { select: { trainees: true, trainingActions: true } },
      },
      orderBy: { trainees: { _count: "desc" } },
    }),
  ]);

  const totalHours = enrollments.reduce(
    (acc, e) => acc + e.trainingAction.durationHours,
    0
  );
  const completionRate = enrollments.length > 0
    ? Math.round(
        (enrollments.filter((e) => e.trainingAction.status === "COMPLETED")
          .length /
          enrollments.length) *
          100
      )
    : 0;

  const revenue = recentTurmas.reduce((acc, t) => {
    const price = t.course.priceEur ? Number(t.course.priceEur) : 0;
    return acc + price * t._count.enrollments;
  }, 0);

  // top courses computed
  const topCoursesProcessed = topCourses
    .map((c) => ({
      name: c.name,
      code: c.code,
      turmas: c._count.trainingActions,
      formandos: c.trainingActions.reduce(
        (a, t) => a + t._count.enrollments,
        0
      ),
    }))
    .sort((a, b) => b.formandos - a.formandos);

  const maxFormandos = Math.max(1, ...topCoursesProcessed.map((c) => c.formandos));

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[
          { label: "Gestão", href: `/${params.tenantSlug}/admin` },
          { label: "Relatórios" },
        ]}
        title="Relatórios DGERT"
        description="Indicadores executivos · auditoria SIGO · exportação Excel/PDF"
        actions={
          <>
            <Button
              variant="outline"
              className="h-10 gap-1.5 border-border bg-card text-navy hover:bg-surface-low"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Exportar Excel
            </Button>
            <Button className="h-10 gap-1.5 bg-navy text-white hover:bg-navy/90">
              <FileText className="h-4 w-4" />
              Relatório PDF
            </Button>
          </>
        }
      />

      {/* Period selector strip */}
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-1.5">
        <PeriodChip label="Este mês" active />
        <PeriodChip label="Trimestre" />
        <PeriodChip label="Ano (YTD)" />
        <PeriodChip label="12 meses" />
        <PeriodChip label="Todo histórico" />
        <span className="ml-auto px-3 text-[11px] font-medium text-ink-subtle">
          Período: 01/05/2026 → 31/05/2026
        </span>
      </div>

      {/* KPI strip */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Formandos" value={String(totalTrainees)} icon={Users} variant="blue" />
        <StatCard label="Horas formação" value={`${totalHours}h`} icon={Clock4} variant="emerald" />
        <StatCard label="Sessões" value={String(totalSessions)} icon={Activity} variant="gold" />
        <StatCard label="Turmas concluídas" value={String(completedTurmas)} icon={Award} variant="purple" />
        <StatCard label="Taxa conclusão" value={`${completionRate}%`} icon={TrendingUp} variant="emerald" />
        <StatCard label="Receita" value={formatCurrency(revenue)} icon={Euro} variant="gold" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top cursos chart (col-span-2) */}
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <header className="mb-5 flex items-end justify-between">
            <div>
              <h2 className="text-h3 font-bold text-navy">Top cursos por formandos</h2>
              <p className="text-xs text-ink-subtle">
                Distribuição de inscrições · top {topCoursesProcessed.length}
              </p>
            </div>
            <BarChart3 className="h-5 w-5 text-ink-subtle" />
          </header>
          <ol className="space-y-4">
            {topCoursesProcessed.map((c, i) => {
              const pct = (c.formandos / maxFormandos) * 100;
              return (
                <li key={c.code}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="line-clamp-1 text-sm font-bold text-navy">
                      {i + 1}. {c.name}
                    </span>
                    <span className="font-mono text-xs font-bold tabular-nums text-navy">
                      {c.formandos}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-mid">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        i === 0 ? "bg-gold" : i === 1 ? "bg-gold/70" : "bg-gold/40"
                      )}
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-subtle">
                    {c.code} · {c.turmas} turma{c.turmas !== 1 ? "s" : ""}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Areas pie (visual) */}
        <div className="rounded-xl border border-border bg-card p-6">
          <header className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-h3 font-bold text-navy">Áreas de formação</h2>
              <p className="text-xs text-ink-subtle">
                {coursesByArea.length} áreas ativas
              </p>
            </div>
          </header>
          <AreaDonut data={coursesByArea} />
        </div>
      </div>

      {/* Entities ranking */}
      <section className="mt-6 rounded-xl border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-h3 font-bold text-navy">Empresas cliente</h2>
            <p className="text-xs text-ink-subtle">
              Volume de formandos e turmas por entidade contratante
            </p>
          </div>
        </header>
        <table className="w-full text-sm">
          <thead className="bg-surface-low/40">
            <tr className="text-left">
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                #
              </th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                Empresa
              </th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                Cidade
              </th>
              <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                Formandos
              </th>
              <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                Turmas
              </th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                Volume
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entityStats.map((e, i) => {
              const total = e._count.trainees + e._count.trainingActions;
              const maxTotal = Math.max(
                1,
                ...entityStats.map((x) => x._count.trainees + x._count.trainingActions)
              );
              const pct = (total / maxTotal) * 100;
              return (
                <tr key={e.id} className="transition-colors hover:bg-surface-low/30">
                  <td className="px-6 py-4 text-xs font-bold text-ink-muted">
                    {String(i + 1).padStart(2, "0")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-navy">{e.name}</div>
                    {e.taxId && (
                      <div className="font-mono text-[10px] text-ink-subtle">
                        NIF {e.taxId}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs text-ink-muted">
                    {e.city ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold tabular-nums text-navy">
                    {e._count.trainees}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold tabular-nums text-navy">
                    {e._count.trainingActions}
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-surface-mid">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* DGERT compliance footer */}
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50/30 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
            <Award className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-navy">
              Conformidade DGERT &middot; Pronto para auditoria
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Todos os indicadores são gerados em tempo real a partir do schema
              isolado <code className="rounded bg-emerald-100 px-1 font-mono text-[10px]">academia</code>.
              Cada turma tem registo de presenças assinadas, dossier
              técnico-pedagógico em PDF e ata de reunião pedagógica.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-semibold">
              <Link
                href={`/${params.tenantSlug}/admin/courses`}
                className="text-emerald-700 hover:text-emerald-800"
              >
                Ver dossier por curso →
              </Link>
              <Link
                href={`/${params.tenantSlug}/trainer/sessions`}
                className="text-emerald-700 hover:text-emerald-800"
              >
                Ver folhas de presença →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function PeriodChip({ label, active }: { label: string; active?: boolean }) {
  return (
    <button
      className={cn(
        "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "bg-navy text-white"
          : "text-ink-muted hover:bg-surface-low hover:text-navy"
      )}
    >
      {label}
    </button>
  );
}

function AreaDonut({ data }: { data: { trainingAreaId: string | null; _count: { id: number } }[] }) {
  const total = data.reduce((acc, d) => acc + d._count.id, 0);
  if (total === 0) {
    return (
      <p className="text-xs text-ink-subtle">Sem dados de áreas ainda.</p>
    );
  }
  const colors = ["#0B2447", "#CCA823", "#1A3A6B", "#E9C33F", "#005DB6", "#94A3B8"];
  let acc = 0;
  const segments = data.slice(0, 6).map((d, i) => {
    const pct = d._count.id / total;
    const start = acc;
    acc += pct;
    return {
      pct,
      start,
      end: acc,
      color: colors[i % colors.length],
      count: d._count.id,
    };
  });

  // SVG circle parameters
  const r = 58;
  const cx = 80;
  const cy = 80;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 160 160" className="h-32 w-32 shrink-0 -rotate-90">
        {segments.map((s, i) => {
          const dash = circ * s.pct;
          const offset = -circ * s.start;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="22"
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>
      <ul className="flex-1 space-y-1.5">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="flex-1 text-ink-muted">Área {i + 1}</span>
            <span className="font-bold tabular-nums text-navy">
              {s.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
