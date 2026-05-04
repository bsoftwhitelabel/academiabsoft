import { Settings } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Configurações" };

type Props = { params: { tenantSlug: string } };

export default function AdminSettingsPage({ params }: Props) {
  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[
          { label: "Gestão", href: `/${params.tenantSlug}/admin` },
          { label: "Configurações" },
        ]}
        title="Configurações"
        description="White-label · branding · integrações · políticas DGERT"
      />
      <ComingSoon
        icon={Settings}
        title="Configurações do tenant"
        description="Painel de configuração white-label completo · cada cliente customiza a sua experiência sem mexer em código."
        features={[
          "Upload de logo e favicon · paleta de cores (primary + accent)",
          "Domínio próprio (formacao.cliente.com) · DNS verification",
          "Templates de email transacional · sender personalizado",
          "Configurações DGERT (código de entidade, certificações ativas)",
          "Roles e permissões granulares · workflow de aprovação",
          "Integrações: Resend, Cloudflare R2, Google Calendar, etc.",
        ]}
        back={{
          label: "Voltar ao Dashboard",
          href: `/${params.tenantSlug}/admin/dashboard`,
        }}
      />
    </DashboardShell>
  );
}
