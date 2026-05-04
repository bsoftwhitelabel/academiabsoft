import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Briefcase,
  BarChart3,
  Settings,
} from "lucide-react";
import { DashboardSidebar, type SidebarItem } from "@/components/dashboard/dashboard-sidebar";
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
    ? { fullName: session.fullName, role: "Administrador", avatarUrl: undefined as string | undefined }
    : {
        fullName: "Dr. Silva Neves",
        role: "Administrador",
        avatarUrl:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&q=80",
      };

  const items: SidebarItem[] = [
    {
      label: "Dashboard",
      href: `/${params.tenantSlug}/admin/dashboard`,
      icon: LayoutDashboard,
    },
    {
      label: "Cursos",
      href: `/${params.tenantSlug}/admin/courses`,
      icon: GraduationCap,
      badge: 42,
    },
    {
      label: "Estudantes",
      href: `/${params.tenantSlug}/admin/trainees`,
      icon: Users,
      badge: "1.075",
    },
    {
      label: "Instrutores",
      href: `/${params.tenantSlug}/admin/trainers`,
      icon: Briefcase,
    },
    {
      label: "Relatórios",
      href: `/${params.tenantSlug}/admin/reports`,
      icon: BarChart3,
    },
    {
      label: "Configurações",
      href: `/${params.tenantSlug}/admin/settings`,
      icon: Settings,
    },
  ];

  return (
    <>
      <DashboardSidebar
        brandTitle="Academia Digital"
        brandSubtitle="Gestão de Treinamento"
        items={items}
      />
      <DashboardTopbar user={user} searchPlaceholder="Pesquisar cursos..." />
      {children}
    </>
  );
}
