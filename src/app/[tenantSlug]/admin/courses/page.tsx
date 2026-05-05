import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { CourseGridCard, CourseAddCard } from "@/components/admin/course-grid-card";
import { CourseFilterBar } from "@/components/admin/course-filter-bar";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import type { MockCourse } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const metadata = { title: "Cursos · Gestão" };

type Props = {
  params: { tenantSlug: string };
  searchParams: { area?: string; modality?: string; status?: string; page?: string };
};

const MODALITY_OPTIONS = [
  { value: "all", label: "Todas as Modalidades" },
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "ELEARNING", label: "E-learning" },
  { value: "BLENDED", label: "Híbrido" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "Ativos e Arquivados" },
  { value: "active", label: "Apenas Ativos" },
  { value: "archived", label: "Apenas Arquivados" },
];

const PAGE_SIZE = 12;

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop&q=80";

export default async function AdminCoursesPage({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);

  const areas = await prisma.trainingArea.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true },
  });

  const areaSlug = (a: { name: string }) =>
    a.name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

  const AREA_OPTIONS = [
    { value: "all", label: "Todas as Áreas" },
    ...areas.map((a) => ({ value: areaSlug(a), label: a.name })),
  ];

  const statusFilter = searchParams.status;
  const where = {
    tenantId: session.tenantId,
    ...(searchParams.modality && searchParams.modality !== "all"
      ? { modality: searchParams.modality as "PRESENCIAL" | "ELEARNING" | "BLENDED" }
      : {}),
    ...(statusFilter === "archived"
      ? { status: "ARCHIVED" as const }
      : statusFilter === "active"
      ? { status: "ACTIVE" as const }
      : {}),
    ...(searchParams.area && searchParams.area !== "all"
      ? {
          trainingArea: {
            name: {
              equals: areas.find((a) => areaSlug(a) === searchParams.area)?.name ?? "",
              mode: "insensitive" as const,
            },
          },
        }
      : {}),
  };

  const [courses, totalCount] = await Promise.all([
    prisma.course.findMany({
      where,
      include: {
        trainingArea: { select: { name: true } },
        _count: { select: { trainingActions: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.count({ where }),
  ]);

  // Aggregate enrollments per course
  const enrollmentCounts = await prisma.enrollment.groupBy({
    by: ["trainingActionId"],
    _count: { _all: true },
  });
  const tasInCourses = await prisma.trainingAction.findMany({
    where: { courseId: { in: courses.map((c) => c.id) } },
    select: { id: true, courseId: true },
  });
  const enrollMap = new Map<string, number>();
  for (const ec of enrollmentCounts) {
    const ta = tasInCourses.find((t) => t.id === ec.trainingActionId);
    if (ta) {
      enrollMap.set(ta.courseId, (enrollMap.get(ta.courseId) ?? 0) + ec._count._all);
    }
  }

  const items: MockCourse[] = courses.map((c) => ({
    id: c.id,
    slug: c.slug,
    code: c.code,
    name: c.name,
    shortName: c.shortName ?? c.name,
    area: c.trainingArea?.name ?? "Sem área",
    areaSlug: c.trainingArea ? areaSlug(c.trainingArea) : "no-area",
    modality: c.modality,
    durationHours: c.durationHours,
    priceEur: c.priceEur ? Number(c.priceEur) : null,
    isFeatured: c.isFeatured,
    isPublic: c.isPublic,
    isArchived: c.status === "ARCHIVED",
    coverImageUrl: c.coverImageUrl ?? FALLBACK_COVER,
    marketingDescription: c.marketingDescription ?? "",
    certificationLevel: c.certificationLevel,
    tags: c.tagsRaw ? c.tagsRaw.split(",").map((t) => t.trim()) : [],
    turmasCount: c._count.trainingActions,
    formandosCount: enrollMap.get(c.id) ?? 0,
  }));

  const currentPage = Number(searchParams.page ?? "1");
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = items.slice(start, start + PAGE_SIZE);

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[
          { label: "Gestão", href: `/${params.tenantSlug}/admin` },
          { label: "Cursos" },
        ]}
        title="Todos os Cursos"
        description={`${totalCount} cursos · catálogo da plataforma`}
        actions={
          <Button asChild className="h-10 gap-1.5 bg-navy text-white hover:bg-navy/90">
            <Link href={`/${params.tenantSlug}/admin/courses/new`}>
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Novo Curso
            </Link>
          </Button>
        }
      />

      <CourseFilterBar
        areas={AREA_OPTIONS}
        modalities={MODALITY_OPTIONS}
        statuses={STATUS_OPTIONS}
      />

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-low/40 px-8 py-16 text-center">
          <h3 className="text-base font-bold text-navy">Sem cursos</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Cria o primeiro curso para o teu catálogo.
          </p>
          <Button
            asChild
            className="mt-4 h-10 gap-1.5 bg-navy text-white hover:bg-navy/90"
          >
            <Link href={`/${params.tenantSlug}/admin/courses/new`}>
              <Plus className="h-4 w-4" />
              Criar curso
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((course) => (
              <CourseGridCard
                key={course.id}
                course={course}
                href={`/${params.tenantSlug}/admin/courses/${course.slug}`}
              />
            ))}
            {pageItems.length < PAGE_SIZE && (
              <CourseAddCard href={`/${params.tenantSlug}/admin/courses/new`} />
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={items.length}
            pageItemsCount={pageItems.length}
            searchParams={searchParams}
          />
        </>
      )}
    </DashboardShell>
  );
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageItemsCount,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageItemsCount: number;
  searchParams: { area?: string; modality?: string; status?: string };
}) {
  const buildHref = (p: number) => {
    const sp = new URLSearchParams();
    if (searchParams.area) sp.set("area", searchParams.area);
    if (searchParams.modality) sp.set("modality", searchParams.modality);
    if (searchParams.status) sp.set("status", searchParams.status);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `?${qs}` : "?";
  };

  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm md:flex-row">
      <p className="text-ink-muted">
        Exibindo <strong className="text-navy">{pageItemsCount}</strong> de{" "}
        <strong className="text-navy">{totalItems}</strong> cursos cadastrados
      </p>
      <nav className="flex items-center gap-1">
        <a
          href={currentPage > 1 ? buildHref(currentPage - 1) : "#"}
          className={cn(
            "grid h-8 w-8 place-items-center rounded border border-border transition-colors",
            currentPage > 1
              ? "bg-card text-navy hover:bg-surface-low"
              : "cursor-not-allowed text-ink-faint"
          )}
          aria-disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </a>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <a
            key={p}
            href={buildHref(p)}
            className={cn(
              "grid h-8 w-8 place-items-center rounded text-xs font-bold tabular-nums transition-colors",
              p === currentPage
                ? "bg-navy text-white"
                : "border border-transparent text-ink-muted hover:border-border hover:bg-surface-low"
            )}
          >
            {p}
          </a>
        ))}
        <a
          href={currentPage < totalPages ? buildHref(currentPage + 1) : "#"}
          className={cn(
            "grid h-8 w-8 place-items-center rounded border border-border transition-colors",
            currentPage < totalPages
              ? "bg-card text-navy hover:bg-surface-low"
              : "cursor-not-allowed text-ink-faint"
          )}
          aria-disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </a>
      </nav>
    </div>
  );
}
