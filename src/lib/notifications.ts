import "server-only";

import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/auth/jwt";

export type NotificationKind =
  | "SESSION_STARTING"
  | "SIGNATURE_REQUIRED"
  | "ATTENDANCE_PENDING"
  | "CERTIFICATE_READY"
  | "TRAINEE_ENROLLED"
  | "ATA_REQUIRED"
  | "GENERIC";

export type Notification = {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  href?: string;
  createdAt: Date;
  isUrgent?: boolean;
};

/**
 * Computes notifications for a given user session.
 * Derived from current Prisma state (no separate Notification table yet).
 */
export async function getNotifications(
  session: SessionPayload,
  tenantSlug: string
): Promise<Notification[]> {
  switch (session.role) {
    case "TRAINEE":
      return getTraineeNotifications(session, tenantSlug);
    case "TRAINER":
      return getTrainerNotifications(session, tenantSlug);
    case "ADMIN":
    case "OWNER":
      return getAdminNotifications(session, tenantSlug);
    default:
      return [];
  }
}

async function getTraineeNotifications(
  session: SessionPayload,
  tenantSlug: string
): Promise<Notification[]> {
  const trainee = await prisma.trainee.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!trainee) return [];

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const [upcoming, pendingSignatures] = await Promise.all([
    prisma.session.findMany({
      where: {
        scheduledStart: { gte: now, lte: in24h },
        attendances: { some: { traineeId: trainee.id } },
      },
      include: {
        trainingAction: {
          include: { course: { select: { name: true } } },
        },
      },
      orderBy: { scheduledStart: "asc" },
      take: 5,
    }),
    prisma.attendance.findMany({
      where: {
        traineeId: trainee.id,
        signatureState: "ENABLED",
      },
      include: {
        session: {
          include: {
            trainingAction: {
              include: { course: { select: { name: true } } },
            },
          },
        },
      },
      take: 5,
    }),
  ]);

  const notifications: Notification[] = [];

  for (const s of upcoming) {
    const hoursUntil = Math.round(
      (s.scheduledStart.getTime() - now.getTime()) / (60 * 60 * 1000)
    );
    notifications.push({
      id: `session-${s.id}`,
      kind: "SESSION_STARTING",
      title: `${s.trainingAction.course.name}`,
      body:
        hoursUntil <= 1
          ? `Sessão começa em menos de 1 hora`
          : `Sessão começa em ${hoursUntil}h`,
      href: `/${tenantSlug}/portal/sessions/${s.id}/checkin`,
      createdAt: s.scheduledStart,
      isUrgent: hoursUntil <= 2,
    });
  }

  for (const a of pendingSignatures) {
    notifications.push({
      id: `sig-${a.id}`,
      kind: "SIGNATURE_REQUIRED",
      title: "Assinatura pendente",
      body: `${a.session.trainingAction.course.name} · sessão ${a.session.number}`,
      href: `/${tenantSlug}/portal/sessions/${a.session.id}/checkin`,
      createdAt: a.session.scheduledStart,
      isUrgent: true,
    });
  }

  return notifications.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

async function getTrainerNotifications(
  session: SessionPayload,
  tenantSlug: string
): Promise<Notification[]> {
  const trainer = await prisma.trainer.findUnique({
    where: { userId: session.userId },
    select: { id: true },
  });
  if (!trainer) return [];

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const upcoming = await prisma.session.findMany({
    where: {
      scheduledStart: { gte: now, lte: in24h },
      trainingAction: {
        trainers: { some: { trainerId: trainer.id } },
      },
    },
    include: {
      trainingAction: {
        include: {
          course: { select: { name: true, code: true } },
          entity: { select: { name: true } },
        },
      },
      _count: { select: { attendances: true } },
    },
    orderBy: { scheduledStart: "asc" },
    take: 5,
  });

  return upcoming.map((s) => {
    const hoursUntil = Math.round(
      (s.scheduledStart.getTime() - now.getTime()) / (60 * 60 * 1000)
    );
    return {
      id: `trainer-session-${s.id}`,
      kind: "SESSION_STARTING" as const,
      title: `${s.trainingAction.course.name}`,
      body:
        hoursUntil <= 1
          ? `Sessão ${s.number} começa em <1h · ${s._count.attendances} formandos`
          : `Sessão ${s.number} em ${hoursUntil}h · ${s._count.attendances} formandos`,
      href: `/${tenantSlug}/trainer/sessions/${s.id}/attendance`,
      createdAt: s.scheduledStart,
      isUrgent: hoursUntil <= 2,
    };
  });
}

async function getAdminNotifications(
  session: SessionPayload,
  tenantSlug: string
): Promise<Notification[]> {
  const now = new Date();
  const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [endingSoon, recentEnrollments] = await Promise.all([
    prisma.trainingAction.findMany({
      where: {
        tenantId: session.tenantId,
        status: "IN_PROGRESS",
        endDate: { gte: now, lte: in7days },
      },
      include: {
        course: { select: { name: true } },
        entity: { select: { name: true } },
      },
      take: 5,
    }),
    prisma.enrollment.findMany({
      where: {
        trainingAction: { tenantId: session.tenantId },
        enrolledAt: { gte: last24h },
      },
      include: {
        trainee: {
          include: { user: { select: { fullName: true } } },
        },
        trainingAction: {
          include: { course: { select: { name: true } } },
        },
      },
      orderBy: { enrolledAt: "desc" },
      take: 5,
    }),
  ]);

  const notifications: Notification[] = [];

  for (const t of endingSoon) {
    const daysUntil = Math.round(
      (t.endDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );
    notifications.push({
      id: `ending-${t.id}`,
      kind: "ATA_REQUIRED",
      title: `Turma ${t.code} termina em ${daysUntil}d`,
      body: `${t.course.name}${t.entity ? ` · ${t.entity.name}` : ""}`,
      href: `/${tenantSlug}/admin/courses`,
      createdAt: t.endDate,
      isUrgent: daysUntil <= 2,
    });
  }

  for (const e of recentEnrollments) {
    notifications.push({
      id: `enroll-${e.id}`,
      kind: "TRAINEE_ENROLLED",
      title: `Nova inscrição: ${e.trainee.user.fullName}`,
      body: e.trainingAction.course.name,
      href: `/${tenantSlug}/admin/trainees`,
      createdAt: e.enrolledAt,
    });
  }

  return notifications.sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}
