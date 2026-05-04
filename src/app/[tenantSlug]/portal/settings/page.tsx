import { Settings } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Configurações" };

type Props = { params: { tenantSlug: string } };

export default function PortalSettingsPage({ params }: Props) {
  return (
    <DashboardShell hasBottomNav>
      <PageHeader breadcrumb={[{ label: "Configurações" }]} title="Configurações" />
      <ComingSoon
        icon={Settings}
        title="Preferências da tua conta"
        description="Atualiza dados pessoais · notificações · preferência de idioma · consentimento RGPD."
        features={[
          "Editar morada e contacto",
          "Definir idioma e fuso horário",
          "Gerir consentimentos RGPD e portabilidade de dados",
          "Exportar histórico em PDF",
        ]}
        back={{ label: "Voltar ao Painel", href: `/${params.tenantSlug}/portal/dashboard` }}
      />
    </DashboardShell>
  );
}
