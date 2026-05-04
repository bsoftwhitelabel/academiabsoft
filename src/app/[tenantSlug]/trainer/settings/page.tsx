import { Settings } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Configurações · Trainer" };

type Props = { params: { tenantSlug: string } };

export default function TrainerSettingsPage({ params }: Props) {
  return (
    <DashboardShell>
      <PageHeader breadcrumb={[{ label: "Configurações" }]} title="Configurações" />
      <ComingSoon
        icon={Settings}
        title="Preferências do formador"
        description="Disponibilidade horária · áreas de especialidade · sincronização de calendário Google/Outlook."
        back={{ label: "Voltar ao Dashboard", href: `/${params.tenantSlug}/trainer/dashboard` }}
      />
    </DashboardShell>
  );
}
