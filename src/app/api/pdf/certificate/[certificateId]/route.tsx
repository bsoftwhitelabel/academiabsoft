import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { CertificatePdf, type CertificateData } from "@/lib/pdf";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { certificateId: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cert = await prisma.certificate.findUnique({
    where: { id: params.certificateId },
    include: {
      trainee: {
        include: {
          user: { select: { fullName: true } },
          tenant: { select: { name: true, dgertCode: true } },
          entity: { select: { name: true } },
        },
      },
      trainingAction: {
        include: {
          course: {
            select: {
              name: true,
              code: true,
              durationHours: true,
            },
          },
          trainers: {
            include: {
              trainer: {
                include: { user: { select: { fullName: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!cert) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }
  if (cert.trainee.tenantId !== session.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isSelf = cert.trainee.userId === session.userId;
  const isPriviledged =
    session.role === "ADMIN" ||
    session.role === "OWNER" ||
    session.role === "TRAINER";
  if (!isSelf && !isPriviledged) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const primaryTrainer =
    cert.trainingAction.trainers.find((t) => t.isPrimary)?.trainer ??
    cert.trainingAction.trainers[0]?.trainer;

  const data: CertificateData = {
    tenantName: cert.trainee.tenant.name,
    tenantDgertCode: cert.trainee.tenant.dgertCode ?? "—",
    entityName: cert.trainee.entity?.name ?? null,
    courseName: cert.trainingAction.course.name,
    courseCode: cert.trainingAction.course.code,
    courseDurationHours: cert.trainingAction.course.durationHours,
    certificationLevel: cert.level,
    traineeFullName: cert.trainee.user.fullName,
    traineeDocumentNumber: cert.trainee.documentNumber,
    traineeTaxId: cert.trainee.taxId,
    trainingActionCode: cert.trainingAction.code,
    startDate: fmtDate(cert.trainingAction.startDate),
    endDate: fmtDate(cert.trainingAction.endDate),
    certificateNumber: cert.number,
    verificationCode: cert.verificationCode,
    issuedAt: fmtDate(cert.issuedAt),
    trainerName: primaryTrainer?.user.fullName ?? "—",
    trainerCcpNumber: primaryTrainer?.ccpNumber ?? null,
  };

  const buffer = await renderToBuffer(<CertificatePdf data={data} />);
  const filename = `certificado-${cert.number}-${cert.trainee.user.fullName.replace(/\s+/g, "-")}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
