import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Save, X } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { CourseFormClient } from "@/components/admin/course-form";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Editar curso · Gestão" };

type Props = {
  params: { tenantSlug: string; courseSlug: string };
};

export default async function AdminCourseEditPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  const course = await prisma.course.findUnique({
    where: {
      tenantId_slug: { tenantId: session.tenantId, slug: params.courseSlug },
    },
    include: {
      modules: { orderBy: { order: "asc" } },
      trainingArea: { select: { code: true, name: true } },
    },
  });

  if (!course) notFound();

  const initial = {
    name: course.name,
    shortName: course.shortName ?? undefined,
    code: course.code,
    areaSlug: course.trainingArea
      ? slugifyAreaName(course.trainingArea.name)
      : undefined,
    modality: course.modality,
    durationHours: course.durationHours,
    certificationLevel: course.certificationLevel,
    priceEur: course.priceEur ? Number(course.priceEur) : null,
    destinatarios: course.destinatarios ?? undefined,
    objetivosGerais: course.objetivosGerais ?? undefined,
    objetivosEspecificos: course.objetivosEspecificos ?? undefined,
    metodologia: course.metodologia ?? undefined,
    metodologiaAvaliacao: course.metodologiaAvaliacao ?? undefined,
    modules: course.modules.map((m) => ({
      name: m.name,
      hours: m.durationHours,
    })),
    coverImageUrl: course.coverImageUrl ?? undefined,
    marketingDescription: course.marketingDescription ?? undefined,
    tagsRaw: course.tagsRaw ?? undefined,
    isPublic: course.isPublic,
    isFeatured: course.isFeatured,
  };

  return (
    <DashboardShell>
      <Link
        href={`/${params.tenantSlug}/admin/courses/${course.slug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-navy"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar ao detalhe
      </Link>

      <PageHeader
        breadcrumb={[
          { label: "Gestão", href: `/${params.tenantSlug}/admin` },
          { label: "Cursos", href: `/${params.tenantSlug}/admin/courses` },
          { label: course.shortName ?? course.code },
          { label: "Editar" },
        ]}
        title={`Editar · ${course.name}`}
        description={`${course.code} · alterações são versionadas para auditoria DGERT`}
        actions={
          <>
            <Button
              asChild
              variant="outline"
              className="h-10 border-border bg-card text-navy hover:bg-surface-low"
            >
              <Link href={`/${params.tenantSlug}/admin/courses/${course.slug}`}>
                <X className="h-4 w-4" />
                Cancelar
              </Link>
            </Button>
            <Button
              type="submit"
              form="course-form"
              className="h-10 gap-1.5 bg-navy text-white hover:bg-navy/90"
            >
              <Save className="h-4 w-4" />
              Guardar alterações
            </Button>
          </>
        }
      />

      <CourseFormClient initial={initial} mode="edit" />
    </DashboardShell>
  );
}

function slugifyAreaName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
