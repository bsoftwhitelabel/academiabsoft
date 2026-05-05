import Link from "next/link";
import Image from "next/image";
import { SessionRequired } from "@/components/dashboard/session-required";
import {
  Mail,
  Phone,
  MapPin,
  IdCard,
  GraduationCap,
  Briefcase,
  Settings,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn, formatDate, getInitials } from "@/lib/utils";

export const metadata = { title: "Perfil" };

type Props = { params: { tenantSlug: string } };

export default async function PortalProfilePage({ params }: Props) {
  const session = await getSession();
  if (!session) {
    return <SessionRequired tenantSlug={params.tenantSlug} title="Perfil" hasBottomNav />;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      traineeProfile: {
        include: {
          enrollments: { select: { id: true } },
          entity: { select: { name: true } },
        },
      },
    },
  });

  if (!user) {
    return (
      <DashboardShell hasBottomNav>
        <PageHeader title="Perfil" />
        <p className="text-sm text-ink-muted">Utilizador não encontrado.</p>
      </DashboardShell>
    );
  }

  const trainee = user.traineeProfile;
  const totalEnrollments = trainee?.enrollments.length ?? 0;

  return (
    <DashboardShell hasBottomNav>
      <PageHeader
        breadcrumb={[{ label: "Perfil" }]}
        title="O teu perfil"
        description="Dados pessoais usados nos certificados DGERT"
        actions={
          <Button asChild className="h-10 gap-1.5 bg-navy text-white hover:bg-navy/90">
            <Link href={`/${params.tenantSlug}/portal/settings`}>
              <Settings className="h-4 w-4" />
              Editar
            </Link>
          </Button>
        }
      />

      {/* Hero card */}
      <section className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">
        <div className="relative h-24 bg-gradient-to-r from-navy via-navy/90 to-navy/70" />
        <div className="-mt-12 px-6 pb-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:gap-6">
            {user.avatarUrl ? (
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full ring-4 ring-card">
                <Image
                  src={user.avatarUrl}
                  alt={user.fullName}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="grid h-24 w-24 shrink-0 place-items-center rounded-full bg-navy text-2xl font-bold text-white ring-4 ring-card">
                {getInitials(user.fullName)}
              </div>
            )}

            <div className="min-w-0 flex-1 pt-3 sm:pt-0 sm:pb-1">
              <h2 className="truncate text-xl font-bold text-navy">
                {user.fullName}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </span>
                {user.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {user.phone}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    user.isActive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                  {user.isActive ? "Conta ativa" : "Inativa"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-navy/8 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-navy">
                  Formando
                </span>
                {trainee?.entity && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-700">
                    <Briefcase className="h-3 w-3" strokeWidth={2.5} />
                    {trainee.entity.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Identidade */}
        <Card icon={IdCard} title="Identidade">
          <Field label="Nome completo" value={user.fullName} />
          <Field label="Email" value={user.email} />
          <Field label="Telefone" value={user.phone ?? "—"} />
          {trainee && (
            <>
              <Field label="NIF" value={trainee.taxId ?? "—"} />
              <Field
                label="Data de nascimento"
                value={trainee.birthDate ? formatDate(trainee.birthDate) : "—"}
              />
              <Field
                label="Documento"
                value={
                  trainee.documentNumber
                    ? `${trainee.documentType ?? "Doc"} · ${trainee.documentNumber}`
                    : "—"
                }
              />
            </>
          )}
        </Card>

        {/* Morada */}
        <Card icon={MapPin} title="Morada">
          {trainee ? (
            <>
              <Field label="Endereço" value={trainee.address ?? "—"} />
              <Field label="Código postal" value={trainee.postalCode ?? "—"} />
              <Field label="Localidade" value={trainee.city ?? "—"} />
              <Field label="País" value={trainee.country ?? "Portugal"} />
            </>
          ) : (
            <p className="text-xs text-ink-muted">Sem dados registados.</p>
          )}
        </Card>

        {/* Académico/Profissional */}
        <Card icon={GraduationCap} title="Formação e profissão">
          {trainee ? (
            <>
              <Field
                label="Habilitações"
                value={trainee.qualification ?? "—"}
              />
              <Field label="Profissão" value={trainee.profession ?? "—"} />
              <Field
                label="Situação profissional"
                value={trainee.employmentStatus ?? "—"}
              />
            </>
          ) : (
            <p className="text-xs text-ink-muted">Sem dados registados.</p>
          )}
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Stats */}
        <Card icon={Briefcase} title="Resumo">
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Inscrições"
              value={String(totalEnrollments)}
              accent="navy"
            />
            <Stat
              label="Membro desde"
              value={formatDate(user.createdAt)}
              accent="muted"
            />
          </div>
        </Card>

        {/* Hint card */}
        <article className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Por que estes dados?
            </h3>
          </div>
          <p className="text-sm leading-relaxed text-ink-muted">
            A informação aqui registada será impressa nos certificados DGERT
            emitidos no final de cada formação. Garante que está atualizada
            antes do fim de cada turma. Para alterar qualquer campo, abre as{" "}
            <Link
              href={`/${params.tenantSlug}/portal/settings`}
              className="font-bold text-blue-700 hover:underline"
            >
              configurações
            </Link>
            .
          </p>
        </article>
      </div>
    </DashboardShell>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof IdCard;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-navy/8 text-navy">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-subtle">
          {title}
        </h3>
      </div>
      <dl className="space-y-3">{children}</dl>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
        {label}
      </dt>
      <dd className="truncate text-right text-xs font-bold text-navy">
        {value}
      </dd>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "navy" | "muted";
}) {
  return (
    <div className="rounded-xl bg-surface-low/60 p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-ink-subtle">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-base font-bold tabular-nums",
          accent === "navy" ? "text-navy" : "text-ink-muted"
        )}
      >
        {value}
      </p>
    </div>
  );
}
