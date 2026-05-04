import { QrCode, CheckCircle2 } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { Button } from "@/components/ui/button";
import { AttendancePageClient } from "@/components/trainer/attendance-page-client";
import { DgertDocumentsMenu } from "@/components/trainer/dgert-documents-menu";
import { MOCK_ATTENDANCE_SESSION } from "@/lib/mock-data";

export const metadata = { title: "Controlo de Presenças" };

type Props = {
  params: { tenantSlug: string; sessionId: string };
};

export default function AttendancePage({ params }: Props) {
  const session = MOCK_ATTENDANCE_SESSION;

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[
          {
            label: "Training Actions",
            href: `/${params.tenantSlug}/trainer/sessions`,
          },
          { label: "Attendance" },
        ]}
        title="Controlo de Presenças"
        description={`${session.trainingActionCode} · ${session.courseName} · Sessão ${session.sessionNumber}/${session.totalSessions}`}
        actions={
          <>
            <Button
              variant="outline"
              className="h-10 gap-1.5 border-border bg-card text-navy hover:bg-surface-low"
            >
              <QrCode className="h-4 w-4" />
              QR Code
            </Button>
            <DgertDocumentsMenu
              sessionId={params.sessionId}
              trainingActionId={session.trainingActionCode}
              sampleTraineeId={session.trainees[0]?.id ?? "att-1"}
            />
            <Button className="h-10 gap-1.5 bg-navy text-white hover:bg-navy/90">
              <CheckCircle2 className="h-4 w-4" />
              Finalizar Sessão
            </Button>
          </>
        }
      />

      <AttendancePageClient session={session} />
    </DashboardShell>
  );
}
