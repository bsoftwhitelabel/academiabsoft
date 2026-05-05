import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  Users,
  Clock4,
  CheckCircle2,
  ArrowRight,
  FileText,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "Relatórios · Formador" };

type Props = { params: { tenantSlug: string } };

export default async function TrainerReportsPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  const trainerProfile = session.role === "TRAINER"
    ? await prisma.trainer.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      })
    : null;

  const trainerFilter = trainerProfile
    ? { trainers: { some: { trainerId: trainerProfile.id } } }
    : {};

  const [
    totalTurmas,
    inProgressTurmas,
    completedTurmas,
    totalSessions,
    closedSessions,
    enrollments,
    attendances,
  ] = await Promise.all([
    prisma.trainingAction.count({
      where: { tenantId: session.tenantId, ...trainerFilter },
    }),
    prisma.trainingAction.count({
      where: {
        tenantId: session.tenantId,
        status: "IN_PROGRESS",
        ...trainerFilter,
      },
    }),
    prisma.trainingAction.count({
      where: {
        tenantId: session.tenantId,
        status: "COMPLETED",
        ...trainerFilter,
      },
    }),
    prisma.session.count({
      where: { trainingAction: { tenantId: session.tenantId, ...trainerFilter } },
    }),
    prisma.session.count({
      where: {
        trainingAction: { tenantId: session.tenantId, ...trainerFilter },
        status: "CLOSED",
      },
    }),
    prisma.enrollment.count({
      where: { trainingAction: { tenantId: session.tenantId, ...trainerFilter } },
    }),
    prisma.attendance.findMany({
      where: {
        session: {
          trainingAction: { tenantId: session.tenantId, ...trainerFilter },
        },
      },
      select: { status: true, signatureState: true },
    }),
  ]);

  const presentCount = attendances.filter(
    (a) =>
      a.status === "PRESENT" ||
      a.status === "CHECKED_IN" ||
      a.status === "MANUAL_PRESENT" ||
      a.status === "EARLY_LEAVE"
  ).length;
  const signedCount = attendances.filter(
    (a) => a.signatureState === "SIGNED"
  ).length;
  const adherenceRate =
    attendances.length > 0
      ? Math.round((presentCount / attendances.length) * 100)
      : 0;
  const signatureRate =
    presentCount > 0 ? Math.round((signedCount / presentCount) * 100) : 0;

  // Per-status breakdown
  const breakdown = [
    {
      label: "Presentes",
      count: attendances.filter((a) => a.status === "PRESENT").length,
      color: "bg-emerald-500",
    },
    {
      label: "Manual",
      count: attendances.filter((a) => a.status === "MANUAL_PRESENT").length,
      color: "bg-blue-500",
    },
    {
      label: "Saída antecipada",
      count: attendances.filter((a) => a.status === "EARLY_LEAVE").length,
      color: "bg-amber-500",
    },
    {
      label: "Check-in",
      count: attendances.filter((a) => a.status === "CHECKED_IN").length,
      color: "bg-cyan-500",
    },
    {
      label: "Pendente",
      count: attendances.filter((a) => a.status === "PENDING").length,
      color: "bg-slate-400",
    },
    {
      label: "Ausente",
      count: attendances.filter((a) => a.status === "ABSENT").length,
      color: "bg-red-500",
    },
  ];
  const maxBreakdown = Math.max(1, ...breakdown.map((b) => b.count));

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[{ label: "Relatórios" }]}
        title="Relatórios de execução"
        description={
          trainerProfile
            ? "Indicadores das tuas turmas · preparação para Ata Pedagógica"
            : "Vista admin de execução de todas as turmas"
        }
        actions={
          <Button className="h-10 gap-1.5 bg-navy text-white hover:bg-navy/90">
            <FileText className="h-4 w-4" />
            Exportar PDF
          </Button>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Turmas total" value={String(totalTurmas)} icon={Activity} variant="blue" />
        <StatCard label="Em curso" value={String(inProgressTurmas)} icon={Clock4} variant="emerald" />
        <StatCard label="Concluídas" value={String(completedTurmas)} icon={CheckCircle2} variant="purple" />
        <StatCard label="Formandos" value={String(enrollments)} icon={Users} variant="gold" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Adherence */}
        <div className="rounded-xl border border-border bg-card p-6">
          <header className="mb-5">
            <h2 className="text-h3 font-bold text-navy">Taxa de adesão global</h2>
            <p className="text-xs text-ink-subtle">
              Formandos efetivamente presentes vs. inscritos
            </p>
          </header>
          <div className="flex items-end gap-6">
            <div className="text-5xl font-bold text-navy tabular-nums">
              {adherenceRate}
              <span className="text-2xl text-gold">%</span>
            </div>
            <div className="flex-1 pb-2">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-ink-muted">
                  {presentCount}/{attendances.length} presenças
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    adherenceRate >= 75
                      ? "bg-emerald-100 text-emerald-700"
                      : adherenceRate >= 50
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                  )}
                >
                  {adherenceRate >= 75
                    ? "DGERT OK"
                    : adherenceRate >= 50
                    ? "Atenção"
                    : "Crítico"}
                </span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-mid">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    adherenceRate >= 75
                      ? "bg-emerald-500"
                      : adherenceRate >= 50
                      ? "bg-amber-500"
                      : "bg-red-500"
                  )}
                  style={{ width: `${adherenceRate}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-ink-subtle">
                Threshold DGERT: 75% mínimo para certificação por aproveitamento
              </p>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="rounded-xl border border-border bg-card p-6">
          <header className="mb-5">
            <h2 className="text-h3 font-bold text-navy">Taxa de assinaturas</h2>
            <p className="text-xs text-ink-subtle">
              Presenças com assinatura digital recolhida
            </p>
          </header>
          <div className="flex items-end gap-6">
            <div className="text-5xl font-bold text-navy tabular-nums">
              {signatureRate}
              <span className="text-2xl text-gold">%</span>
            </div>
            <div className="flex-1 pb-2">
              <p className="text-xs text-ink-muted">
                {signedCount} de {presentCount} formandos presentes assinaram
                digitalmente
              </p>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-surface-mid">
                <div
                  className="h-full rounded-full bg-gold transition-all"
                  style={{ width: `${signatureRate}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-ink-subtle">
                Folhas de presença DGERT geradas automaticamente
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <header className="mb-5">
          <h2 className="text-h3 font-bold text-navy">Distribuição de presenças</h2>
          <p className="text-xs text-ink-subtle">
            Repartição por estado · útil para preparação da ata pedagógica
          </p>
        </header>
        <div className="space-y-3">
          {breakdown.map((b) => {
            const pct = (b.count / maxBreakdown) * 100;
            return (
              <div key={b.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-navy">{b.label}</span>
                  <span className="font-mono font-bold tabular-nums text-ink-muted">
                    {b.count}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-mid">
                  <div
                    className={cn("h-full rounded-full transition-all", b.color)}
                    style={{ width: `${Math.max(pct, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sessions progress */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <h3 className="text-h3 font-bold text-navy">Sessões executadas</h3>
          <p className="mt-1 text-xs text-ink-subtle">
            Progresso global das tuas turmas
          </p>
          <div className="mt-4 flex items-center gap-4">
            <div className="text-4xl font-bold tabular-nums text-navy">
              {closedSessions}
              <span className="text-xl text-ink-muted">/{totalSessions}</span>
            </div>
            <div className="flex-1">
              <div className="h-3 w-full overflow-hidden rounded-full bg-surface-mid">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width: `${
                      totalSessions > 0
                        ? Math.round((closedSessions / totalSessions) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="mt-1.5 text-xs text-ink-muted">
                {totalSessions > 0
                  ? Math.round((closedSessions / totalSessions) * 100)
                  : 0}
                % concluído
              </p>
            </div>
          </div>
        </div>

        <Link
          href={`/${params.tenantSlug}/trainer/sessions`}
          className="group flex items-center justify-between rounded-xl border border-border bg-gradient-to-br from-card to-gold/5 p-6 transition-colors hover:from-card hover:to-gold/10"
        >
          <div>
            <h3 className="text-sm font-bold text-navy">Ver todas as turmas</h3>
            <p className="mt-1 text-xs text-ink-muted">
              Acesso rápido às folhas de presença
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-ink-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-navy" />
        </Link>
      </div>
    </DashboardShell>
  );
}
