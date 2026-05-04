import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { getSession } from "@/lib/auth/session";

export default async function AdminLayout({
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
        role: "Administrador",
        avatarUrl: undefined as string | undefined,
      }
    : {
        fullName: "Dr. Silva Neves",
        role: "Administrador",
        avatarUrl:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&q=80",
      };

  return (
    <>
      <DashboardSidebar
        role="admin"
        tenantSlug={params.tenantSlug}
        brandTitle="Academia Digital"
        brandSubtitle="Gestão de Treinamento"
      />
      <DashboardTopbar user={user} searchPlaceholder="Pesquisar cursos..." />
      {children}
    </>
  );
}
