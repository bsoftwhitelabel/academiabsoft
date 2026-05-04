import Link from "next/link";
import { CheckCircle2, Timer, Award, ChevronRight } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActiveSessionBanner } from "@/components/trainee/active-session-banner";
import { CourseProgressCard } from "@/components/trainee/course-progress-card";
import { ActivityTimeline } from "@/components/trainee/activity-timeline";
import { MilestoneCard } from "@/components/trainee/milestone-card";
import { getSession } from "@/lib/auth/session";
import {
  MOCK_TRAINEE,
  MOCK_ACTIVE_SESSION,
  MOCK_TRAINEE_COURSES,
  MOCK_ACTIVITIES,
  MOCK_MILESTONE,
} from "@/lib/mock-data";

export const metadata = { title: "Painel" };

type Props = { params: { tenantSlug: string } };

export default async function TraineeDashboard({ params }: Props) {
  const session = await getSession();
  const greetingName = session
    ? session.fullName.split(" ")[0]
    : MOCK_TRAINEE.preferredName;

  return (
    <DashboardShell hasBottomNav>
      {/* welcome */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-h1 font-bold tracking-tight text-navy">
          Olá, {greetingName}!
        </h1>
        <p className="mt-1 text-body-lg text-ink-muted">
          Bem-vinda ao seu painel. Confira suas atividades para hoje.
        </p>
      </div>

      {/* active session hero */}
      <div className="mb-6 md:mb-8">
        <ActiveSessionBanner
          session={MOCK_ACTIVE_SESSION}
          checkInHref={`/${params.tenantSlug}/portal/sessions/${MOCK_ACTIVE_SESSION.id}/checkin`}
        />
      </div>

      {/* stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
        <StatCard
          label="Cursos Concluídos"
          value="4"
          icon={CheckCircle2}
          variant="blue"
        />
        <StatCard
          label="Horas Acumuladas"
          value="125h"
          icon={Timer}
          variant="gold"
        />
        <StatCard
          label="Certificados"
          value="3"
          icon={Award}
          variant="emerald"
        />
      </div>

      {/* active courses */}
      <section className="mb-8 md:mb-10">
        <header className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-h2 font-bold text-navy">Meus Cursos Ativos</h2>
            <p className="mt-0.5 text-xs text-ink-subtle">
              {MOCK_TRAINEE_COURSES.length} em curso · próxima sessão em
              destaque
            </p>
          </div>
          <Link
            href={`/${params.tenantSlug}/portal/courses`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition-colors hover:text-navy"
          >
            Ver todos
            <ChevronRight className="h-4 w-4" />
          </Link>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {MOCK_TRAINEE_COURSES.map((course) => (
            <CourseProgressCard key={course.id} course={course} />
          ))}
        </div>
      </section>

      {/* secondary row: activities + milestone */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <header className="mb-6 flex items-center justify-between">
            <h3 className="text-h3 font-bold text-navy">Atividades Recentes</h3>
            <Link
              href={`/${params.tenantSlug}/portal/history`}
              className="text-xs font-semibold text-blue-600 hover:text-navy"
            >
              Histórico completo
            </Link>
          </header>
          <ActivityTimeline activities={MOCK_ACTIVITIES} />
        </div>
        <MilestoneCard
          level={MOCK_MILESTONE.level}
          description={MOCK_MILESTONE.description}
          currentHours={MOCK_MILESTONE.currentHours}
          targetHours={MOCK_MILESTONE.targetHours}
        />
      </div>
    </DashboardShell>
  );
}
