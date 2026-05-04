import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { FolhaPresencasPdf } from "@/lib/pdf/folha-presencas";
import { MOCK_ATTENDANCE_SESSION } from "@/lib/mock-data";
import { getTenantBySlug } from "@/lib/tenant";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params: _params }: { params: { sessionId: string } }
) {
  // demo: use mock data; in production fetch from DB scoped to current tenant
  const session = MOCK_ATTENDANCE_SESSION;
  const tenant = await getTenantBySlug("oportoforte");

  const buffer = await renderToBuffer(
    <FolhaPresencasPdf
      session={session}
      tenantName={tenant?.name ?? "Academia Digital"}
      entityName="Decathlon Portugal"
      dgertCode="20255"
      trainerName="Ricardo Santos"
      location="Decathlon Maia · Auditório Principal"
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="folha-presencas-${session.trainingActionCode}-S${session.sessionNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
