"use client";

import { useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
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
    <div className="sticky top-topbar z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-container flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:px-8">
        {/* area pills */}
        <div className="flex items-center gap-3 overflow-x-auto md:overflow-visible">
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Área
          </span>
          <div className="flex gap-2">
            {areas.map((area) => {
              const isActive = activeArea === area.slug;
              return (
                <button
                  key={area.slug}
                  onClick={() => updateParam("area", area.slug)}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all",
                    isActive
                      ? "bg-navy text-white shadow-card-elevated"
                      : "bg-surface-low text-ink-muted hover:bg-surface-mid hover:text-navy"
                  )}
                >
                  {area.name}
                  {area.count !== undefined && area.count > 0 && (
                    <span
                      className={cn(
                        "ml-1.5 text-[10px] tabular-nums",
                        isActive ? "opacity-70" : "opacity-50"
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

        {/* search */}
        <div className="relative w-full md:w-72">
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
  );
}
