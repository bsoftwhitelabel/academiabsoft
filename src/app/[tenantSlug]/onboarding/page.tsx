import Link from "next/link";
import { GraduationCap, ArrowLeft, ShieldCheck } from "lucide-react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { listTenantEntities } from "./actions";
import { getTenantBySlug } from "@/lib/tenant";

export const metadata = {
  title: "Inscrição · Formando",
  description:
    "Crie a sua conta e aceda ao portal de formando — sem password, com magic-link.",
};

type Props = { params: { tenantSlug: string } };

export default async function OnboardingPage({ params }: Props) {
  const [tenant, entities] = await Promise.all([
    getTenantBySlug(params.tenantSlug),
    listTenantEntities(params.tenantSlug),
  ]);
  const tenantName = tenant?.name ?? "Academia Digital";

  return (
    <div className="min-h-screen bg-background">
      {/* topbar */}
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
          <Link
            href={`/${params.tenantSlug}/auth/login`}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Já tens conta? Entrar →
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-container px-4 py-12 md:px-8 md:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.6fr]">
          {/* left: pitch */}
          <aside className="lg:sticky lg:top-12 lg:self-start">
            <Link
              href={`/${params.tenantSlug}/catalog`}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-navy"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao catálogo
            </Link>

            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-700 ring-1 ring-gold/20">
              <ShieldCheck className="h-3 w-3" strokeWidth={2.75} />
              3 passos · sem password
            </span>

            <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-navy md:text-4xl">
              Cria a tua conta de formando
            </h1>
            <p className="mt-3 max-w-md text-base leading-relaxed text-ink-muted">
              Acedes ao portal por magic-link no email, sem password. Os dados
              registados são usados apenas para emissão dos certificados DGERT.
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              <Pitch
                num="1"
                title="Os teus dados"
                body="Nome, email e contactos básicos."
              />
              <Pitch
                num="2"
                title="Empresa associada"
                body="Liga a tua conta a uma empresa-cliente, ou regista uma nova."
              />
              <Pitch
                num="3"
                title="Confirmação por email"
                body="Recebes magic-link no email para entrar no portal."
              />
            </ul>
          </aside>

          {/* right: wizard form */}
          <div className="rounded-2xl border border-border bg-card p-6 shadow-card-elevated md:p-8">
            <OnboardingWizard
              tenantSlug={params.tenantSlug}
              entities={entities}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Pitch({
  num,
  title,
  body,
}: {
  num: string;
  title: string;
  body: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-navy text-[11px] font-bold text-white">
        {num}
      </span>
      <div>
        <p className="text-sm font-bold text-navy">{title}</p>
        <p className="mt-0.5 text-xs text-ink-muted">{body}</p>
      </div>
    </li>
  );
}
