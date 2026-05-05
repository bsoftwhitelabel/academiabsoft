import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  Calendar,
  Clock4,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Verificação de Certificado · DGERT",
  description: "Verifique a autenticidade de um certificado emitido por uma entidade DGERT na Academia Digital.",
};

type Props = { params: { code: string } };

const LEVEL_LABEL = {
  PARTICIPACAO: "Participação",
  APROVEITAMENTO: "Aproveitamento",
  COMPETENCIAS: "Competências",
} as const;

export default async function VerifyCertificatePage({ params }: Props) {
  const cert = await prisma.certificate.findUnique({
    where: { verificationCode: params.code },
    include: {
      trainee: {
        include: {
          user: { select: { fullName: true } },
          tenant: { select: { name: true, dgertCode: true } },
          entity: { select: { name: true } },
        },
      },
      trainingAction: {
        include: {
          course: {
            select: {
              name: true,
              code: true,
              durationHours: true,
            },
          },
        },
      },
    },
  });

  if (!cert) notFound();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-container items-center justify-between px-4 py-4 md:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-navy text-white">
              <GraduationCap className="h-4 w-4" strokeWidth={2.5} />
            </div>
            <span className="text-base font-bold text-navy">
              Academia Digital · Verificação
            </span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200/60">
            <ShieldCheck className="h-3 w-3" strokeWidth={2.75} />
            Certificado autêntico
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-12 md:px-8 md:py-16">
        <div className="mb-8 rounded-2xl border-2 border-emerald-300 bg-emerald-50/40 p-6 text-center ring-1 ring-emerald-200/60 md:p-8">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" strokeWidth={2.5} />
          </div>
          <h1 className="text-balance text-2xl font-bold leading-tight text-navy md:text-3xl">
            Certificado verificado com sucesso
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Este certificado foi emitido por uma entidade formadora certificada
            DGERT e os dados abaixo estão validados em base de dados.
          </p>
        </div>

        <article className="overflow-hidden rounded-2xl border border-gold/30 bg-card shadow-card-elevated">
          {/* gold header strip */}
          <div className="bg-gradient-to-r from-navy via-navy to-navy/90 p-6 text-white">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gold">
              Certificado nº {cert.number}
            </p>
            <h2 className="mt-1 text-xl font-bold leading-tight">
              {cert.trainee.user.fullName}
            </h2>
            <p className="mt-1 text-sm opacity-85">
              concluiu com{" "}
              <span className="font-bold text-gold">
                {LEVEL_LABEL[cert.level]}
              </span>{" "}
              a ação de formação
            </p>
            <h3 className="mt-3 text-2xl font-bold leading-tight">
              {cert.trainingAction.course.name}
            </h3>
          </div>

          {/* body */}
          <dl className="divide-y divide-border">
            <Row
              icon={Award}
              label="Nível de certificação"
              value={LEVEL_LABEL[cert.level]}
            />
            <Row
              icon={Clock4}
              label="Carga horária"
              value={`${cert.trainingAction.course.durationHours} horas`}
            />
            <Row
              icon={Calendar}
              label="Período da formação"
              value={`${formatDate(cert.trainingAction.startDate)} → ${formatDate(cert.trainingAction.endDate)}`}
            />
            <Row
              icon={Calendar}
              label="Data de emissão"
              value={formatDate(cert.issuedAt)}
            />
            <Row
              icon={GraduationCap}
              label="Entidade formadora"
              value={`${cert.trainee.tenant.name} · DGERT ${cert.trainee.tenant.dgertCode ?? "—"}`}
            />
            {cert.trainee.entity?.name && (
              <Row
                icon={ShieldCheck}
                label="Cliente"
                value={cert.trainee.entity.name}
              />
            )}
            <Row
              icon={ShieldCheck}
              label="Código de verificação"
              value={params.code}
              mono
            />
          </dl>
        </article>

        <p className="mt-8 text-center text-[11px] text-ink-subtle">
          Esta página verifica a autenticidade do certificado contra a base de
          dados da entidade formadora. Caso encontre uma divergência, contacte
          imediatamente {cert.trainee.tenant.name}.
        </p>
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Award;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 px-6 py-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-navy/8 text-navy">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
          {label}
        </dt>
        <dd
          className={
            "mt-0.5 text-sm font-bold text-navy" +
            (mono ? " font-mono break-all" : "")
          }
        >
          {value}
        </dd>
      </div>
    </div>
  );
}
