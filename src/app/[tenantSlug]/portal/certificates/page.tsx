import Link from "next/link";
import {
  Award,
  Download,
  QrCode,
  CheckCircle2,
  Clock4,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Share2,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { SessionRequired } from "@/components/dashboard/session-required";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn, formatDate } from "@/lib/utils";

export const metadata = { title: "Certificados" };

type Props = { params: { tenantSlug: string } };

// ─── Demo certificates ─────────────────────────────────────────────────

const DEMO_CERTIFICATES = [
  {
    id: "demo-c1",
    number: "DEMO-2025-EXC-0042",
    level: "APROVEITAMENTO" as const,
    issuedAt: new Date(Date.now() - 50 * 86400000),
    pdfUrl: null,
    verificationCode: "DEMO-CERT-EXC-0042",
    trainingAction: {
      course: {
        name: "Microsoft Excel Avançado",
        code: "EXC-ADV",
        durationHours: 24,
        certificationLevel: "APROVEITAMENTO" as const,
      },
      entity: { name: "Decathlon Portugal" },
    },
  },
  {
    id: "demo-c2",
    number: "DEMO-2025-LDP-0118",
    level: "COMPETENCIAS" as const,
    issuedAt: new Date(Date.now() - 120 * 86400000),
    pdfUrl: null,
    verificationCode: "DEMO-CERT-LDP-0118",
    trainingAction: {
      course: {
        name: "Liderança e Gestão de Equipas",
        code: "LDP-001",
        durationHours: 35,
        certificationLevel: "COMPETENCIAS" as const,
      },
      entity: { name: "Decathlon Portugal" },
    },
  },
  {
    id: "demo-c3",
    number: "DEMO-2024-INF-0009",
    level: "PARTICIPACAO" as const,
    issuedAt: new Date(Date.now() - 220 * 86400000),
    pdfUrl: null,
    verificationCode: "DEMO-CERT-INF-0009",
    trainingAction: {
      course: {
        name: "Informática na Ótica do Utilizador",
        code: "INF-101",
        durationHours: 16,
        certificationLevel: "PARTICIPACAO" as const,
      },
      entity: null,
    },
  },
];

const LEVEL_CONFIG = {
  PARTICIPACAO: {
    label: "Participação",
    accent: "bg-blue-50 text-blue-700 ring-blue-200/60",
  },
  APROVEITAMENTO: {
    label: "Aproveitamento",
    accent: "bg-gold/15 text-gold-700 ring-gold/30",
  },
  COMPETENCIAS: {
    label: "Competências",
    accent: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  },
} as const;

export default async function PortalCertificatesPage({ params }: Props) {
  const session = await getSession();
  if (!session) {
    return <SessionRequired tenantSlug={params.tenantSlug} title="Certificados" hasBottomNav />;
  }

  const trainee = await prisma.trainee.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });

  const realCerts = trainee
    ? await prisma.certificate.findMany({
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
      })
    : [];

  const completedTurmas = trainee
    ? await prisma.enrollment.count({
        where: {
          traineeId: trainee.id,
          trainingAction: { status: "COMPLETED" },
        },
      })
    : 0;

  const isUsingDemoData = realCerts.length === 0;
  const certificates = isUsingDemoData
    ? DEMO_CERTIFICATES
    : (realCerts as unknown as typeof DEMO_CERTIFICATES);
  const pendingCount = isUsingDemoData
    ? 1
    : Math.max(0, completedTurmas - certificates.length);

  const totalHours = certificates.reduce(
    (acc, c) => acc + c.trainingAction.course.durationHours,
    0
  );

  // Group by level
  const byLevel = {
    PARTICIPACAO: certificates.filter((c) => c.level === "PARTICIPACAO").length,
    APROVEITAMENTO: certificates.filter((c) => c.level === "APROVEITAMENTO").length,
    COMPETENCIAS: certificates.filter((c) => c.level === "COMPETENCIAS").length,
  };

  return (
    <DashboardShell hasBottomNav>
      <PageHeader
        breadcrumb={[{ label: "Certificados" }]}
        title="Certificados DGERT"
        description="Os teus certificados de formação · download em PDF · validação por QR"
      />

      {isUsingDemoData && (
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold-700 ring-1 ring-gold/20">
          <Sparkles className="h-3 w-3" strokeWidth={2.75} />
          Conteúdo demo · serão substituídos pelos teus certificados reais
        </div>
      )}

      {/* Stats strip */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Emitidos"
          value={String(certificates.length)}
          icon={Award}
          variant="gold"
        />
        <StatCard
          label="Pendentes"
          value={String(pendingCount)}
          icon={Clock4}
          variant="blue"
        />
        <StatCard
          label="Horas certificadas"
          value={`${totalHours}h`}
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          label="Validados QR"
          value={String(certificates.length)}
          icon={ShieldCheck}
          variant="purple"
        />
      </div>

      {/* Level breakdown */}
      {certificates.length > 0 && (
        <section className="mb-8 rounded-2xl border border-border bg-card p-5 md:p-6">
          <h2 className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-navy">
            <TrendingUp className="h-4 w-4" />
            Distribuição por nível
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <LevelBar
              label="Participação"
              count={byLevel.PARTICIPACAO}
              total={certificates.length}
              accent="blue"
            />
            <LevelBar
              label="Aproveitamento"
              count={byLevel.APROVEITAMENTO}
              total={certificates.length}
              accent="gold"
            />
            <LevelBar
              label="Competências"
              count={byLevel.COMPETENCIAS}
              total={certificates.length}
              accent="emerald"
            />
          </div>
        </section>
      )}

      {/* Certificates grid */}
      {certificates.length === 0 ? (
        <EmptyState pendingCount={pendingCount} tenantSlug={params.tenantSlug} />
      ) : (
        <>
          <header className="mb-4 flex items-baseline justify-between">
            <h2 className="text-h2 font-bold text-navy">
              Os meus certificados
            </h2>
            <span className="text-xs text-ink-subtle">
              {certificates.length} certificado{certificates.length !== 1 ? "s" : ""} ·
              ordenados por data
            </span>
          </header>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert) => (
              <CertificateCard
                key={cert.id}
                cert={cert}
                tenantSlug={params.tenantSlug}
                isDemo={isUsingDemoData}
              />
            ))}
          </div>
        </>
      )}

      {/* Pending hint */}
      {pendingCount > 0 && certificates.length > 0 && (
        <section className="mt-8 rounded-xl border border-gold/30 bg-gold/5 p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold-700">
              <Clock4 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-navy">
                Tens {pendingCount} certificado{pendingCount > 1 ? "s" : ""} em
                processamento
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                Os certificados são emitidos automaticamente até 5 dias úteis
                após a conclusão do curso. Receberás notificação por email
                quando estiverem disponíveis.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* About verification */}
      <section className="mt-10 rounded-2xl border border-border bg-card p-6 md:p-8">
        <h2 className="mb-3 inline-flex items-center gap-2 text-h3 font-bold text-navy">
          <ShieldCheck className="h-5 w-5 text-emerald-600" />
          Verificação pública
        </h2>
        <p className="text-sm leading-relaxed text-ink-muted">
          Cada certificado tem um QR code com link único de verificação. Empregadores
          ou auditores DGERT podem aceder a esse URL para confirmar a autenticidade
          em tempo real, com nome, curso, datas, carga horária e formador.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <InfoCard
            icon={QrCode}
            title="QR digital"
            body="Aponta a câmara para validar instantaneamente."
          />
          <InfoCard
            icon={Share2}
            title="URL partilhável"
            body="Cola num CV, LinkedIn ou email."
          />
          <InfoCard
            icon={ShieldCheck}
            title="Tamper-proof"
            body="Hash criptográfico evita falsificação."
          />
        </div>
      </section>
    </DashboardShell>
  );
}

