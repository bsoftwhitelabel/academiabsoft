import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ClipboardList,
  Building2,
  Users,
  Activity,
  ArrowRight,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "Classes · Trainer" };

type Props = { params: { tenantSlug: string } };

export default async function TrainerClassesPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  const trainerProfile =
    session.role === "TRAINER"
      ? await prisma.trainer.findUnique({
          where: { userId: session.userId },
          select: { id: true },
        })
      : null;

  // Group training actions by entity (the natural "class" grouping)
  const turmas = await prisma.trainingAction.findMany({
    where: {
      tenantId: session.tenantId,
      ...(trainerProfile
        ? { trainers: { some: { trainerId: trainerProfile.id } } }
        : {}),
    },
    include: {
      course: { select: { name: true, code: true } },
      entity: { select: { id: true, name: true, city: true } },
      _count: { select: { enrollments: true, sessions: true } },
    },
    orderBy: { startDate: "desc" },
  });

  // Group by entity
  const groups = new Map<
    string,
    {
      entity: { id: string; name: string; city: string | null } | null;
      turmas: typeof turmas;
      totalEnrollments: number;
      totalSessions: number;
    }
  >();

  for (const t of turmas) {
    const key = t.entity?.id ?? "no-entity";
    const cur = groups.get(key) ?? {
      entity: t.entity,
      turmas: [],
      totalEnrollments: 0,
      totalSessions: 0,
    };
    cur.turmas.push(t);
    cur.totalEnrollments += t._count.enrollments;
    cur.totalSessions += t._count.sessions;
    groups.set(key, cur);
  }

  const groupArr = Array.from(groups.values()).sort(
    (a, b) => b.turmas.length - a.turmas.length
  );

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[{ label: "Classes" }]}
        title="Classes (por cliente)"
        description={`${groupArr.length} agrupamentos · ${turmas.length} turmas total`}
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Agrupamentos"
          value={String(groupArr.length)}
          icon={ClipboardList}
          variant="blue"
        />
        <StatCard
          label="Turmas"
          value={String(turmas.length)}
          icon={Activity}
          variant="emerald"
        />
        <StatCard
          label="Formandos"
          value={String(
            groupArr.reduce((acc, g) => acc + g.totalEnrollments, 0)
          )}
          icon={Users}
          variant="gold"
        />
        <StatCard
          label="Sessões"
          value={String(
            groupArr.reduce((acc, g) => acc + g.totalSessions, 0)
          )}
          icon={Activity}
          variant="purple"
        />
      </div>

      {groupArr.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-low/40 px-8 py-16 text-center">
          <ClipboardList className="mx-auto mb-4 h-10 w-10 text-ink-faint" />
          <h3 className="text-base font-bold text-navy">Sem agrupamentos</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Quando tiveres turmas atribuídas, ficam agrupadas por cliente aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupArr.map((g) => (
            <section
              key={g.entity?.id ?? "no-entity"}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <header className="flex items-center justify-between border-b border-border bg-surface-low/30 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-navy/8 text-navy ring-1 ring-navy/15">
                    <Building2 className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-navy">
                      {g.entity?.name ?? "Sem cliente atribuído"}
                    </h2>
                    {g.entity?.city && (
                      <p className="text-[11px] text-ink-subtle">
                        {g.entity.city}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <Badge label="Turmas" value={g.turmas.length} />
                  <Badge label="Formandos" value={g.totalEnrollments} />
                  <Badge label="Sessões" value={g.totalSessions} />
                </div>
              </header>

              <ul className="divide-y divide-border">
                {g.turmas.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/${params.tenantSlug}/trainer/sessions`}
                      className="flex items-center justify-between gap-3 px-6 py-3 transition-colors hover:bg-surface-low/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                          {t.code}
                        </span>
                        <span className="text-sm font-bold text-navy">
                          {t.course.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-ink-muted">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {t._count.enrollments}
                        </span>
                        <StatusPill status={t.status} />
                        <ArrowRight className="h-3.5 w-3.5 text-ink-faint" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function Badge({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <div className="text-base font-bold tabular-nums text-navy">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-ink-subtle">
        {label}
      </div>
    </div>
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
        "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
        s.cls
      )}
    >
      {s.label}
    </span>
  );
}
