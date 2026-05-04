import {
  LayoutDashboard,
  GraduationCap,
  Activity,
  Users,
  ClipboardList,
  CalendarDays,
  Settings,
} from "lucide-react";
import { DashboardSidebar, type SidebarItem } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import { getSession } from "@/lib/auth/session";

export default async function TrainerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { tenantSlug: string };
}) {
  const session = await getSession();
  const user = session
    ? { fullName: session.fullName, role: "Formador", avatarUrl: undefined as string | undefined }
    : {
        fullName: "Dr. Silva Neves",
        role: "Trainer Admin",
        avatarUrl:
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&q=80",
      };

  const items: SidebarItem[] = [
    {
      label: "Dashboard",
      href: `/${params.tenantSlug}/trainer/dashboard`,
      icon: LayoutDashboard,
    },
    {
      label: "Courses",
      href: `/${params.tenantSlug}/trainer/courses`,
      icon: GraduationCap,
    },
    {
      label: "Training Actions",
      href: `/${params.tenantSlug}/trainer/sessions`,
      icon: Activity,
    },
    {
      label: "Trainers",
      href: `/${params.tenantSlug}/trainer/trainers`,
      icon: Users,
    },
    {
      label: "Trainees",
      href: `/${params.tenantSlug}/trainer/trainees`,
      icon: Users,
    },
    {
      label: "Classes",
      href: `/${params.tenantSlug}/trainer/classes`,
      icon: ClipboardList,
    },
    {
      label: "Reports",
      href: `/${params.tenantSlug}/trainer/reports`,
      icon: CalendarDays,
    },
    {
      label: "Settings",
      href: `/${params.tenantSlug}/trainer/settings`,
      icon: Settings,
    },
  ];

  return (
    <>
      <DashboardSidebar
        brandTitle="Academia Digital"
        brandSubtitle="Management Portal"
        items={items}
      />
      <DashboardTopbar user={user} searchPlaceholder="Search..." />
      {children}
    </>
  );
}
