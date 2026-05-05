import { redirect } from "next/navigation";
import { Save } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { TraineeSettingsForm } from "@/components/trainee/settings-form";

export const metadata = { title: "Configurações" };

type Props = { params: { tenantSlug: string } };

export default async function PortalSettingsPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  const trainee = await prisma.trainee.findUnique({
    where: { userId: session.userId },
    include: {
      user: {
        select: {
          fullName: true,
          preferredName: true,
          email: true,
          phone: true,
          emailVerifiedAt: true,
        },
      },
      entity: { select: { name: true } },
    },
  });

  if (!trainee) {
    return (
      <DashboardShell hasBottomNav>
        <PageHeader title="Configurações" />
        <p className="text-sm text-ink-muted">Perfil de formando não encontrado.</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell hasBottomNav>
      <PageHeader
        breadcrumb={[{ label: "Configurações" }]}
        title="Configurações"
        description="Dados pessoais · privacidade RGPD · preferências"
        actions={
          <Button
            type="submit"
            form="trainee-settings-form"
            className="h-10 gap-1.5 bg-navy text-white hover:bg-navy/90"
          >
            <Save className="h-4 w-4" />
            Guardar alterações
          </Button>
        }
      />

      <TraineeSettingsForm
        initial={{
          fullName: trainee.user.fullName,
          preferredName: trainee.user.preferredName ?? "",
          email: trainee.user.email,
          phone: trainee.user.phone ?? "",
          documentNumber: trainee.documentNumber ?? "",
          taxId: trainee.taxId ?? "",
          birthDate: trainee.birthDate
            ? trainee.birthDate.toISOString().slice(0, 10)
            : "",
          address: trainee.address ?? "",
          city: trainee.city ?? "",
          postalCode: trainee.postalCode ?? "",
          country: trainee.country ?? "Portugal",
          profession: trainee.profession ?? "",
          qualification: trainee.qualification ?? "",
          entityName: trainee.entity?.name ?? "—",
          emailVerified: !!trainee.user.emailVerifiedAt,
        }}
      />
    </DashboardShell>
  );
}
