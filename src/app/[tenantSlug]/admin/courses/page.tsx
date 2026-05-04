import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { CourseGridCard, CourseAddCard } from "@/components/admin/course-grid-card";
import { CourseFilterBar } from "@/components/admin/course-filter-bar";
import { Button } from "@/components/ui/button";
import { MOCK_COURSES, MOCK_AREAS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const metadata = { title: "Cursos · Gestão" };

type Props = {
  params: { tenantSlug: string };
  searchParams: { area?: string; modality?: string; status?: string; page?: string };
};

const AREA_OPTIONS = [
  { value: "all", label: "Todas as Áreas" },
  ...MOCK_AREAS.filter((a) => a.slug !== "all").map((a) => ({
    value: a.slug,
    label: a.name,
  })),
];

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

const PAGE_SIZE = 5;

export default function AdminCoursesPage({ params, searchParams }: Props) {
  const filtered = MOCK_COURSES.filter((c) => {
    if (searchParams.area && searchParams.area !== "all") {
      if (c.areaSlug !== searchParams.area) return false;
    }
    if (searchParams.modality && searchParams.modality !== "all") {
      if (c.modality !== searchParams.modality) return false;
    }
    if (searchParams.status === "active" && c.isArchived) return false;
    if (searchParams.status === "archived" && !c.isArchived) return false;
    return true;
  });

  const currentPage = Number(searchParams.page ?? "1");
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[
          { label: "Gestão", href: `/${params.tenantSlug}/admin` },
          { label: "Cursos" },
        ]}
        title="Todos os Cursos"
        actions={
          <Button className="h-10 gap-1.5 bg-navy text-white hover:bg-navy/90">
            <Plus className="h-4 w-4" strokeWidth={2.5} />
            Novo Curso
          </Button>
        }
      />

      <CourseFilterBar
        areas={AREA_OPTIONS}
        modalities={MODALITY_OPTIONS}
        statuses={STATUS_OPTIONS}
      />

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
        totalItems={filtered.length}
        pageItemsCount={pageItems.length}
        searchParams={searchParams}
      />
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
