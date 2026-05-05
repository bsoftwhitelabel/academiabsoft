import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { FichaInscricaoPdf } from "@/lib/pdf/ficha-inscricao";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MODALITY_LABEL = {
  PRESENCIAL: "Presencial",
  ELEARNING: "E-learning",
  BLENDED: "Híbrido",
} as const;

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { traineeId: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const explicitTaId = url.searchParams.get("trainingActionId") ?? undefined;

  const trainee = await prisma.trainee.findUnique({
    where: { id: params.traineeId },
    include: {
      user: {
        select: { fullName: true, email: true, phone: true },
      },
      tenant: { select: { id: true, name: true, dgertCode: true } },
      entity: { select: { name: true } },
      enrollments: {
        include: {
          trainingAction: {
            include: {
              course: {
                select: {
                  name: true,
                  code: true,
                  durationHours: true,
                  modality: true,
                },
              },
            },
          },
        },
        orderBy: { enrolledAt: "desc" },
      },
    },
  });

  if (!trainee) {
    return NextResponse.json({ error: "Trainee not found" }, { status: 404 });
  }
  if (trainee.tenantId !== session.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Self-access OR admin/trainer access
  const isSelf = trainee.userId === session.userId;
  const isPriviledged =
    session.role === "ADMIN" ||
    session.role === "OWNER" ||
    session.role === "TRAINER";
  if (!isSelf && !isPriviledged) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const enrollment = explicitTaId
    ? trainee.enrollments.find(
        (e) => e.trainingActionId === explicitTaId
      ) ?? trainee.enrollments[0]
    : trainee.enrollments[0];

  if (!enrollment) {
    return NextResponse.json(
      {
        error:
          "Sem inscrição associada. Inscreva o formando numa turma antes de gerar a ficha.",
      },
      { status: 409 }
    );
  }

  const ta = enrollment.trainingAction;
  const buffer = await renderToBuffer(
    <FichaInscricaoPdf
      tenantName={trainee.tenant.name}
      entityName={trainee.entity?.name ?? "Sem cliente associado"}
      dgertCode={trainee.tenant.dgertCode ?? "—"}
      courseName={ta.course.name}
      courseCode={ta.course.code}
      courseDurationHours={ta.course.durationHours}
      courseModality={MODALITY_LABEL[ta.course.modality] ?? ta.course.modality}
      trainingActionCode={ta.code}
      startDate={fmtDate(ta.startDate)}
      endDate={fmtDate(ta.endDate)}
      traineeFullName={trainee.user.fullName}
      traineeEmail={trainee.user.email}
      traineeDocumentNumber={trainee.documentNumber ?? "—"}
      traineeNif={trainee.taxId ?? "—"}
      traineeBirthDate={fmtDate(trainee.birthDate)}
      traineeAddress={
        [trainee.address, trainee.postalCode, trainee.city]
          .filter(Boolean)
          .join(", ") || "—"
      }
      traineeProfession={trainee.profession ?? "—"}
      traineeQualification={trainee.qualification ?? "—"}
    />
  );

  const filename = `ficha-inscricao-${trainee.user.fullName.replace(/\s+/g, "-")}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
