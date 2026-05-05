import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse, type NextRequest } from "next/server";
import { DossieDgertPdf, type DossieDgertData } from "@/lib/pdf";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MODALITY_LABEL = {
  PRESENCIAL: "Presencial",
  ELEARNING: "E-learning",
  BLENDED: "Híbrido (B-Learning)",
} as const;

function fmtDate(d: Date): string {
  return d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function diffHours(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 36e5);
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
      tenant: { select: { name: true, dgertCode: true, slug: true } },
      entity: { select: { name: true } },
      course: {
        include: {
          modules: { orderBy: { order: "asc" } },
        },
      },
      trainers: {
        include: {
          trainer: {
            include: {
              user: { select: { fullName: true } },
            },
          },
        },
      },
      enrollments: {
        include: {
          trainee: {
            include: {
              user: { select: { fullName: true, email: true } },
            },
          },
          attendances: {
            select: {
              status: true,
              signatureState: true,
              session: {
                select: {
                  scheduledStart: true,
                  scheduledEnd: true,
                },
              },
            },
          },
        },
      },
      sessions: {
        orderBy: { number: "asc" },
        include: {
          attendances: { select: { status: true } },
        },
      },
    },
  });

  if (!ta) {
    return NextResponse.json({ error: "Training action not found" }, { status: 404 });
  }

  // tenant boundary
  if (ta.tenantId !== session.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const enrolledCount = ta.enrollments.length;

  const trainees = ta.enrollments.map((e) => {
    const totalSessions = e.attendances.length;
    const presentAttendances = e.attendances.filter(
      (a) =>
        a.status === "PRESENT" ||
        a.status === "CHECKED_IN" ||
        a.status === "MANUAL_PRESENT"
    );
    const attendedHours = presentAttendances.reduce(
      (acc, a) =>
        acc + diffHours(a.session.scheduledStart, a.session.scheduledEnd),
      0
    );
    const totalHours = e.attendances.reduce(
      (acc, a) =>
        acc + diffHours(a.session.scheduledStart, a.session.scheduledEnd),
      0
    );
    const signedSessions = e.attendances.filter(
      (a) => a.signatureState === "SIGNED"
    ).length;
    const attendanceRate = totalHours > 0 ? (attendedHours / totalHours) * 100 : 0;

    return {
      id: e.trainee.id,
      fullName: e.trainee.user.fullName,
      email: e.trainee.user.email,
      taxId: e.trainee.taxId,
      attendedHours,
      totalHours,
      attendanceRate,
      signedSessions,
      totalSessions,
    };
  });

  const sessionsRows = ta.sessions.map((s) => {
    const present = s.attendances.filter(
      (a) =>
        a.status === "PRESENT" ||
        a.status === "CHECKED_IN" ||
        a.status === "MANUAL_PRESENT"
    ).length;
    return {
      number: s.number,
      title: s.title,
      date: fmtDate(s.scheduledStart),
      start: fmtTime(s.scheduledStart),
      end: fmtTime(s.scheduledEnd),
      hours: diffHours(s.scheduledStart, s.scheduledEnd),
      presentCount: present,
      totalEnrolled: enrolledCount,
    };
  });

  const data: DossieDgertData = {
    tenantName: ta.tenant.name,
    tenantDgertCode: ta.tenant.dgertCode ?? "—",
    entityName: ta.entity?.name ?? "Sem cliente",
    trainingActionCode: ta.code,
    trainingActionName: ta.name ?? ta.course.name,
    courseName: ta.course.name,
    courseCode: ta.course.code,
    modalityLabel: MODALITY_LABEL[ta.modality] ?? ta.modality,
    startDate: fmtDate(ta.startDate),
    endDate: fmtDate(ta.endDate),
    totalDurationHours: ta.durationHours,
    location: [ta.location, ta.room].filter(Boolean).join(" · ") || "Sem local",
    objetivosGerais: ta.course.objetivosGerais,
    objetivosEspecificos: ta.course.objetivosEspecificos,
    metodologia: ta.course.metodologia,
    metodologiaAvaliacao: ta.course.metodologiaAvaliacao,
    modules: ta.course.modules.map((m) => ({
      order: m.order,
      name: m.name,
      durationHours: m.durationHours,
    })),
    trainers: ta.trainers.map((tt) => ({
      fullName: tt.trainer.user.fullName,
      ccpNumber: tt.trainer.ccpNumber,
      bio: tt.trainer.bio,
    })),
    trainees,
    sessions: sessionsRows,
  };

  const buffer = await renderToBuffer(<DossieDgertPdf data={data} />);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="dossie-dgert-${ta.code}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
