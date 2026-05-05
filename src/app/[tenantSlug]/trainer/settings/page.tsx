import { redirect } from "next/navigation";
import { Save } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { TrainerSettingsForm } from "@/components/trainer/settings-form";

export const metadata = { title: "Configurações · Formador" };

type Props = { params: { tenantSlug: string } };

export default async function TrainerSettingsPage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  const trainer =
    session.role === "TRAINER"
      ? await prisma.trainer.findUnique({
          where: { userId: session.userId },
          include: {
            user: {
              select: { fullName: true, email: true, phone: true },
            },
          },
        })
      : null;

  const initial = trainer
    ? {
        fullName: trainer.user.fullName,
        email: trainer.user.email,
        phone: trainer.user.phone ?? "",
        ccpNumber: trainer.ccpNumber ?? "",
        yearsPresentialExp: trainer.yearsPresentialExp ?? 0,
        yearsDistanceExp: trainer.yearsDistanceExp ?? 0,
        bio: trainer.bio ?? "",
        isExternal: trainer.isExternal,
        isElearning: trainer.isElearning,
      }
    : {
        fullName: session.fullName,
        email: session.email,
        phone: "",
        ccpNumber: "",
        yearsPresentialExp: 0,
        yearsDistanceExp: 0,
        bio: "",
        isExternal: false,
        isElearning: false,
      };

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[{ label: "Configurações" }]}
        title="Preferências do formador"
        description="Disponibilidade · áreas · perfil profissional"
        actions={
          <Button
            type="submit"
            form="trainer-settings-form"
            className="h-10 gap-1.5 bg-navy text-white hover:bg-navy/90"
          >
            <Save className="h-4 w-4" />
            Guardar
          </Button>
        }
      />

      <TrainerSettingsForm initial={initial} />
    </DashboardShell>
  );
}
