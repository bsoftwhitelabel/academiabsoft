import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Clock,
  Users,
  Layers,
  Monitor,
  ArrowLeft,
  Edit,
  Archive,
  Eye,
} from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { cn, formatCurrency } from "@/lib/utils";

export const metadata = { title: "Detalhe do curso · Gestão" };

type Props = {
  params: { tenantSlug: string; courseSlug: string };
};

export default async function AdminCourseDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  const course = await prisma.course.findUnique({
    where: {
      tenantId_slug: { tenantId: session.tenantId, slug: params.courseSlug },
    },
    include: {
      modules: { orderBy: { order: "asc" } },
      trainingArea: true,
      _count: { select: { trainingActions: true, modules: true } },
    },
  });

  if (!course) notFound();

  const enrollmentCount = await prisma.enrollment.count({
    where: { trainingAction: { courseId: course.id } },
  });

  const modalityLabel = {
    PRESENCIAL: "Presencial",
    ELEARNING: "E-learning",
    BLENDED: "Híbrido (B-Learning)",
  }[course.modality];

  return (
    <DashboardShell>
      <Link
        href={`/${params.tenantSlug}/admin/courses`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-navy"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar à lista de cursos
      </Link>

      <PageHeader
        breadcrumb={[
          { label: "Gestão", href: `/${params.tenantSlug}/admin` },
          { label: "Cursos", href: `/${params.tenantSlug}/admin/courses` },
          { label: course.shortName ?? course.code },
        ]}
        title={course.name}
        description={`${course.code} · ${course.trainingArea?.name ?? "Sem área"}`}
        actions={
          <>
            <Button
              asChild
              variant="outline"
              className="h-10 gap-1.5 border-border bg-card text-navy hover:bg-surface-low"
            >
              <Link href={`/${params.tenantSlug}/catalog/${course.slug}`}>
                <Eye className="h-4 w-4" />
                Ver no catálogo
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-10 gap-1.5 border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
            >
              <Archive className="h-4 w-4" />
              Arquivar
            </Button>
            <Button asChild className="h-10 gap-1.5 bg-navy text-white hover:bg-navy/90">
              <Link href={`/${params.tenantSlug}/admin/courses/${course.slug}/edit`}>
                <Edit className="h-4 w-4" />
                Editar curso
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* main */}
        <div className="space-y-6 lg:col-span-2">
          {/* meta */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetaCard label="Duração" value={`${course.durationHours}h`} icon={Clock} />
            <MetaCard label="Modalidade" value={modalityLabel} icon={Monitor} />
            <MetaCard label="Módulos" value={String(course._count.modules)} icon={Layers} />
            <MetaCard label="Formandos" value={String(enrollmentCount)} icon={Users} />
          </div>

          {/* description */}
          {course.marketingDescription && (
            <Section title="Descrição de marketing">
              <p className="text-sm leading-relaxed text-ink-muted">
                {course.marketingDescription}
              </p>
            </Section>
          )}

          {course.objetivosGerais && (
            <Section title="Objetivos gerais">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">
                {course.objetivosGerais}
              </p>
            </Section>
          )}

          {course.objetivosEspecificos && (
            <Section title="Objetivos específicos">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-muted">
                {course.objetivosEspecificos}
              </p>
            </Section>
          )}

          {course.modules.length > 0 && (
            <Section title={`Módulos (${course.modules.length})`}>
              <ol className="space-y-3">
                {course.modules.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-start gap-4 rounded-xl border border-border bg-surface-low/40 p-4"
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-navy text-sm font-bold text-white">
                      {m.order}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-navy">{m.name}</h4>
                      {m.description && (
                        <p className="mt-1 text-xs text-ink-muted">
                          {m.description}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-md bg-card px-2 py-1 text-xs font-medium text-ink-muted">
                      {m.durationHours}h
                    </span>
                  </li>
                ))}
              </ol>
            </Section>
          )}
        </div>

        {/* sidebar */}
        <aside>
          <div className="sticky top-6 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-4 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
                Configuração de catálogo
              </h3>
              <dl className="space-y-3 text-sm">
                <Row label="Status" value={course.status === "ACTIVE" ? "Ativo" : course.status === "ARCHIVED" ? "Arquivado" : "Rascunho"} />
                <Row label="Público" value={course.isPublic ? "Sim" : "Não"} />
                <Row label="Em destaque" value={course.isFeatured ? "Sim" : "Não"} />
                <Row label="Certificação" value={course.certificationLevel === "APROVEITAMENTO" ? "C/ Aproveitamento" : course.certificationLevel === "COMPETENCIAS" ? "Competências" : "Participação"} />
                <Row
                  label="Preço"
                  value={course.priceEur ? formatCurrency(Number(course.priceEur)) : "Sob consulta"}
                />
                <Row label="Turmas criadas" value={String(course._count.trainingActions)} />
              </dl>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <h4 className="text-xs font-bold text-navy">
                Edição de curso em desenvolvimento
              </h4>
              <p className="mt-1 text-xs text-ink-muted">
                O formulário de edição inline (igual ao &ldquo;Novo curso&rdquo;) será
                disponibilizado em breve. Por agora, a criação está em{" "}
                <Link
                  href={`/${params.tenantSlug}/admin/courses/new`}
                  className="font-bold text-blue-600 hover:underline"
                >
                  /admin/courses/new
                </Link>
                .
              </p>
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}

function MetaCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Clock;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-surface-low text-navy">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
        {label}
      </p>
      <p className="mt-0.5 text-base font-bold text-navy">{value}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-4 text-h3 font-bold text-navy">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
        {label}
      </dt>
      <dd className={cn("text-xs font-bold text-navy")}>{value}</dd>
    </div>
  );
}
