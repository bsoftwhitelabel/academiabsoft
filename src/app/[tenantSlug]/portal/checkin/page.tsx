import Link from "next/link";
import {
  QrCode,
  Clock4,
  MapPin,
  ArrowRight,
  Inbox,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { SessionRequired } from "@/components/dashboard/session-required";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

export const metadata = { title: "Check-in" };

type Props = { params: { tenantSlug: string } };

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDateLong(d: Date): string {
  return d.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export default async function PortalCheckinPage({ params }: Props) {
  const session = await getSession();
  if (!session) {
    return <SessionRequired tenantSlug={params.tenantSlug} title="Check-in" hasBottomNav />;
  }

  const trainee = await prisma.trainee.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!trainee) {
    return (
      <DashboardShell hasBottomNav>
        <PageHeader title="Check-in" />
        <p className="text-sm text-ink-muted">
          Perfil de formando não encontrado.
        </p>
      </DashboardShell>
    );
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const upcoming = await prisma.session.findMany({
    where: {
      attendances: { some: { traineeId: trainee.id } },
      scheduledStart: { lte: in24h },
      scheduledEnd: { gte: now },
    },
    include: {
      trainingAction: {
        include: {
          course: { select: { name: true, code: true } },
          entity: { select: { name: true } },
        },
      },
      attendances: {
        where: { traineeId: trainee.id },
        select: { status: true, signatureState: true },
      },
    },
    orderBy: { scheduledStart: "asc" },
    take: 5,
  });

  const live = upcoming.filter(
    (s) => s.scheduledStart <= now && s.scheduledEnd >= now
  );
  const next = upcoming.filter((s) => s.scheduledStart > now);

  return (
    <DashboardShell hasBottomNav>
      <PageHeader
        breadcrumb={[{ label: "Check-in" }]}
        title="Check-in"
        description="Registo de presença nas tuas sessões"
      />

      {/* Live sessions banner */}
      {live.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-700">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            A decorrer agora
          </h2>
          <div className="space-y-3">
            {live.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                tenantSlug={params.tenantSlug}
                isLive
              />
            ))}
          </div>
        </section>
      )}

      {/* Next 24h */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-ink-subtle">
          Próximas 24 horas
        </h2>
        {next.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-low/40 px-6 py-12 text-center">
            <Inbox className="mx-auto mb-3 h-8 w-8 text-ink-faint" />
            <h3 className="text-base font-bold text-navy">
              Sem sessões nas próximas 24h
            </h3>
            <p className="mt-1 text-sm text-ink-muted">
              Verifica o teu calendário para ver a próxima sessão.
            </p>
            <Link
              href={`/${params.tenantSlug}/portal/calendar`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-navy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-navy/90"
            >
              <Calendar className="h-3.5 w-3.5" />
              Ver calendário
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {next.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                tenantSlug={params.tenantSlug}
              />
            ))}
          </div>
        )}
      </section>

      {/* Info card */}
      <section className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-100 text-blue-700">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-navy">
              Como funciona o check-in?
            </h3>
            <ol className="mt-2 space-y-1.5 text-xs text-ink-muted">
              <li className="flex gap-2">
                <span className="font-bold text-navy">1.</span>
                <span>
                  Toca em <strong>Fazer check-in</strong> na sessão que estás a
                  assistir.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-navy">2.</span>
                <span>
                  O formador valida o teu registo em tempo real.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-navy">3.</span>
                <span>
                  No fim da sessão, assinas digitalmente quando o formador
                  desbloquear (DGERT compliant).
                </span>
              </li>
            </ol>
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}

type SessionWithRels = Awaited<
  ReturnType<typeof prisma.session.findMany>
>[number] & {
  trainingAction: {
    code: string;
    location: string | null;
    room: string | null;
    course: { name: string; code: string };
    entity: { name: string } | null;
  };
  attendances: Array<{ status: string; signatureState: string }>;
};

function SessionCard({
  session,
  tenantSlug,
  isLive,
}: {
  session: SessionWithRels;
  tenantSlug: string;
  isLive?: boolean;
}) {
  const ta = session.trainingAction;
  const att = session.attendances[0];
  const checkedIn =
    att?.status === "PRESENT" ||
    att?.status === "CHECKED_IN" ||
    att?.status === "MANUAL_PRESENT";
  const signed = att?.signatureState === "SIGNED";

  return (
    <Link
      href={`/${tenantSlug}/portal/sessions/${session.id}/checkin`}
      className={cn(
        "flex items-start gap-4 rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-card-hover",
        isLive
          ? "border-emerald-300 ring-1 ring-emerald-200/60"
          : "border-border"
      )}
    >
      <div
        className={cn(
          "grid h-12 w-12 shrink-0 place-items-center rounded-lg",
          isLive
            ? "bg-emerald-500 text-white"
            : "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60"
        )}
      >
        <QrCode className="h-5 w-5" strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-bold text-navy">
              {ta.course.name}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink-subtle">
              {ta.code} · sessão {session.number}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {checkedIn && (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                Presente
              </span>
            )}
            {signed && (
              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold-700">
                Assinada
              </span>
            )}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
          <span className="inline-flex items-center gap-1">
            <Clock4 className="h-3 w-3" />
            {fmtDateLong(session.scheduledStart)} · {fmtTime(session.scheduledStart)}
            {"–"}
            {fmtTime(session.scheduledEnd)}
          </span>
          {(ta.location || ta.room) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {[ta.location, ta.room].filter(Boolean).join(" · ")}
            </span>
          )}
        </div>
      </div>

      <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-ink-muted" />
    </Link>
  );
}
