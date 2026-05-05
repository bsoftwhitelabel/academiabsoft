import Image from "next/image";
import { redirect } from "next/navigation";
import { Users, Search, Filter, BadgeCheck, Clock4 } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn, getInitials } from "@/lib/utils";

export const metadata = { title: "Formandos · Formador" };

type Props = {
  params: { tenantSlug: string };
  searchParams: { q?: string };
};

export default async function TrainerTraineesPage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  const trainerProfile = session.role === "TRAINER"
    ? await prisma.trainer.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      })
    : null;

  // Get all enrollments where the trainer is assigned
  const enrollments = await prisma.enrollment.findMany({
    where: {
      trainingAction: {
        tenantId: session.tenantId,
        ...(trainerProfile
          ? { trainers: { some: { trainerId: trainerProfile.id } } }
          : {}),
      },
      ...(searchParams.q
        ? {
            trainee: {
              user: {
                OR: [
                  { fullName: { contains: searchParams.q, mode: "insensitive" } },
                  { email: { contains: searchParams.q, mode: "insensitive" } },
                ],
              },
            },
          }
        : {}),
    },
    include: {
      trainee: {
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
          entity: { select: { name: true } },
        },
      },
      trainingAction: {
        include: {
          course: { select: { name: true, code: true } },
        },
      },
      _count: { select: { attendances: true } },
    },
    orderBy: { trainee: { user: { fullName: "asc" } } },
  });

  // Group by trainee (one trainee can have multiple enrollments)
  const traineesMap = new Map<
    string,
    {
      trainee: typeof enrollments[number]["trainee"];
      enrollmentCount: number;
      totalAttendances: number;
      courses: string[];
    }
  >();
  for (const e of enrollments) {
    const id = e.trainee.id;
    const cur = traineesMap.get(id) ?? {
      trainee: e.trainee,
      enrollmentCount: 0,
      totalAttendances: 0,
      courses: [],
    };
    cur.enrollmentCount += 1;
    cur.totalAttendances += e._count.attendances;
    cur.courses.push(e.trainingAction.course.code);
    traineesMap.set(id, cur);
  }
  const trainees = Array.from(traineesMap.values()).sort((a, b) =>
    a.trainee.user.fullName.localeCompare(b.trainee.user.fullName)
  );

  const completedCount = trainees.filter((t) => t.totalAttendances > 0).length;
  const presentRate =
    trainees.length > 0
      ? Math.round((completedCount / trainees.length) * 100)
      : 0;

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[{ label: "Formandos" }]}
        title="Os meus formandos"
        description={`${trainees.length} formandos nas tuas turmas · ${enrollments.length} inscrições totais`}
        actions={
          <Button
            variant="outline"
            className="h-10 gap-1.5 border-border bg-card text-navy hover:bg-surface-low"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Formandos únicos" value={String(trainees.length)} icon={Users} variant="blue" />
        <StatCard label="Inscrições" value={String(enrollments.length)} icon={BadgeCheck} variant="emerald" />
        <StatCard label="Com presenças" value={String(completedCount)} icon={Clock4} variant="gold" />
        <StatCard label="Taxa engagement" value={`${presentRate}%`} icon={BadgeCheck} variant="purple" />
      </div>

      <form className="mb-4 flex items-center gap-3 rounded-xl border border-border bg-card p-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <input
            name="q"
            type="text"
            defaultValue={searchParams.q}
            placeholder="Pesquisar por nome ou email..."
            className="form-input pl-9"
          />
        </div>
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-surface-low/40">
            <tr className="text-left">
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                Formando
              </th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                Empresa
              </th>
              <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                Cursos contigo
              </th>
              <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                Inscrições
              </th>
              <th className="px-6 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                Presenças
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {trainees.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-sm font-bold text-navy">
                    Sem formandos ainda
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Os formandos aparecem aqui assim que forem inscritos numa
                    das tuas turmas.
                  </p>
                </td>
              </tr>
            ) : (
              trainees.map((t) => (
                <tr
                  key={t.trainee.id}
                  className="transition-colors hover:bg-surface-low/30"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {t.trainee.user.avatarUrl ? (
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
                          <Image
                            src={t.trainee.user.avatarUrl}
                            alt={t.trainee.user.fullName}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-mid text-xs font-bold text-navy ring-1 ring-border">
                          {getInitials(t.trainee.user.fullName)}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-navy">
                          {t.trainee.user.fullName}
                        </p>
                        <p className="text-[11px] text-ink-subtle">
                          {t.trainee.user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-xs font-semibold text-navy">
                    {t.trainee.entity?.name ?? "—"}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-1">
                      {Array.from(new Set(t.courses)).map((code) => (
                        <span
                          key={code}
                          className="rounded-md bg-blue-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-blue-700"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-surface-mid px-2 text-xs font-bold text-navy">
                      {t.enrollmentCount}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span
                      className={cn(
                        "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold",
                        t.totalAttendances > 0
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {t.totalAttendances}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
