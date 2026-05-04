import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { FichaInscricaoPdf } from "@/lib/pdf/ficha-inscricao";
import { MOCK_ATTENDANCE_SESSION } from "@/lib/mock-data";
import { getTenantBySlug } from "@/lib/tenant";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { traineeId: string } }
) {
  const trainee =
    MOCK_ATTENDANCE_SESSION.trainees.find((t) => t.id === params.traineeId) ??
    MOCK_ATTENDANCE_SESSION.trainees[0];
  const tenant = await getTenantBySlug("oportoforte");

  const buffer = await renderToBuffer(
    <FichaInscricaoPdf
      tenantName={tenant?.name ?? "Academia Digital"}
      entityName="Decathlon Portugal"
      dgertCode="20255"
      courseName="Segurança e Higiene no Trabalho"
      courseCode="SHT-001"
      courseDurationHours={35}
      courseModality="Presencial"
      trainingActionCode="T001"
      startDate="07/03/2026"
      endDate="11/04/2026"
      traineeFullName={trainee.fullName}
      traineeEmail={trainee.email}
      traineeDocumentNumber="14587963"
      traineeNif="500123456"
      traineeBirthDate="14/05/1988"
      traineeAddress="Rua da Boavista, 1234, 4100-110 Porto"
      traineeProfession="Operador de Logística"
      traineeQualification="Licenciatura"
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ficha-inscricao-${trainee.fullName.replace(/\s+/g, "-")}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
