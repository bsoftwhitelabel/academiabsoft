import { Users } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Formadores · Trainer" };

type Props = { params: { tenantSlug: string } };

export default function TrainerTrainersPage({ params }: Props) {
  return (
    <DashboardShell>
      <PageHeader breadcrumb={[{ label: "Formadores" }]} title="Formadores" />
      <ComingSoon
        icon={Users}
        title="Equipa de formadores"
        description="Diretório de formadores do mesmo centro · partilha de plano de sessão e materiais didáticos."
        back={{ label: "Voltar ao Dashboard", href: `/${params.tenantSlug}/trainer/dashboard` }}
      />
    </DashboardShell>
  );
}
