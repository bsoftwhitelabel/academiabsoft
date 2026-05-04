import { History } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Histórico" };

type Props = { params: { tenantSlug: string } };

export default function PortalHistoryPage({ params }: Props) {
  return (
    <DashboardShell hasBottomNav>
      <PageHeader breadcrumb={[{ label: "Histórico" }]} title="Histórico" />
      <ComingSoon
        icon={History}
        title="Histórico completo"
        description="Linha temporal de todas as tuas sessões, presenças e avaliações."
        back={{ label: "Voltar ao Painel", href: `/${params.tenantSlug}/portal/dashboard` }}
      />
    </DashboardShell>
  );
}
