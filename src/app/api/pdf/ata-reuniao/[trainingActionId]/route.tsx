import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { AtaReuniaoPdf } from "@/lib/pdf/ata-reuniao";
import { MOCK_ATTENDANCE_SESSION, computeAttendanceMetrics } from "@/lib/mock-data";
import { getTenantBySlug } from "@/lib/tenant";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params: _params }: { params: { trainingActionId: string } }
) {
  const tenant = await getTenantBySlug("oportoforte");
  const metrics = computeAttendanceMetrics(MOCK_ATTENDANCE_SESSION);

  const buffer = await renderToBuffer(
    <AtaReuniaoPdf
      tenantName={tenant?.name ?? "Academia Digital"}
      entityName="Decathlon Portugal"
      dgertCode="20255"
      trainingActionCode={MOCK_ATTENDANCE_SESSION.trainingActionCode}
      courseName={MOCK_ATTENDANCE_SESSION.courseName}
      startDate="07/03/2026"
      endDate="11/04/2026"
      totalSessions={MOCK_ATTENDANCE_SESSION.totalSessions}
      attendedSessions={MOCK_ATTENDANCE_SESSION.sessionNumber}
      totalTrainees={metrics.total}
      averageAttendance={metrics.adherence}
      trainerName="Ricardo Santos"
      notes="Sessão 3 com adesão de 66.7%. Dois formandos com ausência justificada por indisposição. Plano de recuperação acordado para sessão 4."
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ata-reuniao-${MOCK_ATTENDANCE_SESSION.trainingActionCode}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
