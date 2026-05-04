import { CalendarDays } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { ComingSoon } from "@/components/dashboard/coming-soon";

export const metadata = { title: "Calendário" };

type Props = { params: { tenantSlug: string } };

export default function PortalCalendarPage({ params }: Props) {
  return (
    <DashboardShell hasBottomNav>
      <PageHeader breadcrumb={[{ label: "Calendário" }]} title="Calendário" />
      <ComingSoon
        icon={CalendarDays}
        title="Calendário visual"
        description="Vista mensal e semanal das tuas sessões · sincronização com Google Calendar e Outlook."
        features={[
          "Vista mensal · semanal · diária",
          "Add to calendar (.ics) por sessão",
          "Notificações 24h e 2h antes",
        ]}
        back={{ label: "Voltar ao Painel", href: `/${params.tenantSlug}/portal/dashboard` }}
      />
    </DashboardShell>
  );
}
