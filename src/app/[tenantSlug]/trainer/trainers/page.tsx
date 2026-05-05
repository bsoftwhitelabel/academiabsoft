import Image from "next/image";
import { redirect } from "next/navigation";
import { Users, BadgeCheck, Mail } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn, getInitials } from "@/lib/utils";

export const metadata = { title: "Diretório · Formadores" };

type Props = { params: { tenantSlug: string } };

export default async function TrainerTrainersPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  const trainers = await prisma.trainer.findMany({
    where: { tenantId: session.tenantId },
    include: {
      user: {
        select: { fullName: true, email: true, avatarUrl: true, isActive: true },
      },
      _count: { select: { trainingActions: true } },
    },
    orderBy: { user: { fullName: "asc" } },
  });

  const totalCcp = trainers.filter((t) => t.ccpNumber).length;
  const totalActive = trainers.filter((t) => t._count.trainingActions > 0).length;

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[{ label: "Diretório de formadores" }]}
        title="Diretório de formadores"
        description="Os teus colegas formadores · partilha de plano de sessão e materiais"
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Formadores" value={String(trainers.length)} icon={Users} variant="blue" />
        <StatCard label="Com CCP" value={String(totalCcp)} icon={BadgeCheck} variant="emerald" />
        <StatCard label="Ativos em turmas" value={String(totalActive)} icon={Users} variant="gold" />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {trainers.map((t) => (
          <article
            key={t.id}
            className={cn(
              "flex flex-col rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-card-hover",
              t.userId === session.userId
                ? "border-emerald-300/60 ring-1 ring-emerald-200/60"
                : "border-border"
            )}
          >
            <div className="mb-4 flex items-start gap-3">
              {t.user.avatarUrl ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-surface-mid">
                  <Image
                    src={t.user.avatarUrl}
                    alt={t.user.fullName}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-navy text-sm font-bold text-white ring-2 ring-surface-mid">
                  {getInitials(t.user.fullName)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-bold text-navy">
                  {t.user.fullName}
                  {t.userId === session.userId && (
                    <span className="ml-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                      Tu
                    </span>
                  )}
                </h3>
                <a
                  href={`mailto:${t.user.email}`}
                  className="inline-flex items-center gap-1 truncate text-[11px] text-blue-600 hover:text-navy"
                >
                  <Mail className="h-3 w-3" />
                  {t.user.email}
                </a>
              </div>
            </div>

            {t.ccpNumber && (
              <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200/60">
                <BadgeCheck className="h-3 w-3" strokeWidth={2.75} />
                CCP {t.ccpNumber}
              </div>
            )}

            {t.bio && (
              <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-ink-muted">
                {t.bio}
              </p>
            )}

            <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-4 text-xs">
              <Stat label="Anos exp." value={`${t.yearsPresentialExp ?? 0}`} />
              <Stat label="Turmas" value={String(t._count.trainingActions)} highlight />
              <Stat
                label="Tipo"
                value={t.isExternal ? "Externo" : "Interno"}
              />
            </div>
          </article>
        ))}
      </div>
    </DashboardShell>
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
