import { BarChart3 } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Relatórios" };

type Props = { params: { tenantSlug: string } };

export default function AdminReportsPage({ params }: Props) {
  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[
          { label: "Gestão", href: `/${params.tenantSlug}/admin` },
          { label: "Relatórios" },
        ]}
        title="Relatórios"
        description="Relatórios DGERT · análises operacionais · exportação Excel/PDF"
      />
      <ComingSoon
        icon={BarChart3}
        title="Relatórios DGERT em desenvolvimento"
        description="O motor de relatórios ad-hoc está a ser construído. Vai cobrir todas as exigências do Dossier Técnico-Pedagógico e do SIGO."
        features={[
          "Relatório mensal de execução · taxa adesão · NPS · custo/hora",
          "Mapa de imputação de custos por sistema de financiamento",
          "Exportação Excel + PDF para auditorias DGERT",
          "Filtros por período, entidade cliente, área de formação",
          "Dashboard executivo com KPIs comparáveis ano-a-ano",
        ]}
        back={{
          label: "Voltar ao Dashboard",
          href: `/${params.tenantSlug}/admin/dashboard`,
        }}
      />
    </DashboardShell>
  );
}
