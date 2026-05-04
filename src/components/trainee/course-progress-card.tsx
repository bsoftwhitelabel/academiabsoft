import Image from "next/image";
import Link from "next/link";
import { CalendarClock, MoreVertical, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TraineeActiveCourse } from "@/lib/mock-data";

type Props = {
  course: TraineeActiveCourse;
};

export function CourseProgressCard({ course }: Props) {
  return (
    <article className="group rounded-xl border border-border bg-card p-5 transition-all hover:shadow-card-hover">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-mid">
            <Image
              src={course.imageUrl}
              alt={course.name}
              fill
              sizes="48px"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-navy">
              {course.name}
            </h3>
            <div className="mt-1 flex items-center gap-2.5">
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                {course.category}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-ink-subtle">
                <Users className="h-3 w-3" />
                {course.group}
              </span>
            </div>
          </div>
        </div>
        <button
          aria-label="Mais opções"
          className="grid h-7 w-7 place-items-center rounded text-ink-faint transition-colors hover:bg-surface-low hover:text-navy"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold">
            <span className="text-ink-muted">Progresso do Módulo</span>
            <span className="text-navy tabular-nums">{course.progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-mid">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                course.progress >= 90
                  ? "bg-emerald-500"
                  : course.progress >= 50
                  ? "bg-gold"
                  : "bg-gold-light"
              )}
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>

        <Link
          href={course.href}
          className="flex items-center justify-between rounded-lg border border-border bg-surface-low/40 p-3 transition-colors hover:border-navy/15 hover:bg-surface-low"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded bg-card text-blue-600 ring-1 ring-border">
              <CalendarClock className="h-4 w-4" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[10px] font-medium text-ink-subtle">
                Sessões {course.sessionsAttended}/{course.sessionsTotal}
              </p>
              <p className="text-xs font-bold text-navy">
                Próxima · {course.nextSessionLabel}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-600 transition-colors group-hover:text-navy">
            Acessar
          </span>
        </Link>
      </div>
    </article>
  );
}
