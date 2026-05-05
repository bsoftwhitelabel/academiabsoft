import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  GraduationCap,
  Clock4,
  Activity,
  ArrowRight,
  Users,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "Cursos · Formador" };

type Props = { params: { tenantSlug: string } };

export default async function TrainerCoursesPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  // Find trainer profile
  const trainerProfile = session.role === "TRAINER"
    ? await prisma.trainer.findUnique({
        where: { userId: session.userId },
        select: { id: true },
      })
    : null;

  // Trainers see only courses they're assigned to via TrainingActions; admins see all
  const courses = await prisma.course.findMany({
    where: {
      tenantId: session.tenantId,
      ...(trainerProfile
        ? {
            trainingActions: {
              some: {
                trainers: { some: { trainerId: trainerProfile.id } },
              },
            },
          }
        : {}),
    },
    include: {
      trainingArea: { select: { name: true } },
      _count: { select: { trainingActions: true, modules: true } },
      trainingActions: {
        where: trainerProfile
          ? { trainers: { some: { trainerId: trainerProfile.id } } }
          : {},
        include: { _count: { select: { enrollments: true, sessions: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  const totalTurmas = courses.reduce(
    (acc, c) => acc + c.trainingActions.length,
    0
  );
  const totalEnrollments = courses.reduce(
    (acc, c) =>
      acc + c.trainingActions.reduce((a, t) => a + t._count.enrollments, 0),
    0
  );
  const totalHours = courses.reduce((acc, c) => acc + c.durationHours, 0);

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[{ label: "Cursos" }]}
        title="Os meus cursos"
        description={
          trainerProfile
            ? `${courses.length} cursos que ministras ativamente`
            : `${courses.length} cursos no tenant (vista admin)`
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Cursos" value={String(courses.length)} icon={GraduationCap} variant="blue" />
        <StatCard label="Turmas" value={String(totalTurmas)} icon={Activity} variant="emerald" />
        <StatCard label="Formandos" value={String(totalEnrollments)} icon={Users} variant="gold" />
        <StatCard label="Horas planeadas" value={`${totalHours}h`} icon={Clock4} variant="purple" />
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-low/40 px-8 py-20 text-center">
          <GraduationCap className="mx-auto mb-4 h-10 w-10 text-ink-faint" />
          <h3 className="text-base font-bold text-navy">Sem cursos atribuídos</h3>
          <p className="mt-1 max-w-md text-sm text-ink-muted mx-auto">
            Quando o administrador te atribuir a uma turma, o curso aparece aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const turmasCount = c.trainingActions.length;
            const formandosCount = c.trainingActions.reduce(
              (a, t) => a + t._count.enrollments,
              0
            );
            return (
              <article
                key={c.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                {/* cover */}
                <div className="relative aspect-[16/10] bg-surface-mid">
                  {c.coverImageUrl ? (
                    <Image
                      src={c.coverImageUrl}
                      alt={c.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-ink-faint">
                      <GraduationCap className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-card/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-navy backdrop-blur-sm">
                    <Clock4 className="h-3 w-3" />
                    {c.durationHours}h
                  </div>
                </div>

                {/* body */}
                <div className="flex flex-1 flex-col p-5">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                    {c.code} · {c.trainingArea?.name ?? "Sem área"}
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-navy">
                    {c.name}
                  </h3>

                  {c.marketingDescription && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                      {c.marketingDescription}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
                    <Stat label="Módulos" value={String(c._count.modules)} />
                    <Stat label="Turmas" value={String(turmasCount)} highlight />
                    <Stat label="Formandos" value={String(formandosCount)} />
                  </div>

                  <Link
                    href={`/${params.tenantSlug}/catalog/${c.slug}`}
                    className="mt-4 inline-flex items-center justify-between rounded-lg border border-border bg-surface-low/40 px-3 py-2 text-xs font-bold text-navy transition-colors hover:bg-surface-low"
                  >
                    <span>Ver no catálogo público</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
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
