import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Award,
  Download,
  QrCode,
  CheckCircle2,
  Clock4,
  ArrowRight,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Certificados" };

type Props = { params: { tenantSlug: string } };

export default async function PortalCertificatesPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  const trainee = await prisma.trainee.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  if (!trainee) {
    return (
      <DashboardShell hasBottomNav>
        <PageHeader title="Certificados" />
        <p className="text-sm text-ink-muted">
          O perfil de formando não foi encontrado.
        </p>
      </DashboardShell>
    );
  }

  const [certificates, completedTurmas] = await Promise.all([
    prisma.certificate.findMany({
      where: { traineeId: trainee.id },
      include: {
        trainingAction: {
          include: {
            course: {
              select: {
                name: true,
                code: true,
                durationHours: true,
                certificationLevel: true,
              },
            },
            entity: { select: { name: true } },
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    }),
    prisma.enrollment.count({
      where: {
        traineeId: trainee.id,
        trainingAction: { status: "COMPLETED" },
      },
    }),
  ]);

  // pending: completed enrollments without certificate yet
  const pendingCount = Math.max(0, completedTurmas - certificates.length);

  const totalHours = certificates.reduce(
    (acc, c) => acc + c.trainingAction.course.durationHours,
    0
  );

  return (
    <DashboardShell hasBottomNav>
      <PageHeader
        breadcrumb={[{ label: "Certificados" }]}
        title="Certificados"
        description="Os seus certificados DGERT · download em PDF · verificação por QR"
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Emitidos" value={String(certificates.length)} icon={Award} variant="gold" />
        <StatCard label="Pendentes" value={String(pendingCount)} icon={Clock4} variant="blue" />
        <StatCard label="Horas certificadas" value={`${totalHours}h`} icon={CheckCircle2} variant="emerald" />
        <StatCard label="Validados" value={String(certificates.length)} icon={QrCode} variant="purple" />
      </div>

      {certificates.length === 0 ? (
        <EmptyState pendingCount={pendingCount} tenantSlug={params.tenantSlug} />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((cert) => (
            <CertificateCard
              key={cert.id}
              cert={cert}
              tenantSlug={params.tenantSlug}
            />
          ))}
        </div>
      )}

      {/* Pending hint */}
      {pendingCount > 0 && certificates.length > 0 && (
        <div className="mt-8 rounded-xl border border-gold/20 bg-gold/5 p-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold-700">
              <Clock4 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy">
                Tem {pendingCount} certificado{pendingCount > 1 ? "s" : ""} em
                processamento
              </h3>
              <p className="mt-1 text-xs text-ink-muted">
                Os certificados são emitidos automaticamente até 5 dias úteis
                após a conclusão do curso. Receberá notificação por email assim
                que estiverem disponíveis.
              </p>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

type Certificate = Awaited<
  ReturnType<typeof prisma.certificate.findMany>
>[number] & {
  trainingAction: {
    course: {
      name: string;
      code: string;
      durationHours: number;
      certificationLevel: "PARTICIPACAO" | "APROVEITAMENTO" | "COMPETENCIAS";
    };
    entity: { name: string } | null;
  };
};

function CertificateCard({
  cert,
  tenantSlug: _tenantSlug,
}: {
  cert: Certificate;
  tenantSlug: string;
}) {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-card to-gold/5 p-6 transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
      {/* decorative gold corner */}
      <div className="absolute right-0 top-0 h-24 w-24 -translate-y-12 translate-x-12 rounded-full bg-gold/10 blur-2xl" />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-gold text-navy shadow-lg shadow-gold/30">
            <Award className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <span className="rounded-md bg-gold/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-700">
            {cert.level === "APROVEITAMENTO"
              ? "Aproveitamento"
              : cert.level === "COMPETENCIAS"
              ? "Competências"
              : "Participação"}
          </span>
        </div>

        <h3 className="line-clamp-2 text-lg font-bold leading-tight text-navy">
          {cert.trainingAction.course.name}
        </h3>
        <p className="mt-1 text-xs text-ink-muted">
          {cert.trainingAction.entity?.name ?? "Formação interna"}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gold/20 pt-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-ink-subtle">
              Nº Certificado
            </p>
            <p className="mt-0.5 font-mono text-xs font-bold text-navy">
              {cert.number}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-ink-subtle">
              Emitido
            </p>
            <p className="mt-0.5 text-xs font-bold text-navy">
              {formatDate(cert.issuedAt)}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-ink-subtle">
              Carga horária
            </p>
            <p className="mt-0.5 text-xs font-bold text-navy">
              {cert.trainingAction.course.durationHours}h
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-ink-subtle">
              Código QR
            </p>
            <p className="mt-0.5 font-mono text-[10px] uppercase text-emerald-600">
              ✓ Validado
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-navy px-3 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-navy/90"
          >
            <Download className="h-3.5 w-3.5" />
            PDF
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold uppercase tracking-wider text-navy transition-colors hover:bg-surface-low"
            aria-label="Verificar com QR"
          >
            <QrCode className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptyState({
  pendingCount,
  tenantSlug,
}: {
  pendingCount: number;
  tenantSlug: string;
}) {
  if (pendingCount > 0) {
    return (
      <div className="rounded-2xl border border-gold/30 bg-gold/5 px-8 py-16 text-center">
        <Award className="mx-auto mb-4 h-12 w-12 text-gold" />
        <h3 className="text-lg font-bold text-navy">
          {pendingCount} certificado{pendingCount > 1 ? "s" : ""} em processamento
        </h3>
        <p className="mt-2 max-w-md text-sm text-ink-muted mx-auto">
          Concluiu cursos recentemente. Os certificados são emitidos
          automaticamente até 5 dias úteis após o fim da formação.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-low/40 px-8 py-16 text-center">
      <Award className="mx-auto mb-4 h-12 w-12 text-ink-faint" />
      <h3 className="text-lg font-bold text-navy">
        Ainda não tem certificados
      </h3>
      <p className="mt-2 max-w-md text-sm text-ink-muted mx-auto">
        Após concluir o seu primeiro curso, o certificado aparece aqui com
        download em PDF e verificação por QR code.
      </p>
      <Link
        href={`/${tenantSlug}/catalog`}
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-navy/90"
      >
        Ver catálogo de cursos
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
