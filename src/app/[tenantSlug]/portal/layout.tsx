import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Award,
  Settings,
} from "lucide-react";
import { DashboardSidebar, type SidebarItem } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { MobileBottomNav } from "@/components/trainee/bottom-nav";
import { getSession } from "@/lib/auth/session";
import { MOCK_TRAINEE } from "@/lib/mock-data";

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantSlug: string };
}) {
  const session = await getSession();

  // Layout assumes auth (middleware enforces). Demo fallback when DB is offline.
  const user = session
    ? { fullName: session.fullName, role: "Formando", avatarUrl: undefined as string | undefined }
    : { fullName: MOCK_TRAINEE.fullName, role: MOCK_TRAINEE.role, avatarUrl: MOCK_TRAINEE.avatarUrl };

  const items: SidebarItem[] = [
    {
      label: "Painel",
      href: `/${params.tenantSlug}/portal/dashboard`,
      icon: LayoutDashboard,
    },
    {
      label: "Meus Cursos",
      href: `/${params.tenantSlug}/portal/courses`,
      icon: BookOpen,
    },
    {
      label: "Calendário",
      href: `/${params.tenantSlug}/portal/calendar`,
      icon: CalendarDays,
    },
    {
      label: "Certificados",
      href: `/${params.tenantSlug}/portal/certificates`,
      icon: Award,
    },
    {
      label: "Configurações",
      href: `/${params.tenantSlug}/portal/settings`,
      icon: Settings,
    },
  ];

  return (
    <>
      <DashboardSidebar
        brandTitle="Academia Digital"
        brandSubtitle="Portal do Trainee"
        items={items}
      />
      <DashboardTopbar
        user={user}
        searchPlaceholder="Buscar cursos, sessões..."
        hasNotifications
      />
      {children}
      <MobileBottomNav tenantSlug={params.tenantSlug} />
    </>
  );
}
