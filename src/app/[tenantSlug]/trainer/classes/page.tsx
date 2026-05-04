import { ClipboardList } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Classes" };

type Props = { params: { tenantSlug: string } };

export default function TrainerClassesPage({ params }: Props) {
  return (
    <DashboardShell>
      <PageHeader breadcrumb={[{ label: "Classes" }]} title="Classes" />
      <ComingSoon
        icon={ClipboardList}
        title="Vista de classes/grupos"
        description="Agrupamento avançado de turmas para reporting consolidado."
        back={{ label: "Voltar à lista de turmas", href: `/${params.tenantSlug}/trainer/sessions` }}
      />
    </DashboardShell>
  );
}
