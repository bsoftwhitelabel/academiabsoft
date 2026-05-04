"use client";

import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Users, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MockCourse } from "@/lib/mock-data";

const AREA_PILL = "bg-purple-50 text-purple-700 ring-purple-200/50";
const MODALITY_PILL: Record<MockCourse["modality"], string> = {
  PRESENCIAL: "bg-emerald-50 text-emerald-700 ring-emerald-200/50",
  ELEARNING: "bg-blue-50 text-blue-700 ring-blue-200/50",
  BLENDED: "bg-gold-50 text-gold-700 ring-gold-200/50",
};

const MODALITY_LABEL: Record<MockCourse["modality"], string> = {
  PRESENCIAL: "Presencial",
  ELEARNING: "E-learning",
  BLENDED: "Híbrido",
};

type Props = {
  course: MockCourse;
  href: string;
};

export function CourseGridCard({ course, href }: Props) {
  const isArchived = course.isArchived;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover",
        isArchived && "opacity-90"
      )}
    >
      {/* image */}
      <Link
        href={href}
        className="relative block aspect-[4/3] overflow-hidden bg-surface-mid"
      >
        <Image
          src={course.coverImageUrl}
          alt={course.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className={cn(
            "object-cover transition-transform duration-500 group-hover:scale-105",
            isArchived && "grayscale-[35%]"
          )}
        />

        {isArchived && (
          <div className="absolute inset-0 flex items-center justify-center bg-navy/40 backdrop-blur-[1px]">
            <span className="rounded-md bg-white/95 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-navy shadow-card-elevated">
              Arquivado
            </span>
          </div>
        )}

        <button
          aria-label="Mais opções"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md bg-white/90 text-ink-muted shadow-card-elevated transition-colors hover:bg-white hover:text-navy"
          onClick={(e) => e.preventDefault()}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </Link>

      {/* body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
              AREA_PILL
            )}
          >
            {course.area.split(" ")[0]}
          </span>
          <span
            className={cn(
              "rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
              MODALITY_PILL[course.modality]
            )}
          >
            {MODALITY_LABEL[course.modality]}
          </span>
        </div>

        <Link
          href={href}
          className="mb-4 line-clamp-2 text-base font-bold leading-snug text-navy transition-colors group-hover:text-navy/80"
        >
          {course.name}
        </Link>

        <div className="mt-auto flex items-center gap-5 border-t border-border pt-3 text-xs">
          <Stat icon={CalendarDays} label="Turmas" value={course.turmasCount ?? 0} />
          <Stat icon={Users} label="Formandos" value={course.formandosCount ?? 0} />
        </div>
      </div>
    </article>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays;
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex items-center gap-2 text-ink-muted">
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      <div className="leading-tight">
        <div className="text-[11px] font-bold tabular-nums text-navy">{value}</div>
        <div className="text-[10px] uppercase tracking-wide text-ink-subtle">
          {label}
        </div>
      </div>
    </div>
  );
}

export function CourseAddCard({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-surface-low/40 p-8 text-center transition-colors hover:border-navy/30 hover:bg-surface-low"
    >
      <div className="grid h-12 w-12 place-items-center rounded-full bg-card text-ink-muted ring-1 ring-border">
        <span className="text-2xl leading-none">+</span>
      </div>
      <div>
        <p className="text-sm font-bold text-navy">Adicionar Novo Curso</p>
        <p className="mt-1 text-xs text-ink-muted">
          Crie uma nova estrutura de formação para a sua organização
        </p>
      </div>
    </Link>
  );
}
