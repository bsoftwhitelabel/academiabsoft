import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  Users,
  CheckCircle2,
  Clock4,
  Search,
  MapPin,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { EntityApprovalActions } from "@/components/admin/entity-approval-actions";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Empresas-cliente · Gestão" };

type Props = {
  params: { tenantSlug: string };
  searchParams: { state?: string };
};

const STATE_FILTERS = [
  { value: "pending", label: "Pendentes" },
  { value: "active", label: "Ativas" },
  { value: "all", label: "Todas" },
] as const;

export default async function AdminEntitiesPage({
  params,
  searchParams,
}: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);
  if (session.role !== "ADMIN" && session.role !== "OWNER") {
    redirect(`/${params.tenantSlug}/catalog`);
  }

  const filter = searchParams.state ?? "pending";
  const where = {
    tenantId: session.tenantId,
    ...(filter === "pending"
      ? { isActive: false }
      : filter === "active"
      ? { isActive: true }
      : {}),
  };

  const [entities, pendingCount, activeCount] = await Promise.all([
    prisma.entity.findMany({
      where,
      include: {
        _count: {
          select: { trainees: true, trainingActions: true },
        },
      },
      orderBy: [{ isActive: "asc" }, { createdAt: "desc" }],
      take: 100,
    }),
    prisma.entity.count({
      where: { tenantId: session.tenantId, isActive: false },
    }),
    prisma.entity.count({
      where: { tenantId: session.tenantId, isActive: true },
    }),
  ]);

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[
          { label: "Gestão", href: `/${params.tenantSlug}/admin` },
          { label: "Empresas-cliente" },
        ]}
        title="Empresas-cliente"
        description="Gere as empresas onde os teus formandos trabalham. Aprova novas inscrições aqui."
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Pendentes aprovação"
          value={String(pendingCount)}
          icon={Clock4}
          variant={pendingCount > 0 ? "purple" : "blue"}
        />
        <StatCard
          label="Ativas"
          value={String(activeCount)}
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          label="Total"
          value={String(pendingCount + activeCount)}
          icon={Building2}
          variant="gold"
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {STATE_FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <Link
              key={f.value}
              href={`/${params.tenantSlug}/admin/entities?state=${f.value}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors",
                active
                  ? "border-navy bg-navy text-white"
                  : "border-border bg-card text-ink-muted hover:border-navy/30 hover:text-navy"
              )}
            >
              {f.label}
              {f.value === "pending" && pendingCount > 0 && !active && (
                <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] text-purple-700">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {entities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-low/40 px-8 py-16 text-center">
          <Search className="mx-auto mb-4 h-10 w-10 text-ink-faint" />
          <h3 className="text-base font-bold text-navy">
            {filter === "pending"
              ? "Nada pendente"
              : "Sem empresas para o filtro"}
          </h3>
          {filter === "pending" && (
            <p className="mt-1 text-sm text-ink-muted">
              Quando alguém se inscreve com uma nova empresa, fica aqui à
              espera de aprovação.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {entities.map((e) => (
            <article
              key={e.id}
              className={cn(
                "rounded-2xl border bg-card p-5 transition-all",
                e.isActive
                  ? "border-border"
                  : "border-amber-300/60 ring-1 ring-amber-200/40"
              )}
            >
              <header className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "grid h-11 w-11 shrink-0 place-items-center rounded-lg ring-1",
                      e.isActive
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-200/60"
                        : "bg-amber-50 text-amber-700 ring-amber-200/60"
                    )}
                  >
                    <Building2 className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold leading-tight text-navy">
                      {e.name}
                    </h3>
                    <p className="mt-0.5 text-[11px] text-ink-subtle">
                      {e.code ? (
                        <span className="font-mono">{e.code} · </span>
                      ) : null}
                      Criada {formatDate(e.createdAt)}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    e.isActive
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60"
                      : "bg-amber-100 text-amber-800 ring-1 ring-amber-300/60"
                  )}
                >
                  {e.isActive ? "Ativa" : "Pendente"}
                </span>
              </header>

              <dl className="mb-3 grid grid-cols-2 gap-3 text-xs md:grid-cols-3">
                {e.city && (
                  <Field
                    icon={MapPin}
                    label="Localidade"
                    value={`${e.city}${e.country ? ` · ${e.country}` : ""}`}
                  />
                )}
                {e.taxId && (
                  <Field label="NIF" value={e.taxId} mono />
                )}
                {e.cae && <Field label="CAE" value={e.cae} mono />}
                <Field
                  icon={Users}
                  label="Formandos"
                  value={String(e._count.trainees)}
                />
              </dl>

              {(e.contactEmail || e.contactPhone) && (
                <div className="mb-3 rounded-lg bg-surface-low/50 px-3 py-2 text-[11px] text-ink-muted">
                  {e.contactEmail && (
                    <p className="truncate">📧 {e.contactEmail}</p>
                  )}
                  {e.contactPhone && <p>📞 {e.contactPhone}</p>}
                </div>
              )}

              {!e.isActive && (
                <div className="border-t border-border pt-3">
                  <EntityApprovalActions entityId={e.id} entityName={e.name} />
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function Field({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon?: typeof MapPin;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 inline-flex items-center gap-1 text-[12px] font-bold text-navy",
          mono && "font-mono"
        )}
      >
        {Icon && <Icon className="h-3 w-3 text-ink-muted" />}
        {value}
      </dd>
    </div>
  );
}
