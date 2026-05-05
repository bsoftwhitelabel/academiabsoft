import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Sparkles,
  Users,
  GraduationCap,
  Activity,
  Award,
  ArrowRight,
  AlertTriangle,
  Mail,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { getSession } from "@/lib/auth/session";
import { PLANS, getPlan, getTenantPlan, getTenantUsage } from "@/lib/billing";
import { cn, formatCurrency } from "@/lib/utils";

export const metadata = { title: "Faturação · Plano e uso" };

type Props = { params: { tenantSlug: string } };

export default async function AdminBillingPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);
  if (session.role !== "ADMIN" && session.role !== "OWNER") {
    redirect(`/${params.tenantSlug}/catalog`);
  }

  const [{ tier, since }, usage] = await Promise.all([
    getTenantPlan(session.tenantId),
    getTenantUsage(session.tenantId),
  ]);
  const current = getPlan(tier);

  const usageRows: Array<{
    label: string;
    icon: typeof Users;
    used: number;
    limit: number;
    unit: string;
  }> = [
    {
      label: "Formandos",
      icon: Users,
      used: usage.trainees,
      limit: current.limits.trainees,
      unit: "formandos",
    },
    {
      label: "Cursos ativos",
      icon: GraduationCap,
      used: usage.activeCourses,
      limit: current.limits.activeCourses,
      unit: "cursos",
    },
    {
      label: "Turmas ativas",
      icon: Activity,
      used: usage.activeTrainingActions,
      limit: current.limits.activeTrainingActions,
      unit: "turmas",
    },
    {
      label: "Certificados (mês)",
      icon: Award,
      used: usage.monthlyCertificates,
      limit: current.limits.monthlyCertificates,
      unit: "certificados",
    },
  ];

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[
          { label: "Gestão", href: `/${params.tenantSlug}/admin` },
          { label: "Faturação" },
        ]}
        title="Faturação · Plano e uso"
        description="Acompanha o uso atual e compara planos. Pagamentos são processados via Stripe (em breve)."
      />

      <div className="rounded-lg border border-amber-300 bg-amber-50/40 p-4 mb-6 text-sm text-amber-900 ring-1 ring-amber-200/40">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <strong>Preview:</strong> tarifas e limites são placeholder até as
            regras comerciais BSoft × Oporto Forte serem finalizadas. Pagamento
            via Stripe Connect entra na FASE 5.x final.
          </p>
        </div>
      </div>

      {/* Current plan card */}
      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border-2 border-navy/15 bg-card p-6 shadow-card-elevated">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                Plano atual
              </p>
              <h2 className="mt-1 text-2xl font-bold text-navy">
                {current.name}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {current.description}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-ink-subtle">Investimento</p>
              <p className="text-xl font-bold tabular-nums text-navy">
                {current.pricePerMonthEur === null
                  ? "Sob consulta"
                  : current.pricePerMonthEur === 0
                  ? "Grátis"
                  : `${formatCurrency(current.pricePerMonthEur)}/mês`}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 text-xs md:grid-cols-3">
            <Feature on={current.limits.customDomain} label="Custom domain" />
            <Feature on={current.limits.advancedReports} label="Relatórios avançados" />
            <Feature on={current.limits.apiAccess} label="API access" />
          </div>

          {since && (
            <p className="mt-4 text-[11px] text-ink-subtle">
              Cliente desde {since.toLocaleDateString("pt-PT")}
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-3 flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-navy">
              Mudar de plano
            </h3>
          </div>
          <p className="text-xs leading-relaxed text-ink-muted">
            Para alterar, contacta o gestor da plataforma. Após aceitação,
            ajustamos o plano sem downtime.
          </p>
          <a
            href="mailto:hello@bsoft.io?subject=Pedido%20de%20mudanca%20de%20plano"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-navy/90"
          >
            <Mail className="h-3 w-3" />
            Solicitar mudança
          </a>
        </article>
      </section>

      {/* Usage panel */}
      <section className="mb-10">
        <header className="mb-4 flex items-baseline justify-between">
          <h2 className="text-base font-bold text-navy">
            Utilização este mês
          </h2>
          <span className="text-[11px] text-ink-subtle">
            atualizado em tempo real
          </span>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {usageRows.map((u) => (
            <UsageBar key={u.label} {...u} />
          ))}
        </div>
      </section>

      {/* Plans grid */}
      <section>
        <header className="mb-6">
          <h2 className="text-lg font-bold text-navy">
            Catálogo de planos
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Comparação completa. Mudanças mid-cycle são pro-rata.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              isCurrent={p.id === current.id}
              tenantSlug={params.tenantSlug}
            />
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}

function UsageBar({
  label,
  icon: Icon,
  used,
  limit,
  unit,
}: {
  label: string;
  icon: typeof Users;
  used: number;
  limit: number;
  unit: string;
}) {
  const isUnlimited = limit >= Number.MAX_SAFE_INTEGER / 2;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const warn = pct >= 80 && pct < 100;
  const exceeded = pct >= 100;

  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <header className="mb-3 flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-md bg-navy/8 text-navy">
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-ink-subtle">
          {label}
        </p>
      </header>
      <p className="mb-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums text-navy">
          {used}
        </span>
        <span className="text-xs text-ink-muted">
          {isUnlimited ? "sem limite" : `de ${limit} ${unit}`}
        </span>
      </p>
      {!isUnlimited && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-mid">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              exceeded
                ? "bg-red-500"
                : warn
                ? "bg-amber-500"
                : "bg-emerald-500"
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {exceeded && (
        <p className="mt-2 text-[10px] font-bold text-red-700">
          Limite excedido — fazer upgrade.
        </p>
      )}
    </article>
  );
}

function Feature({ on, label }: { on: boolean; label: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1",
        on
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60"
          : "bg-slate-100 text-slate-500"
      )}
    >
      <CheckCircle2
        className={cn("h-3 w-3", on ? "text-emerald-600" : "text-slate-300")}
        strokeWidth={2.5}
      />
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function PlanCard({
  plan,
  isCurrent,
  tenantSlug: _tenantSlug,
}: {
  plan: (typeof PLANS)[number];
  isCurrent: boolean;
  tenantSlug: string;
}) {
  const isUnlimitedTrainees =
    plan.limits.trainees >= Number.MAX_SAFE_INTEGER / 2;

  return (
    <article
      className={cn(
        "flex flex-col rounded-2xl border-2 bg-card p-5 transition-all",
        isCurrent
          ? "border-navy ring-2 ring-navy/15"
          : plan.isFeatured
          ? "border-gold ring-1 ring-gold/30"
          : "border-border"
      )}
    >
      {plan.isFeatured && !isCurrent && (
        <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-md bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
          <Sparkles className="h-3 w-3" strokeWidth={2.75} />
          Mais escolhido
        </span>
      )}
      {isCurrent && (
        <span className="mb-3 inline-flex w-fit items-center gap-1 rounded-md bg-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
          <CheckCircle2 className="h-3 w-3" />
          Plano atual
        </span>
      )}

      <h3 className="text-lg font-bold text-navy">{plan.name}</h3>
      <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
        {plan.description}
      </p>

      <div className="my-4 border-y border-border py-3">
        <p className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums text-navy">
            {plan.pricePerMonthEur === null
              ? "Sob consulta"
              : plan.pricePerMonthEur === 0
              ? "Grátis"
              : formatCurrency(plan.pricePerMonthEur)}
          </span>
          {plan.pricePerMonthEur !== null && plan.pricePerMonthEur > 0 && (
            <span className="text-xs text-ink-muted">/mês</span>
          )}
        </p>
      </div>

      <ul className="space-y-1.5 text-xs">
        <PlanFeature
          label={
            isUnlimitedTrainees
              ? "Formandos sem limite"
              : `${plan.limits.trainees} formandos`
          }
        />
        <PlanFeature
          label={
            plan.limits.activeCourses >= Number.MAX_SAFE_INTEGER / 2
              ? "Cursos sem limite"
              : `${plan.limits.activeCourses} cursos ativos`
          }
        />
        <PlanFeature
          label={
            plan.limits.monthlyCertificates >= Number.MAX_SAFE_INTEGER / 2
              ? "Certificados sem limite"
              : `${plan.limits.monthlyCertificates} cert./mês`
          }
        />
        <PlanFeature label="Custom domain" on={plan.limits.customDomain} />
        <PlanFeature label="Relatórios avançados" on={plan.limits.advancedReports} />
        <PlanFeature label="API access" on={plan.limits.apiAccess} />
      </ul>

      {!isCurrent && (
        <a
          href={`mailto:hello@bsoft.io?subject=Mudar%20para%20plano%20${plan.name}`}
          className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-xs font-bold uppercase tracking-wider text-navy hover:bg-surface-low"
        >
          Mudar para {plan.name}
          <ArrowRight className="h-3 w-3" />
        </a>
      )}
    </article>
  );
}

function PlanFeature({ label, on = true }: { label: string; on?: boolean }) {
  return (
    <li
      className={cn(
        "flex items-start gap-1.5",
        !on && "text-ink-faint line-through"
      )}
    >
      <CheckCircle2
        className={cn(
          "mt-0.5 h-3 w-3 shrink-0",
          on ? "text-emerald-600" : "text-ink-faint"
        )}
        strokeWidth={2.5}
      />
      <span className={on ? "text-ink-muted" : ""}>{label}</span>
    </li>
  );
}
