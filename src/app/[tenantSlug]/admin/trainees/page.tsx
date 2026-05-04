import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Users, Plus, Search, Filter, ArrowUpDown, MoreVertical } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn, getInitials, formatDate } from "@/lib/utils";

export const metadata = { title: "Formandos · Gestão" };

type Props = {
  params: { tenantSlug: string };
  searchParams: { entity?: string; q?: string };
};

export default async function AdminTraineesPage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  const [trainees, entities, totalCount, activeCount] = await Promise.all([
    prisma.trainee.findMany({
      where: {
        tenantId: session.tenantId,
        ...(searchParams.entity ? { entityId: searchParams.entity } : {}),
        ...(searchParams.q
          ? {
              user: {
                OR: [
                  { fullName: { contains: searchParams.q, mode: "insensitive" } },
                  { email: { contains: searchParams.q, mode: "insensitive" } },
                ],
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            avatarUrl: true,
            isActive: true,
            lastLoginAt: true,
          },
        },
        entity: { select: { id: true, name: true, code: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { user: { fullName: "asc" } },
      take: 50,
    }),
    prisma.entity.findMany({
      where: { tenantId: session.tenantId },
      select: { id: true, name: true, _count: { select: { trainees: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.trainee.count({ where: { tenantId: session.tenantId } }),
    prisma.trainee.count({
      where: { tenantId: session.tenantId, user: { isActive: true } },
    }),
  ]);

  const enrolledCount = trainees.filter((t) => t._count.enrollments > 0).length;

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[
          { label: "Gestão", href: `/${params.tenantSlug}/admin` },
          { label: "Formandos" },
        ]}
        title="Formandos"
        description={`${totalCount} formandos registados · scoped ao tenant`}
        actions={
          <>
            <Button
              variant="outline"
              className="h-10 gap-1.5 border-border bg-card text-navy hover:bg-surface-low"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            <Button className="h-10 gap-1.5 bg-navy text-white hover:bg-navy/90">
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Novo formando
            </Button>
          </>
        }
      />

      {/* KPI strip */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total" value={String(totalCount)} icon={Users} variant="blue" />
        <StatCard label="Ativos" value={String(activeCount)} icon={Users} variant="emerald" />
        <StatCard label="Inscritos" value={String(enrolledCount)} icon={Users} variant="gold" />
        <StatCard label="Empresas" value={String(entities.length)} icon={Users} variant="purple" />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-card p-4 md:flex-row md:items-center">
        <form className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <input
            name="q"
            type="text"
            defaultValue={searchParams.q}
            placeholder="Pesquisar nome ou email..."
            className="form-input pl-9"
          />
          {searchParams.entity && (
            <input type="hidden" name="entity" value={searchParams.entity} />
          )}
        </form>
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            href={`/${params.tenantSlug}/admin/trainees${
              searchParams.q ? `?q=${searchParams.q}` : ""
            }`}
            active={!searchParams.entity}
          >
            Todas as empresas ({totalCount})
          </FilterChip>
          {entities.map((e) => {
            const sp = new URLSearchParams();
            sp.set("entity", e.id);
            if (searchParams.q) sp.set("q", searchParams.q);
            return (
              <FilterChip
                key={e.id}
                href={`/${params.tenantSlug}/admin/trainees?${sp}`}
                active={searchParams.entity === e.id}
              >
                {e.name} ({e._count.trainees})
              </FilterChip>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface-low/40">
            <tr className="text-left">
              <Th>Formando</Th>
              <Th>Empresa</Th>
              <Th>Profissão</Th>
              <Th align="center">Cursos</Th>
              <Th>Última atividade</Th>
              <Th align="center">Status</Th>
              <Th align="right">Ações</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {trainees.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <p className="text-sm font-bold text-navy">
                    Nenhum formando encontrado
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Ajuste os filtros ou crie um novo formando.
                  </p>
                </td>
              </tr>
            ) : (
              trainees.map((t) => <TraineeRow key={t.id} trainee={t} />)
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-border bg-surface-low/30 px-6 py-3 text-xs text-ink-muted">
          <span>
            A mostrar <strong className="text-navy">{trainees.length}</strong> de{" "}
            <strong className="text-navy">{totalCount}</strong> formandos
          </span>
          <span className="text-[10px]">Limit 50 por página · paginação em breve</span>
        </div>
      </div>
    </DashboardShell>
  );
}

type Trainee = Awaited<
  ReturnType<typeof prisma.trainee.findMany>
>[number] & {
  user: {
    fullName: string;
    email: string;
    avatarUrl: string | null;
    isActive: boolean;
    lastLoginAt: Date | null;
  };
  entity: { id: string; name: string; code: string | null } | null;
  _count: { enrollments: number };
};

function TraineeRow({ trainee }: { trainee: Trainee }) {
  return (
    <tr className="group transition-colors hover:bg-surface-low/30">
      <td className="px-6 py-3">
        <div className="flex items-center gap-3">
          {trainee.user.avatarUrl ? (
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
              <Image
                src={trainee.user.avatarUrl}
                alt={trainee.user.fullName}
                fill
                sizes="36px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-mid text-xs font-bold text-navy ring-1 ring-border">
              {getInitials(trainee.user.fullName)}
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-navy">{trainee.user.fullName}</p>
            <p className="text-[11px] text-ink-subtle">{trainee.user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-3">
        <span className="text-xs font-semibold text-navy">
          {trainee.entity?.name ?? "—"}
        </span>
      </td>
      <td className="px-6 py-3 text-xs text-ink-muted">
        {trainee.profession ?? "—"}
      </td>
      <td className="px-6 py-3 text-center">
        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-surface-mid px-2 text-xs font-bold text-navy">
          {trainee._count.enrollments}
        </span>
      </td>
      <td className="px-6 py-3 font-mono text-[10px] uppercase tracking-wider text-ink-subtle">
        {trainee.user.lastLoginAt ? formatDate(trainee.user.lastLoginAt) : "—"}
      </td>
      <td className="px-6 py-3 text-center">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
            trainee.user.isActive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500"
          )}
        >
          {trainee.user.isActive ? "Ativo" : "Inativo"}
        </span>
      </td>
      <td className="px-6 py-3 text-right">
        <button
          aria-label="Ações"
          className="grid h-7 w-7 place-items-center rounded text-ink-faint opacity-0 transition-all group-hover:opacity-100 hover:bg-surface-low hover:text-navy"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
}) {
  return (
    <th
      className={cn(
        "px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle",
        align === "center" && "text-center",
        align === "right" && "text-right"
      )}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className="h-2.5 w-2.5 opacity-40" />
      </span>
    </th>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "bg-navy text-white"
          : "bg-surface-low text-ink-muted hover:bg-surface-mid hover:text-navy"
      )}
    >
      {children}
    </Link>
  );
}
