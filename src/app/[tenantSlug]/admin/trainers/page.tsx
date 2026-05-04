import Image from "next/image";
import { redirect } from "next/navigation";
import {
  Plus,
  Briefcase,
  BadgeCheck,
  Activity,
  Award,
  MoreVertical,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn, getInitials } from "@/lib/utils";

export const metadata = { title: "Formadores · Gestão" };

type Props = { params: { tenantSlug: string } };

export default async function AdminTrainersPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  const [trainers, totalCount] = await Promise.all([
    prisma.trainer.findMany({
      where: { tenantId: session.tenantId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            avatarUrl: true,
            isActive: true,
          },
        },
        _count: { select: { trainingActions: true } },
      },
      orderBy: { user: { fullName: "asc" } },
    }),
    prisma.trainer.count({ where: { tenantId: session.tenantId } }),
  ]);

  const withCcp = trainers.filter((t) => t.ccpNumber).length;
  const withActiveTurmas = trainers.filter(
    (t) => t._count.trainingActions > 0
  ).length;
  const totalYears = trainers.reduce(
    (acc, t) => acc + (t.yearsPresentialExp ?? 0),
    0
  );
  const avgYears = trainers.length > 0
    ? Math.round(totalYears / trainers.length)
    : 0;

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[
          { label: "Gestão", href: `/${params.tenantSlug}/admin` },
          { label: "Formadores" },
        ]}
        title="Formadores"
        description={`${totalCount} formadores registados · CCP, especialidades e disponibilidade`}
        actions={
          <Button className="h-10 gap-1.5 bg-navy text-white hover:bg-navy/90">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Novo formador
          </Button>
        }
      />

      {/* KPI strip */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total formadores" value={String(totalCount)} icon={Briefcase} variant="blue" />
        <StatCard label="Com CCP" value={String(withCcp)} icon={BadgeCheck} variant="emerald" />
        <StatCard label="Com turmas ativas" value={String(withActiveTurmas)} icon={Activity} variant="gold" />
        <StatCard label="Experiência média" value={`${avgYears} anos`} icon={Award} variant="purple" />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {trainers.map((t) => (
          <TrainerCard key={t.id} trainer={t} />
        ))}
      </div>
    </DashboardShell>
  );
}

type Trainer = Awaited<
  ReturnType<typeof prisma.trainer.findMany>
>[number] & {
  user: {
    fullName: string;
    email: string;
    avatarUrl: string | null;
    isActive: boolean;
  };
  _count: { trainingActions: number };
};

function TrainerCard({ trainer }: { trainer: Trainer }) {
  return (
    <article className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
      {/* avatar + name + actions */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {trainer.user.avatarUrl ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-surface-mid">
              <Image
                src={trainer.user.avatarUrl}
                alt={trainer.user.fullName}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-navy text-sm font-bold text-white ring-2 ring-surface-mid">
              {getInitials(trainer.user.fullName)}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-navy">
              {trainer.user.fullName}
            </h3>
            <p className="truncate text-[11px] text-ink-subtle">
              {trainer.user.email}
            </p>
          </div>
        </div>
        <button
          aria-label="Ações"
          className="grid h-7 w-7 place-items-center rounded text-ink-faint hover:bg-surface-low hover:text-navy"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* CCP badge */}
      {trainer.ccpNumber && (
        <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200/60">
          <BadgeCheck className="h-3 w-3" strokeWidth={2.75} />
          CCP {trainer.ccpNumber}
        </div>
      )}

      {/* Bio */}
      {trainer.bio && (
        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-ink-muted">
          {trainer.bio}
        </p>
      )}

      {/* Stats grid */}
      <div className="mt-auto grid grid-cols-3 gap-3 border-t border-border pt-4 text-xs">
        <Stat label="Anos exp." value={`${trainer.yearsPresentialExp ?? 0}`} />
        <Stat label="Turmas" value={String(trainer._count.trainingActions)} highlight />
        <Stat label="Status" value={trainer.user.isActive ? "Ativo" : "Inativo"} />
      </div>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {trainer.isExternal && (
          <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-700 ring-1 ring-amber-200/60">
            Externo
          </span>
        )}
        {trainer.isElearning && (
          <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-blue-700 ring-1 ring-blue-200/60">
            E-Learning
          </span>
        )}
        {!trainer.isExternal && !trainer.isElearning && (
          <span className="rounded-md bg-surface-low px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-muted">
            Interno
          </span>
        )}
      </div>
    </article>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-ink-subtle">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-bold tabular-nums",
          highlight ? "text-gold-700" : "text-navy"
        )}
      >
        {value}
      </p>
    </div>
  );
}
