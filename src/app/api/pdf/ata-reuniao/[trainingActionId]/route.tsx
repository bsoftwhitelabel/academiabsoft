import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { AtaReuniaoPdf } from "@/lib/pdf/ata-reuniao";
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
  { params }: { params: { trainingActionId: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ta = await prisma.trainingAction.findUnique({
    where: { id: params.trainingActionId },
    include: {
      tenant: { select: { name: true, dgertCode: true } },
      entity: { select: { name: true } },
      course: { select: { name: true } },
      trainers: {
        include: {
          trainer: { include: { user: { select: { fullName: true } } } },
        },
      },
      sessions: {
        select: { status: true },
      },
      _count: { select: { enrollments: true, sessions: true } },
    },
  });

  if (!ta) {
    return NextResponse.json(
      { error: "Training action not found" },
      { status: 404 }
    );
  }
  if (ta.tenantId !== session.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const totalSessions = ta._count.sessions;
  const attendedSessions = ta.sessions.filter(
    (s) => s.status === "CLOSED" || s.status === "IN_PROGRESS"
  ).length;

  const enrollments = await prisma.enrollment.findMany({
    where: { trainingActionId: ta.id },
    select: { attendanceRate: true },
  });
  const avg =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce((s, e) => s + e.attendanceRate, 0) /
            enrollments.length
        )
      : 0;

  const trainerName =
    ta.trainers.find((t) => t.isPrimary)?.trainer.user.fullName ??
    ta.trainers[0]?.trainer.user.fullName ??
    "Formador a confirmar";

  const buffer = await renderToBuffer(
    <AtaReuniaoPdf
      tenantName={ta.tenant.name}
      entityName={ta.entity?.name ?? "Sem cliente"}
      dgertCode={ta.tenant.dgertCode ?? "—"}
      trainingActionCode={ta.code}
      courseName={ta.course.name}
      startDate={fmtDate(ta.startDate)}
      endDate={fmtDate(ta.endDate)}
      totalSessions={totalSessions}
      attendedSessions={attendedSessions}
      totalTrainees={ta._count.enrollments}
      averageAttendance={avg}
      trainerName={trainerName}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ata-reuniao-${ta.code}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
