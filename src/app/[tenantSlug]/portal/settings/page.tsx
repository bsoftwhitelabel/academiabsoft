import Link from "next/link";
import {
  Save,
  User,
  ShieldCheck,
  Bell,
  Lock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { SessionRequired } from "@/components/dashboard/session-required";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { TraineeSettingsForm } from "@/components/trainee/settings-form";

export const metadata = { title: "Configurações" };

type Props = { params: { tenantSlug: string } };

const DEMO_TRAINEE = {
  fullName: "Mary Luz Oliveira",
  preferredName: "Mary",
  email: "maryluz.oliveira@oportoforte.pt",
  phone: "+351 912 345 678",
  documentNumber: "14587963 9 ZZ0",
  taxId: "500123456",
  birthDate: "1988-05-14",
  address: "Rua da Boavista, 1234, 3º Esq",
  city: "Porto",
  postalCode: "4100-110",
  country: "Portugal",
  profession: "Operadora de Logística",
  qualification: "Licenciatura",
  entityName: "Decathlon Portugal",
  emailVerified: true,
};

export default async function PortalSettingsPage({ params }: Props) {
  const session = await getSession();
  if (!session) {
    return <SessionRequired tenantSlug={params.tenantSlug} title="Configurações" hasBottomNav />;
  }

  const trainee = await prisma.trainee.findUnique({
    where: { userId: session.userId },
    include: {
      user: {
        select: {
          fullName: true,
          preferredName: true,
          email: true,
          phone: true,
          emailVerifiedAt: true,
        },
      },
      entity: { select: { name: true } },
    },
  });

  const isUsingDemoData = !trainee;

  const initial = isUsingDemoData
    ? DEMO_TRAINEE
    : {
        fullName: trainee.user.fullName,
        preferredName: trainee.user.preferredName ?? "",
        email: trainee.user.email,
        phone: trainee.user.phone ?? "",
        documentNumber: trainee.documentNumber ?? "",
        taxId: trainee.taxId ?? "",
        birthDate: trainee.birthDate
          ? trainee.birthDate.toISOString().slice(0, 10)
          : "",
        address: trainee.address ?? "",
        city: trainee.city ?? "",
        postalCode: trainee.postalCode ?? "",
        country: trainee.country ?? "Portugal",
        profession: trainee.profession ?? "",
        qualification: trainee.qualification ?? "",
        entityName: trainee.entity?.name ?? "—",
        emailVerified: !!trainee.user.emailVerifiedAt,
      };

  // Profile completion score
  const fields: Array<keyof typeof initial> = [
    "fullName",
    "email",
    "phone",
    "documentNumber",
    "taxId",
    "birthDate",
    "address",
    "city",
    "postalCode",
    "profession",
    "qualification",
  ];
  const filledCount = fields.filter(
    (k) => String(initial[k] ?? "").trim().length > 0
  ).length;
  const completionPct = Math.round((filledCount / fields.length) * 100);

  return (
    <DashboardShell hasBottomNav>
      <PageHeader
        breadcrumb={[{ label: "Configurações" }]}
        title="Configurações"
        description="Dados pessoais · privacidade RGPD · segurança · notificações"
        actions={
          <Button
            type="submit"
            form="trainee-settings-form"
            className="h-10 gap-1.5 bg-navy text-white hover:bg-navy/90"
          >
            <Save className="h-4 w-4" />
            Guardar alterações
          </Button>
        }
      />

      {isUsingDemoData && (
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-700 ring-1 ring-gold/20">
          <Sparkles className="h-3 w-3" strokeWidth={2.75} />
          Conteúdo demo · serão substituídos pelos teus dados reais
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        {/* Sidebar nav anchors + completion */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
              Perfil completo
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-navy">
              {completionPct}%
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-mid">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-light to-gold"
                style={{ width: `${Math.max(completionPct, 4)}%` }}
              />
            </div>
            <p className="mt-3 text-[11px] text-ink-muted">
              {filledCount} de {fields.length} campos preenchidos.
            </p>
            {completionPct >= 90 && (
              <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                Pronto para certificados DGERT
              </div>
            )}
          </div>

          <nav className="rounded-xl border border-border bg-card p-3">
            <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
              Secções
            </p>
            <a
              href="#identificacao"
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-low/60 hover:text-navy"
            >
              <User className="h-4 w-4" />
              Identificação
            </a>
            <a
              href="#privacidade"
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-low/60 hover:text-navy"
            >
              <ShieldCheck className="h-4 w-4" />
              Privacidade · RGPD
            </a>
            <a
              href="#notificacoes"
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-low/60 hover:text-navy"
            >
              <Bell className="h-4 w-4" />
              Notificações
            </a>
            <a
              href="#seguranca"
              className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-ink-muted transition-colors hover:bg-surface-low/60 hover:text-navy"
            >
              <Lock className="h-4 w-4" />
              Segurança
            </a>
          </nav>

          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
            <h4 className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold text-blue-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Os teus dados estão seguros
            </h4>
            <p className="text-[11px] leading-relaxed text-ink-muted">
              Dados encriptados em repouso e em trânsito. Nunca partilhamos com
              terceiros sem o teu consentimento explícito.
            </p>
            <Link
              href={`/${params.tenantSlug}/portal/profile`}
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline"
            >
              Ver perfil público →
            </Link>
          </div>
        </aside>

        <div>
          <TraineeSettingsForm initial={initial} />
        </div>
      </div>
    </DashboardShell>
  );
}
