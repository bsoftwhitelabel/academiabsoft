import Link from "next/link";
import { ArrowLeft, MapPin, User2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CheckinFlow } from "@/components/signature/checkin-flow";
import { MOCK_ACTIVE_SESSION } from "@/lib/mock-data";

export const metadata = { title: "Check-in da Sessão" };

type Props = {
  params: { tenantSlug: string; sessionId: string };
};

export default function SessionCheckinPage({ params }: Props) {
  const session = MOCK_ACTIVE_SESSION;

  return (
    <DashboardShell hasBottomNav>
      <Link
        href={`/${params.tenantSlug}/portal/dashboard`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-navy"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar ao painel
      </Link>

      {/* session summary card */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-6">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200/60">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
          Sessão em curso
        </span>
        <h1 className="text-h1 font-bold text-navy">{session.courseName}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
          <span className="font-semibold text-navy">
            {session.scheduledStart} – {session.scheduledEnd}
          </span>
          <span>·</span>
          <span>{session.dateLabel}</span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {session.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <User2 className="h-3.5 w-3.5" />
            {session.trainerName}
          </span>
        </div>
      </div>

      <CheckinFlow
        sessionTitle={session.courseName}
        scheduledStart={session.scheduledStart}
        scheduledEnd={session.scheduledEnd}
        demoMode
      />
    </DashboardShell>
  );
}
