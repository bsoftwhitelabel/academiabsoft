"use client";

import { useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

type Area = {
  slug: string;
  name: string;
  count?: number;
};

type Props = {
  areas: Area[];
  activeArea: string;
  initialQuery: string;
};

export function CatalogFilters({ areas, activeArea, initialQuery }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto w-full max-w-container px-4 py-4 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          {/* Area pills — wrap on desktop, scroll on mobile */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
              <Filter className="h-3 w-3" />
              Áreas de formação
            </div>
            <div className="-mx-1 flex flex-wrap gap-2 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:overflow-visible">
              {areas.map((area) => {
                const isActive = activeArea === area.slug;
                return (
                  <button
                    key={area.slug}
                    onClick={() => updateParam("area", area.slug)}
                    className={cn(
                      "shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                      isActive
                        ? "bg-navy text-white shadow-card-elevated ring-2 ring-navy/20"
                        : "bg-surface-low text-ink-muted ring-1 ring-border hover:bg-surface-mid hover:text-navy"
                    )}
                    aria-pressed={isActive}
                  >
                    {area.name}
                    {area.count !== undefined && (
                      <span
                        className={cn(
                          "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-card text-ink-subtle"
                        )}
                      >
                        {area.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search — fixed-width on desktop, full-width on mobile */}
          <div className="relative w-full lg:w-72 lg:shrink-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input
              type="text"
              defaultValue={initialQuery}
              placeholder="Procurar curso..."
              onChange={(e) => updateParam("q", e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-9 text-sm text-foreground placeholder:text-ink-subtle focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
            />
            {initialQuery && (
              <button
                onClick={() => updateParam("q", null)}
                aria-label="Limpar pesquisa"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-subtle transition-colors hover:bg-surface-low hover:text-navy"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
