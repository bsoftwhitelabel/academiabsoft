import "server-only";

import { prisma } from "@/lib/prisma";

export type PlanTier = "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

export type PlanDefinition = {
  id: PlanTier;
  name: string;
  description: string;
  pricePerMonthEur: number | null;
  limits: {
    trainees: number;
    activeCourses: number;
    activeTrainingActions: number;
    monthlyCertificates: number;
    customDomain: boolean;
    advancedReports: boolean;
    apiAccess: boolean;
  };
  isFeatured?: boolean;
};

/**
 * Plan catalog. Numbers and prices are PLACEHOLDERS — finalize with BSoft
 * once commercial rules are agreed. Used by /admin/billing for visualization
 * and by future Stripe integration to gate features.
 */
export const PLANS: PlanDefinition[] = [
  {
    id: "FREE",
    name: "Trial",
    description:
      "Teste a plataforma com até 10 formandos. Sem cartão, sem custo.",
    pricePerMonthEur: 0,
    limits: {
      trainees: 10,
      activeCourses: 3,
      activeTrainingActions: 1,
      monthlyCertificates: 10,
      customDomain: false,
      advancedReports: false,
      apiAccess: false,
    },
  },
  {
    id: "STARTER",
    name: "Starter",
    description:
      "Para entidades formadoras a iniciar a digitalização DGERT.",
    pricePerMonthEur: 49,
    limits: {
      trainees: 100,
      activeCourses: 20,
      activeTrainingActions: 10,
      monthlyCertificates: 100,
      customDomain: false,
      advancedReports: false,
      apiAccess: false,
    },
  },
  {
    id: "PRO",
    name: "Professional",
    description:
      "Volume médio · custom domain incluído · relatórios avançados.",
    pricePerMonthEur: 149,
    isFeatured: true,
    limits: {
      trainees: 500,
      activeCourses: 100,
      activeTrainingActions: 50,
      monthlyCertificates: 500,
      customDomain: true,
      advancedReports: true,
      apiAccess: false,
    },
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    description:
      "Sem limites · API completa · SLA · auditoria DGERT dedicada.",
    pricePerMonthEur: null, // sob consulta
    limits: {
      trainees: Number.MAX_SAFE_INTEGER,
      activeCourses: Number.MAX_SAFE_INTEGER,
      activeTrainingActions: Number.MAX_SAFE_INTEGER,
      monthlyCertificates: Number.MAX_SAFE_INTEGER,
      customDomain: true,
      advancedReports: true,
      apiAccess: true,
    },
  },
];

export function getPlan(id: PlanTier): PlanDefinition {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export type UsageSnapshot = {
  trainees: number;
  activeCourses: number;
  activeTrainingActions: number;
  monthlyCertificates: number;
  totalCertificates: number;
};

/**
 * Compute current usage from Prisma. Live snapshot — no caching yet.
 */
export async function getTenantUsage(tenantId: string): Promise<UsageSnapshot> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    trainees,
    activeCourses,
    activeTrainingActions,
    monthlyCertificates,
    totalCertificates,
  ] = await Promise.all([
    prisma.trainee.count({ where: { tenantId } }),
    prisma.course.count({
      where: { tenantId, status: "ACTIVE" },
    }),
    prisma.trainingAction.count({
      where: {
        tenantId,
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
    }),
    prisma.certificate.count({
      where: {
        trainee: { tenantId },
        issuedAt: { gte: monthStart },
      },
    }),
    prisma.certificate.count({
      where: { trainee: { tenantId } },
    }),
  ]);

  return {
    trainees,
    activeCourses,
    activeTrainingActions,
    monthlyCertificates,
    totalCertificates,
  };
}

/**
 * Read the current plan from tenant.settings JSON (key = "planTier").
 * Falls back to FREE if not set. Future migration adds dedicated TenantPlan
 * table when commercial rules are signed off.
 */
export async function getTenantPlan(
  tenantId: string
): Promise<{ tier: PlanTier; since: Date | null }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true, createdAt: true },
  });
  const settings = (tenant?.settings ?? {}) as { planTier?: PlanTier };
  return {
    tier: settings.planTier ?? "FREE",
    since: tenant?.createdAt ?? null,
  };
}
