import { CalendarDays } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Reports · Trainer" };

type Props = { params: { tenantSlug: string } };

export default function TrainerReportsPage({ params }: Props) {
  return (
    <DashboardShell>
      <PageHeader breadcrumb={[{ label: "Reports" }]} title="Relatórios" />
      <ComingSoon
        icon={CalendarDays}
        title="Relatórios de execução"
        description="Indicadores das tuas turmas: taxa adesão, NPS, horas formadas, preparação para a Ata Pedagógica."
        back={{ label: "Voltar ao Dashboard", href: `/${params.tenantSlug}/trainer/dashboard` }}
      />
    </DashboardShell>
  );
}
