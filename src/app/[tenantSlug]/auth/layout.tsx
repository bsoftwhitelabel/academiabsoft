import Link from "next/link";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { getTenantBySlug } from "@/lib/tenant";

export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantSlug: string };
}) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  const tenantName = tenant?.name ?? "Academia Digital";

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* left — form */}
      <div className="flex flex-col justify-between bg-background px-6 py-8 md:px-12 lg:px-16">
        <div className="flex items-center justify-between">
          <Link
            href={`/${params.tenantSlug}/catalog`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-navy"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar ao catálogo
          </Link>
          <Link
            href={`/${params.tenantSlug}/catalog`}
            className="flex items-center gap-2"
          >
            <div className="grid h-7 w-7 place-items-center rounded-md bg-navy text-white">
              <GraduationCap className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold tracking-tight text-navy">
              {tenantName}
            </span>
          </Link>
        </div>

        <div className="mx-auto w-full max-w-md py-12">{children}</div>

        <p className="text-center text-[11px] text-ink-subtle">
          © {new Date().getFullYear()} {tenantName} · Plataforma white-label
          de formação certificada DGERT
        </p>
      </div>

      {/* right — visual */}
      <div className="relative isolate hidden overflow-hidden bg-navy-radial lg:block">
        <div className="absolute inset-0 opacity-[0.05]" style={{
          backgroundImage:
            "radial-gradient(circle at 25% 30%, white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        <div className="relative flex h-full flex-col items-start justify-end p-12 text-white">
          <span className="mb-3 inline-flex items-center rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold-bright">
            Conformidade DGERT · Multi-tenant · White-label
          </span>
          <h2 className="text-balance text-3xl font-bold leading-tight">
            Formação digital com auditoria pronta a qualquer hora.
          </h2>
          <p className="mt-3 max-w-md text-base leading-relaxed text-surface-low/80">
            Cada turma, sessão e assinatura digital fica auditável em tempo
            real. Os dossiês técnico-pedagógicos estão sempre prontos para a
            DGERT.
          </p>
        </div>
      </div>
    </div>
  );
}
