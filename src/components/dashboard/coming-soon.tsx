import Link from "next/link";
import { Sparkles, ArrowRight, type LucideIcon } from "lucide-react";

type Props = {
  title: string;
  description: string;
  icon?: LucideIcon;
  /** Optional list of "what's coming" bullet points */
  features?: string[];
  /** Backlink to a working page */
  back?: { label: string; href: string };
};

export function ComingSoon({
  title,
  description,
  icon: Icon = Sparkles,
  features,
  back,
}: Props) {
  return (
    <section className="mx-auto max-w-2xl py-12 md:py-20">
      <div className="rounded-2xl border border-gold/20 bg-gradient-to-br from-card to-gold/5 p-8 text-center md:p-12">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-gold/10 text-gold-700 ring-1 ring-gold/20">
          <Icon className="h-7 w-7" strokeWidth={1.75} />
        </div>

        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-700 ring-1 ring-gold/20">
          <Sparkles className="h-3 w-3" strokeWidth={2.75} />
          Em construção
        </span>

        <h1 className="text-balance text-2xl font-bold tracking-tight text-navy md:text-3xl">
          {title}
        </h1>

        <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed text-ink-muted md:text-base">
          {description}
        </p>

        {features && features.length > 0 && (
          <ul className="mx-auto mt-6 max-w-sm space-y-2 text-left">
            {features.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-sm text-ink-muted"
              >
                <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                {f}
              </li>
            ))}
          </ul>
        )}

        {back && (
          <Link
            href={back.href}
            className="mt-8 inline-flex items-center gap-1.5 rounded-lg bg-navy px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-navy/90"
          >
            {back.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </section>
  );
}
