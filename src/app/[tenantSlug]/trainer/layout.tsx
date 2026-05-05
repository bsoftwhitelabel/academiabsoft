import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { getSession } from "@/lib/auth/session";
import { getNotifications } from "@/lib/notifications";

export default async function TrainerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantSlug: string };
}) {
  const session = await getSession();
  const user = session
    ? {
        fullName: session.fullName,
        role: "Formador",
        avatarUrl: undefined as string | undefined,
      }
    : {
        fullName: "Dr. Silva Neves",
        role: "Trainer Admin",
        avatarUrl:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&q=80",
      };

  const notifications = session
    ? await getNotifications(session, params.tenantSlug)
    : [];

  return (
    <>
      <DashboardSidebar
        role="trainer"
        tenantSlug={params.tenantSlug}
        brandTitle="Academia Digital"
        brandSubtitle="Management Portal"
      />
      <DashboardTopbar
        user={user}
        searchPlaceholder="Search..."
        notifications={notifications}
      />
      {children}
    </>
  );
}
