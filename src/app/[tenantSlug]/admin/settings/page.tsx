import { redirect } from "next/navigation";
import { Save } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { SettingsTabsWithDomain } from "@/components/admin/settings-tabs";

export const metadata = { title: "Configurações · White-label" };

type Props = { params: { tenantSlug: string } };

export default async function AdminSettingsPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: {
      slug: true,
      name: true,
      domain: true,
      logoUrl: true,
      primaryColor: true,
      accentColor: true,
      dgertCode: true,
    },
  });

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[
          { label: "Gestão", href: `/${params.tenantSlug}/admin` },
          { label: "Configurações" },
        ]}
        title="Configurações White-label"
        description="Branding · domínio · email · integrações · DGERT"
        actions={
          <Button
            type="submit"
            form="settings-form"
            className="h-10 gap-1.5 bg-navy text-white hover:bg-navy/90"
          >
            <Save className="h-4 w-4" />
            Guardar (demo)
          </Button>
        }
      />

      <SettingsTabsWithDomain
        tenant={
          tenant ?? {
            slug: params.tenantSlug,
            name: "Tenant",
            domain: null,
            logoUrl: null,
            primaryColor: "#0B2447",
            accentColor: "#CCA823",
            dgertCode: null,
          }
        }
      />
    </DashboardShell>
  );
}
