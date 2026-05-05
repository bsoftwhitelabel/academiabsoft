import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  AlertTriangle,
  Clock4,
  Search,
  Shield,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { InvalidateSignatureButton } from "@/components/admin/invalidate-signature-button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn, formatDate, formatTime } from "@/lib/utils";

export const metadata = { title: "Auditoria de assinaturas" };

type Props = {
  params: { tenantSlug: string };
  searchParams: { state?: string };
};

const STATE_FILTERS = [
  { value: "all", label: "Todas" },
  { value: "SIGNED", label: "Assinadas" },
  { value: "INVALIDATED", label: "Invalidadas" },
] as const;

export default async function AdminSignaturesPage({
  params,
  searchParams,
}: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  if (session.role !== "ADMIN" && session.role !== "OWNER") {
    redirect(`/${params.tenantSlug}/catalog`);
  }

  const stateFilter =
    searchParams.state === "INVALIDATED"
      ? "INVALIDATED"
      : searchParams.state === "all"
      ? undefined
      : "SIGNED";

  const [attendances, signedCount, invalidatedCount, last7d] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        session: { trainingAction: { tenantId: session.tenantId } },
        ...(stateFilter ? { signatureState: stateFilter } : {}),
      },
      include: {
        trainee: {
          include: { user: { select: { fullName: true, email: true } } },
        },
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
        signature: {
          select: { signedAt: true, signedFromIp: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.attendance.count({
      where: {
        session: { trainingAction: { tenantId: session.tenantId } },
        signatureState: "SIGNED",
      },
    }),
    prisma.attendance.count({
      where: {
        session: { trainingAction: { tenantId: session.tenantId } },
        signatureState: "INVALIDATED",
      },
    }),
    prisma.attendance.count({
      where: {
        session: { trainingAction: { tenantId: session.tenantId } },
        signatureState: "SIGNED",
        signature: {
          signedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
    }),
  ]);

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[
          { label: "Gestão", href: `/${params.tenantSlug}/admin` },
          { label: "Auditoria de assinaturas" },
        ]}
        title="Assinaturas digitais · Auditoria DGERT"
        description="Monitor e invalida assinaturas comprometidas. Cada acção fica registada."
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Assinadas"
          value={String(signedCount)}
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          label="Invalidadas"
          value={String(invalidatedCount)}
          icon={AlertTriangle}
          variant="purple"
        />
        <StatCard
          label="Últimos 7d"
          value={String(last7d)}
          icon={Clock4}
          variant="blue"
        />
        <StatCard
          label="Total registos"
          value={String(signedCount + invalidatedCount)}
          icon={Shield}
          variant="gold"
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {STATE_FILTERS.map((f) => {
          const active =
            (f.value === "all" && !searchParams.state) ||
            f.value === searchParams.state ||
            (f.value === "SIGNED" && !searchParams.state);
          return (
            <Link
              key={f.value}
              href={
                f.value === "all"
                  ? `/${params.tenantSlug}/admin/signatures?state=all`
                  : `/${params.tenantSlug}/admin/signatures?state=${f.value}`
              }
              className={cn(
                "rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors",
                active
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-card text-ink-muted hover:border-navy/30 hover:text-navy"
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {attendances.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-low/40 px-8 py-16 text-center">
          <Search className="mx-auto mb-4 h-10 w-10 text-ink-faint" />
          <h3 className="text-base font-bold text-navy">
            Sem registos para o filtro
          </h3>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-surface-low/40">
              <tr className="text-left">
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                  Formando
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                  Sessão
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                  Assinada
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                  IP
                </th>
                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                  Estado
                </th>
                <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {attendances.map((a) => {
                const ta = a.session.trainingAction;
                const sessionLabel = `${ta.code} · sessão ${a.session.number}`;
                return (
                  <tr key={a.id} className="hover:bg-surface-low/30">
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-navy">
                        {a.trainee.user.fullName}
                      </p>
                      <p className="text-[10px] text-ink-subtle">
                        {a.trainee.user.email}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-navy">
                        {ta.course.name}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-subtle">
                        {sessionLabel}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {a.signature?.signedAt ? (
                        <>
                          <div className="font-bold text-navy">
                            {formatDate(a.signature.signedAt)}
                          </div>
                          <div className="text-[10px] text-ink-subtle">
                            {formatTime(a.signature.signedAt)}
                          </div>
                        </>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-ink-muted">
                      {a.signature?.signedFromIp ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatePill state={a.signatureState} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.signatureState === "SIGNED" ? (
                        <InvalidateSignatureButton
                          attendanceId={a.id}
                          traineeName={a.trainee.user.fullName}
                          sessionLabel={sessionLabel}
                        />
                      ) : a.signatureState === "INVALIDATED" ? (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider text-red-700"
                          title={a.postClassReason ?? undefined}
                        >
                          Invalidada
                        </span>
                      ) : (
                        <span className="text-[10px] text-ink-faint">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}

function StatePill({ state }: { state: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    NOT_ENABLED: { label: "Pendente", cls: "bg-slate-100 text-slate-600" },
    ENABLED: { label: "Aberta", cls: "bg-blue-50 text-blue-700" },
    SIGNED: { label: "Assinada", cls: "bg-emerald-50 text-emerald-700" },
    INVALIDATED: { label: "Invalidada", cls: "bg-red-50 text-red-700" },
  };
  const s = map[state] ?? map.NOT_ENABLED;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        s.cls
      )}
    >
      {s.label}
    </span>
  );
}
