import Link from "next/link";
import Image from "next/image";
import { Clock, Monitor, Users, Layers, ArrowRight, Sparkles } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { MockCourse } from "@/lib/mock-data";

type Props = {
  course: MockCourse;
  href: string;
};

export function CourseCard({ course, href }: Props) {
  const isFeatured = course.isFeatured;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-card transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-card-hover",
        isFeatured
          ? "ring-2 ring-gold ring-offset-2 ring-offset-background"
          : "border border-border"
      )}
    >
      {/* cover image */}
      <Link href={href} className="relative block aspect-[16/10] overflow-hidden bg-surface-mid">
        <Image
          src={course.coverImageUrl}
          alt={course.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {isFeatured && (
          <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-navy shadow-card-elevated">
            <Sparkles className="h-3 w-3" strokeWidth={2.75} />
            Destaque
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>

      {/* body */}
      <div className="flex flex-1 flex-col p-5">
        {/* area + cert pills */}
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded-md bg-navy/8 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-navy ring-1 ring-navy/10">
            {course.area}
          </span>
          {course.certificationLevel === "APROVEITAMENTO" && (
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200/60">
              C/ Aproveitamento
            </span>
          )}
        </div>

        {/* title */}
        <Link
          href={href}
          className="mb-2 line-clamp-2 text-base font-semibold leading-snug text-navy transition-colors group-hover:text-navy/80"
        >
          {course.name}
        </Link>

        {/* description */}
        <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-ink-muted">
          {course.marketingDescription}
        </p>

        {/* meta pills */}
        <div className="mb-5 flex flex-wrap items-center gap-1.5">
          <MetaPill icon={Clock} label={`${course.durationHours}h`} />
          <ModalityPill modality={course.modality} />
        </div>

        {/* footer: price + cta */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
          {course.priceEur !== null ? (
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                Investimento
              </span>
              <span className="text-lg font-bold leading-none text-navy">
                {formatCurrency(course.priceEur)}
              </span>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                Sob Consulta
              </span>
              <span className="text-sm font-bold leading-none text-navy">
                Falar com consultor
              </span>
            </div>
          )}

          <Link
            href={href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all",
              isFeatured
                ? "bg-navy text-white hover:bg-navy/90"
                : "border border-border text-navy hover:bg-surface-low"
            )}
          >
            Saber mais
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function MetaPill({
  icon: Icon,
  label,
}: {
  icon: typeof Clock;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-surface-low px-2 py-1 text-xs font-medium text-ink-muted">
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      {label}
    </span>
  );
}

function ModalityPill({ modality }: { modality: MockCourse["modality"] }) {
  const config = {
    PRESENCIAL: { icon: Users, label: "Presencial" },
    ELEARNING: { icon: Monitor, label: "E-Learning" },
    BLENDED: { icon: Layers, label: "Híbrido" },
  } as const;
  const { icon: Icon, label } = config[modality];
  return <MetaPill icon={Icon} label={label} />;
}
