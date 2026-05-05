import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { FolhaPresencasPdf } from "@/lib/pdf/folha-presencas";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getInitials } from "@/lib/utils";
import type { AttendanceSession, AttendanceTrainee } from "@/lib/mock-data";

export const runtime = "nodejs";

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtDateLong(d: Date): string {
  return d.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionRow = await prisma.session.findUnique({
    where: { id: params.sessionId },
    include: {
      trainingAction: {
        include: {
          tenant: { select: { name: true, dgertCode: true } },
          entity: { select: { name: true } },
          course: { select: { name: true } },
          trainers: {
            include: {
              trainer: {
                include: {
                  user: { select: { fullName: true } },
                },
              },
            },
          },
          _count: { select: { sessions: true } },
        },
      },
      attendances: {
        include: {
          trainee: {
            include: {
              user: {
                select: { fullName: true, email: true, avatarUrl: true },
              },
              entity: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!sessionRow) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (sessionRow.trainingAction.tenant && session.tenantId) {
    const taTenantId = await prisma.trainingAction.findUnique({
      where: { id: sessionRow.trainingActionId },
      select: { tenantId: true },
    });
    if (taTenantId?.tenantId !== session.tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const ta = sessionRow.trainingAction;

  const trainees: AttendanceTrainee[] = sessionRow.attendances.map((a) => ({
    id: a.trainee.id,
    fullName: a.trainee.user.fullName,
    email: a.trainee.user.email,
    initials: getInitials(a.trainee.user.fullName),
    avatarUrl: a.trainee.user.avatarUrl,
    status: a.status,
    signatureState: a.signatureState,
    checkedInAt: a.checkedInAt ? a.checkedInAt.toISOString() : null,
  }));

  const folhaSession: AttendanceSession = {
    id: sessionRow.id,
    trainingActionCode: ta.code,
    courseName: ta.course.name,
    sessionNumber: sessionRow.number,
    totalSessions: ta._count.sessions,
    scheduledStart: fmtTime(sessionRow.scheduledStart),
    scheduledEnd: fmtTime(sessionRow.scheduledEnd),
    dateLabel: fmtDateLong(sessionRow.scheduledStart),
    trainees,
  };

  const trainerName =
    ta.trainers.find((t) => t.isPrimary)?.trainer.user.fullName ??
    ta.trainers[0]?.trainer.user.fullName ??
    "Formador a confirmar";

  const buffer = await renderToBuffer(
    <FolhaPresencasPdf
      session={folhaSession}
      tenantName={ta.tenant.name}
      entityName={ta.entity?.name ?? "Sem cliente"}
      dgertCode={ta.tenant.dgertCode ?? "—"}
      trainerName={trainerName}
      location={[ta.location, ta.room].filter(Boolean).join(" · ") || "—"}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="folha-presencas-${ta.code}-S${sessionRow.number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
