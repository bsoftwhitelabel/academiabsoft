import { Users } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Formandos · Trainer" };

type Props = { params: { tenantSlug: string } };

export default function TrainerTraineesPage({ params }: Props) {
  return (
    <DashboardShell>
      <PageHeader breadcrumb={[{ label: "Formandos" }]} title="Os meus formandos" />
      <ComingSoon
        icon={Users}
        title="Formandos das suas turmas"
        description="Lista filtrada apenas dos formandos das tuas turmas · histórico de presenças, avaliações e progressão por curso."
        features={[
          "Filtrar por turma · curso · entidade cliente",
          "Notas de avaliação contínua e final",
          "Exportar lista de presenças por sessão",
        ]}
        back={{ label: "Ver turmas", href: `/${params.tenantSlug}/trainer/sessions` }}
      />
    </DashboardShell>
  );
}
