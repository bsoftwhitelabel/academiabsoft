import { GraduationCap } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Cursos · Formador" };

type Props = { params: { tenantSlug: string } };

export default function TrainerCoursesPage({ params }: Props) {
  return (
    <DashboardShell>
      <PageHeader breadcrumb={[{ label: "Cursos" }]} title="Cursos" />
      <ComingSoon
        icon={GraduationCap}
        title="Vista de cursos do formador"
        description="Lista de cursos que ministras com plano de sessões, recursos didáticos e atalho para a folha de presenças."
        back={{ label: "Voltar ao Dashboard", href: `/${params.tenantSlug}/trainer/dashboard` }}
      />
    </DashboardShell>
  );
}
