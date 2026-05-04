import { QrCode } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Check-in QR" };

type Props = { params: { tenantSlug: string } };

export default function PortalCheckinPage({ params }: Props) {
  return (
    <DashboardShell hasBottomNav>
      <PageHeader breadcrumb={[{ label: "Check-in" }]} title="Check-in via QR" />
      <ComingSoon
        icon={QrCode}
        title="Scan QR Code para check-in"
        description="Aponta a câmara para o QR Code apresentado pelo formador na sala. O check-in é registado em tempo real e desbloqueia a assinatura digital quando o formador validar."
        features={[
          "Scan via câmara do telemóvel (web API)",
          "Registo geo-localizado para auditoria DGERT",
          "Notificação push quando o formador habilitar a assinatura",
        ]}
        back={{ label: "Voltar ao Painel", href: `/${params.tenantSlug}/portal/dashboard` }}
      />
    </DashboardShell>
  );
}
