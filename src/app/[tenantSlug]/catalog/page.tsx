import { Search } from "lucide-react";
import { HeroSection } from "@/components/catalog/hero-section";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CourseCard } from "@/components/catalog/course-card";
import { CorporateCta } from "@/components/catalog/corporate-cta";
import { cachedGetTenantBySlug, cachedListAreas } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import type { MockCourse, MockArea } from "@/lib/mock-data";

type Props = {
  params: { tenantSlug: string };
  searchParams: { area?: string; q?: string };
};

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop&q=80";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default async function CatalogPage({ params, searchParams }: Props) {
  const activeArea = searchParams.area ?? "all";
  const query = searchParams.q?.trim() ?? "";

  const tenant = await cachedGetTenantBySlug(params.tenantSlug);
  if (!tenant) {
    return <EmptyTenant />;
  }

  // Resolve area filter to ID by slug (cached 1h)
  const areas = await cachedListAreas(tenant.id);

  const areaSlugs = areas.map((a) => ({ ...a, slug: slugify(a.name) }));
  const activeAreaRecord =
    activeArea === "all"
      ? null
      : areaSlugs.find((a) => a.slug === activeArea) ?? null;

  const baseWhere = {
    tenantId: tenant.id,
    status: "ACTIVE" as const,
    isPublic: true,
  };

  // Course list
  const courses = await prisma.course.findMany({
    where: {
      ...baseWhere,
      ...(activeAreaRecord ? { trainingAreaId: activeAreaRecord.id } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { code: { contains: query, mode: "insensitive" as const } },
              {
                marketingDescription: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    },
    include: {
      trainingArea: { select: { name: true } },
      _count: { select: { trainingActions: true } },
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  // Per-area counts (respect query but ignore area filter)
  const counts = await prisma.course.groupBy({
    by: ["trainingAreaId"],
    where: {
      ...baseWhere,
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" as const } },
              { code: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    _count: { _all: true },
  });
  const totalAll = counts.reduce((s, r) => s + r._count._all, 0);

  const areasWithCount: MockArea[] = [
    { slug: "all", name: "Todos", code: "*", count: totalAll },
    ...areaSlugs.map((a) => ({
      slug: a.slug,
      name: a.name,
      code: a.code ?? "",
      count: counts.find((c) => c.trainingAreaId === a.id)?._count._all ?? 0,
    })),
  ];

  const items: MockCourse[] = courses.map((c) => ({
    id: c.id,
    slug: c.slug,
    code: c.code,
    name: c.name,
    shortName: c.shortName ?? c.name,
    area: c.trainingArea?.name ?? "Sem área",
    areaSlug: c.trainingArea ? slugify(c.trainingArea.name) : "no-area",
    modality: c.modality,
    durationHours: c.durationHours,
    priceEur: c.priceEur ? Number(c.priceEur) : null,
    isFeatured: c.isFeatured,
    isPublic: c.isPublic,
    coverImageUrl: c.coverImageUrl ?? FALLBACK_COVER,
    marketingDescription: c.marketingDescription ?? "",
    certificationLevel: c.certificationLevel,
    tags: c.tagsRaw ? c.tagsRaw.split(",").map((t) => t.trim()) : [],
    turmasCount: c._count.trainingActions,
  }));

  return (
    <>
      <HeroSection
        badge="Certificação Oficial DGERT"
        title="Formação Profissional Certificada DGERT"
        subtitle={`${tenant.name} · cursos desenhados por especialistas da indústria. Formação flexível, prática e reconhecida em todo o mercado nacional.`}
        primaryCta={{ label: "Ver Catálogo", href: "#catalogo" }}
        secondaryCta={{ label: "Falar com Consultor", href: "#contact" }}
      />

      <CatalogFilters
        areas={areasWithCount}
        activeArea={activeArea}
        initialQuery={query}
      />

      <section
        id="catalogo"
        className="mx-auto max-w-container px-4 py-12 md:px-8 md:py-16"
      >
        {items.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <>
            <header className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-h1 font-bold text-navy">
                  {activeAreaRecord
                    ? activeAreaRecord.name
                    : "Catálogo completo"}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {items.length} curso{items.length !== 1 && "s"} disponíve
                  {items.length !== 1 ? "is" : "l"}
                  {query && (
                    <>
                      {" "}para{" "}
                      <span className="font-semibold text-navy">
                        &ldquo;{query}&rdquo;
                      </span>
                    </>
                  )}
                </p>
              </div>
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  href={`/${params.tenantSlug}/catalog/${course.slug}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <CorporateCta />
    </>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-low/50 px-8 py-20 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-surface-mid text-ink-muted">
        <Search className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-navy">
        Nenhum curso encontrado
      </h3>
      <p className="mt-1 max-w-md text-sm text-ink-muted">
        {query
          ? `Não encontrámos cursos para "${query}". Tente outra área ou termos diferentes.`
          : "Ajuste os filtros para ver mais resultados."}
      </p>
    </div>
  );
}

function EmptyTenant() {
  return (
    <section className="mx-auto max-w-container px-4 py-24 text-center">
      <h1 className="text-h1 font-bold text-navy">Tenant não encontrado</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Verifica o URL ou contacta o administrador.
      </p>
    </section>
  );
}