// ─── Subcomponents ─────────────────────────────────────────────────────

function CertificateCard({
  cert,
  tenantSlug: _tenantSlug,
  isDemo,
}: {
  cert: (typeof DEMO_CERTIFICATES)[number];
  tenantSlug: string;
  isDemo: boolean;
}) {
  const downloadHref = isDemo ? "#" : `/api/pdf/certificate/${cert.id}`;
  const verifyHref = `/verify/${cert.verificationCode}`;
  const levelCfg = LEVEL_CONFIG[cert.level];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-card to-gold/5 p-6 transition-all hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="absolute right-0 top-0 h-24 w-24 -translate-y-12 translate-x-12 rounded-full bg-gold/10 blur-2xl" />

      <div className="relative">
        <div className="mb-4 flex items-start justify-between">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-gold text-navy shadow-lg shadow-gold/30">
            <Award className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <span
            className={cn(
              "rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1",
              levelCfg.accent
            )}
          >
            {levelCfg.label}
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
              Estado
            </p>
            <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] uppercase text-emerald-600">
              <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
              Validado
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <a
            href={downloadHref}
            target="_blank"
            rel="noopener"
            aria-disabled={isDemo}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
              isDemo
                ? "cursor-not-allowed bg-surface-mid text-ink-faint"
                : "bg-navy text-white hover:bg-navy/90"
            )}
            onClick={(e) => isDemo && e.preventDefault()}
          >
            <Download className="h-3.5 w-3.5" />
            PDF
          </a>
          <Link
            href={verifyHref}
            target="_blank"
            rel="noopener"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold uppercase tracking-wider text-navy transition-colors hover:bg-surface-low"
            aria-label="Página de verificação pública"
            title="Verificação pública via QR"
          >
            <QrCode className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function LevelBar({
  label,
  count,
  total,
  accent,
}: {
  label: string;
  count: number;
  total: number;
  accent: "blue" | "gold" | "emerald";
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const cls =
    accent === "blue"
      ? "bg-blue-500"
      : accent === "gold"
      ? "bg-gold"
      : "bg-emerald-500";
  return (
    <div className="rounded-lg bg-surface-low/40 p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
          {label}
        </span>
        <span className="text-base font-bold tabular-nums text-navy">
          {count}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-card">
        <div
          className={cn("h-full rounded-full transition-all", cls)}
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof QrCode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-surface-low/40 p-3">
      <div className="mb-2 flex items-center gap-2">
        <div className="grid h-7 w-7 place-items-center rounded-md bg-card text-navy">
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
        <p className="text-[11px] font-bold text-navy">{title}</p>
      </div>
      <p className="text-[11px] leading-relaxed text-ink-muted">{body}</p>
    </div>
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
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
          Concluíste cursos recentemente. Os certificados são emitidos
          automaticamente até 5 dias úteis após o fim da formação.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-low/40 px-8 py-16 text-center">
      <Award className="mx-auto mb-4 h-12 w-12 text-ink-faint" />
      <h3 className="text-lg font-bold text-navy">
        Ainda não tens certificados
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
        Após concluíres o teu primeiro curso, o certificado aparece aqui com
        download em PDF e verificação por QR code.
      </p>
      <Link
        href={`/${tenantSlug}/catalog`}
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-navy/90"
      >
        Ver catálogo de cursos
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
