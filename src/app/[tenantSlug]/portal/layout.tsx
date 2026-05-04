import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
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
    ? {
        fullName: session.fullName,
        role: "Formando",
        avatarUrl: undefined as string | undefined,
      }
    : {
        fullName: MOCK_TRAINEE.fullName,
        role: MOCK_TRAINEE.role,
        avatarUrl: MOCK_TRAINEE.avatarUrl,
      };

  return (
    <>
      <DashboardSidebar
        role="trainee"
        tenantSlug={params.tenantSlug}
        brandTitle="Academia Digital"
        brandSubtitle="Portal do Trainee"
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
