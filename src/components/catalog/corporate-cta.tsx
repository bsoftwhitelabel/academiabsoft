import Link from "next/link";
import { Building2, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CorporateCta() {
  return (
    <section className="mx-auto max-w-container px-4 pb-16 md:px-8 md:pb-24">
      <div className="relative isolate overflow-hidden rounded-2xl bg-surface-mid p-8 md:p-12">
        {/* subtle gold dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 18%, #CCA823 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative grid grid-cols-1 items-center gap-8 md:grid-cols-[1.4fr_1fr]">
          <div>
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-navy/8 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-navy">
              <CheckCircle2 className="h-3 w-3" strokeWidth={2.75} />
              B2B Personalizado
            </span>
            <h2 className="text-balance text-2xl font-bold leading-tight tracking-tight text-navy md:text-3xl">
              Precisa de formação personalizada para a sua empresa?
            </h2>
            <p className="mt-3 max-w-lg text-base leading-relaxed text-ink-muted">
              Desenhamos planos curriculares adaptados aos objetivos
              estratégicos do seu negócio, com formadores especialistas e
              dossier técnico-pedagógico DGERT incluído.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-11 bg-navy text-white hover:bg-navy/90"
              >
                <Link href="#contact">
                  Solicitar proposta empresa
                  <ArrowUpRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <span className="text-sm font-medium text-ink-muted">
                Resposta em 48h · Consultoria gratuita
              </span>
            </div>
          </div>

          {/* right card */}
          <div className="relative rounded-xl border border-border bg-card p-6 shadow-card-elevated">
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-gold-50 text-gold-700">
              <Building2 className="h-6 w-6" strokeWidth={2} />
            </div>
            <div className="mt-4">
              <p className="text-base font-bold text-navy">
                Soluções Corporativas
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                + de 500 empresas já formadas
              </p>
              <Stat label="NPS médio" value="9.1" />
              <Stat label="Conclusão" value="94%" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm">
      <span className="font-medium text-ink-muted">{label}</span>
      <span className="font-bold tabular-nums text-navy">{value}</span>
    </div>
  );
}
