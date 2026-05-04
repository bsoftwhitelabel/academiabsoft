import { ArrowLeft, Save, X } from "lucide-react";
import Link from "next/link";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { CourseFormClient } from "@/components/admin/course-form";

export const metadata = { title: "Novo Curso · Gestão" };

type Props = { params: { tenantSlug: string } };

export default function NewCoursePage({ params }: Props) {
  return (
    <DashboardShell>
      <Link
        href={`/${params.tenantSlug}/admin/courses`}
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-navy"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar à lista
      </Link>

      <PageHeader
        breadcrumb={[
          { label: "Gestão", href: `/${params.tenantSlug}/admin` },
          {
            label: "Cursos",
            href: `/${params.tenantSlug}/admin/courses`,
          },
          { label: "Novo Curso" },
        ]}
        title="Criar novo curso"
        description="Estrutura, marketing e configuração de catálogo num só formulário."
        actions={
          <>
            <Button
              asChild
              variant="outline"
              className="h-10 border-border bg-card text-navy hover:bg-surface-low"
            >
              <Link href={`/${params.tenantSlug}/admin/courses`}>
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
              Guardar curso
            </Button>
          </>
        }
      />

      <CourseFormClient />
    </DashboardShell>
  );
}
