import Link from "next/link";
import { Mail, GraduationCap, ArrowRight, CheckCircle2 } from "lucide-react";
import { getTenantBySlug } from "@/lib/tenant";

export const metadata = { title: "Conta criada" };

type Props = {
  params: { tenantSlug: string };
  searchParams: { email?: string };
};

export default async function OnboardingSuccessPage({
  params,
  searchParams,
}: Props) {
  const tenant = await getTenantBySlug(params.tenantSlug);
  const tenantName = tenant?.name ?? "Academia Digital";
  const email = searchParams.email ?? "o teu email";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-container items-center justify-between px-4 py-4 md:px-8">
          <Link
            href={`/${params.tenantSlug}/catalog`}
            className="flex items-center gap-2"
          >
            <div className="grid h-8 w-8 place-items-center rounded-md bg-navy text-white">
              <GraduationCap className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-navy">{tenantName}</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-16 md:px-8 md:py-24">
        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 p-8 text-center ring-1 ring-emerald-200/60 md:p-12">
          <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" strokeWidth={2.5} />
          </div>
          <h1 className="text-balance text-3xl font-bold leading-tight text-navy md:text-4xl">
            Conta criada com sucesso!
          </h1>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-ink-muted">
            Enviámos um <strong className="text-navy">magic-link</strong> para{" "}
            <strong className="text-navy">{email}</strong>. Toca nele para
            entrares no portal de formando.
          </p>

          <div className="mx-auto mt-8 max-w-sm rounded-xl border border-border bg-card p-5 text-left">
            <h3 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
              Próximos passos
            </h3>
            <ol className="space-y-2 text-sm text-ink-muted">
              <Step n={1}>
                Abre a tua caixa de entrada (verifica também spam).
              </Step>
              <Step n={2}>
                Toca no botão &ldquo;Aceder ao Portal&rdquo;.
              </Step>
              <Step n={3}>
                Explora os cursos e inscreve-te quando quiseres.
              </Step>
            </ol>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`/${params.tenantSlug}/auth/magic-link`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2 text-xs font-bold text-navy hover:bg-surface-low"
            >
              <Mail className="h-3.5 w-3.5" />
              Reenviar magic-link
            </Link>
            <Link
              href={`/${params.tenantSlug}/catalog`}
              className="inline-flex items-center gap-1.5 rounded-md bg-navy px-4 py-2 text-xs font-bold text-white hover:bg-navy/90"
            >
              Ver catálogo
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-navy text-[10px] font-bold text-white">
        {n}
      </span>
      <span className="leading-relaxed">{children}</span>
    </li>
  );
}
