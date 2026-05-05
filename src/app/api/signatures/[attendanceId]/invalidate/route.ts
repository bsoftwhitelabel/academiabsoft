import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

/**
 * Invalidate a signature.
 * Allowed for: ADMIN, OWNER, or the TRAINER assigned to the training action.
 * Sets attendance.signatureState = INVALIDATED. Audit trail kept (postClassReason
 * stores the reason; signature row is preserved).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { attendanceId: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { reason?: string } = {};
  try {
    body = await request.json();
  } catch {
    // tolerate empty body
  }
  const reason = (body.reason ?? "").trim();
  if (!reason) {
    return NextResponse.json(
      { error: "Reason is required to invalidate a signature." },
      { status: 400 }
    );
  }

  const attendance = await prisma.attendance.findUnique({
    where: { id: params.attendanceId },
    include: {
      session: {
        include: {
          trainingAction: {
            select: {
              tenantId: true,
              trainers: { select: { trainerId: true } },
            },
          },
        },
      },
    },
  });

  if (!attendance) {
    return NextResponse.json({ error: "Attendance not found" }, { status: 404 });
  }

  // tenant boundary
  if (attendance.session.trainingAction.tenantId !== session.tenantId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // role check
  const isAdmin = session.role === "ADMIN" || session.role === "OWNER";
  if (!isAdmin) {
    if (session.role !== "TRAINER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const trainer = await prisma.trainer.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });
    const isAssignedTrainer = !!trainer && attendance.session.trainingAction.trainers.some(
      (t) => t.trainerId === trainer.id
    );
    if (!isAssignedTrainer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  if (attendance.signatureState !== "SIGNED") {
    return NextResponse.json(
      {
        error: `Cannot invalidate: current state is ${attendance.signatureState}`,
      },
      { status: 409 }
    );
  }

  await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      signatureState: "INVALIDATED",
      postClassReason: `[INVALIDATED by ${session.email} at ${new Date().toISOString()}] ${reason}`,
    },
  });

  return NextResponse.json({ ok: true, attendanceId: attendance.id });
}
