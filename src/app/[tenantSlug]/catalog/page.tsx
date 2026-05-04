import { HeroSection } from "@/components/catalog/hero-section";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { CourseCard } from "@/components/catalog/course-card";
import { CorporateCta } from "@/components/catalog/corporate-cta";
import { getCourses, MOCK_AREAS } from "@/lib/mock-data";
import { Search } from "lucide-react";

type Props = {
  params: { tenantSlug: string };
  searchParams: { area?: string; q?: string };
};

export default function CatalogPage({ params, searchParams }: Props) {
  const activeArea = searchParams.area ?? "all";
  const query = searchParams.q ?? "";
  const courses = getCourses({ area: activeArea, query });

  // build areas with current counts
  const areasWithCount = MOCK_AREAS.map((area) => ({
    ...area,
    count:
      area.slug === "all"
        ? getCourses({ query }).length
        : getCourses({ query, area: area.slug }).length,
  }));

  return (
    <>
      <HeroSection
        badge="Certificação Oficial DGERT"
        title="Formação Profissional Certificada DGERT"
        subtitle="Eleve as suas competências com cursos desenhados por especialistas da indústria. Formação flexível, prática e reconhecida em todo o mercado nacional."
        primaryCta={{ label: "Ver Catálogo", href: "#catalogo" }}
        secondaryCta={{ label: "Falar com Consultor", href: "#contact" }}
      />

      <CatalogFilters
        areas={areasWithCount}
        activeArea={activeArea}
        initialQuery={query}
      />

      <section id="catalogo" className="mx-auto max-w-container px-4 py-12 md:px-8 md:py-16">
        {courses.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <>
            <header className="mb-8 flex items-end justify-between">
              <div>
                <h2 className="text-h1 font-bold text-navy">
                  {activeArea === "all"
                    ? "Catálogo completo"
                    : MOCK_AREAS.find((a) => a.slug === activeArea)?.name}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {courses.length} curso{courses.length !== 1 && "s"} disponíve
                  {courses.length !== 1 ? "is" : "l"}
                  {query && (
                    <>
                      {" "}para <span className="font-semibold text-navy">&ldquo;{query}&rdquo;</span>
                    </>
                  )}
                </p>
              </div>
            </header>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
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
