import { User as UserIcon } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Perfil" };

type Props = { params: { tenantSlug: string } };

export default function PortalProfilePage({ params }: Props) {
  return (
    <DashboardShell hasBottomNav>
      <PageHeader breadcrumb={[{ label: "Perfil" }]} title="Perfil" />
      <ComingSoon
        icon={UserIcon}
        title="Perfil pessoal"
        description="Os teus dados profissionais e académicos · usados para emissão de certificados DGERT."
        back={{ label: "Configurações completas", href: `/${params.tenantSlug}/portal/settings` }}
      />
    </DashboardShell>
  );
}
