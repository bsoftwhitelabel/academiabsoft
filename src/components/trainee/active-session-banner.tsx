import Link from "next/link";
import { Clock, CalendarDays, ArrowRight, FileCheck2, MapPin } from "lucide-react";
import type { ActiveSession } from "@/lib/mock-data";

type Props = {
  session: ActiveSession;
  checkInHref: string;
};

export function ActiveSessionBanner({ session, checkInHref }: Props) {
  return (
    <section className="group relative isolate overflow-hidden rounded-2xl bg-navy-radial p-6 text-white shadow-card-elevated md:p-8">
      {/* gold accent line top */}
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent md:inset-x-8" />

      {/* decorative icon background */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-8 -right-8 opacity-10 md:-bottom-12 md:-right-12"
      >
        <FileCheck2 className="h-48 w-48 rotate-12" strokeWidth={1.25} />
      </div>

      <div className="relative max-w-xl">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-sm">
          {session.isLive && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
            </span>
          )}
          Sessão em curso
        </div>

        <h2 className="text-balance text-2xl font-bold leading-tight md:text-[28px]">
          {session.courseName}
        </h2>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-surface-low/85">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" strokeWidth={2} />
            {session.scheduledStart} – {session.scheduledEnd}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" strokeWidth={2} />
            {session.dateLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" strokeWidth={2} />
            {session.location}
          </span>
        </div>

        <Link
          href={checkInHref}
          className="mt-7 inline-flex items-center gap-2 rounded-lg bg-gold px-5 py-3 text-sm font-bold text-navy shadow-lg shadow-gold/20 transition-all hover:bg-gold-light hover:scale-[1.02]"
        >
          Fazer Check-in Agora
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </Link>
      </div>
    </section>
  );
}
