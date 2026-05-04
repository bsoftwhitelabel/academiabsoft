import { Button } from "@/components/ui/button";
import { BadgeCheck } from "lucide-react";

type Props = {
  badge?: string;
  title: string;
  subtitle: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
};

export function HeroSection({
  badge = "Certificação Oficial DGERT",
  title,
  subtitle,
  primaryCta,
  secondaryCta,
}: Props) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-radial">
      {/* texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 25% 30%, white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* gold accent line top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

      <div className="relative mx-auto flex max-w-container flex-col items-center px-4 py-20 text-center md:py-28 md:px-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-bright">
          <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2.5} />
          {badge}
        </div>

        <h1 className="max-w-3xl text-balance text-4xl font-bold leading-[1.1] tracking-tight text-white md:text-5xl lg:text-[56px]">
          {title}
        </h1>

        <p className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-surface-low/85 md:text-lg">
          {subtitle}
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 bg-white px-8 text-navy hover:bg-surface-low shadow-navy-glow"
          >
            <a href={primaryCta.href}>{primaryCta.label}</a>
          </Button>
          {secondaryCta && (
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-white/30 bg-transparent px-8 text-white backdrop-blur-sm hover:bg-white/10 hover:text-white"
            >
              <a href={secondaryCta.href}>{secondaryCta.label}</a>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
