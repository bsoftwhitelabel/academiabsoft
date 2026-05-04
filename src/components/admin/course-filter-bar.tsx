"use client";

import { useCallback, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronDown, FilterX } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterOption = { value: string; label: string };

type Props = {
  areas: FilterOption[];
  modalities: FilterOption[];
  statuses: FilterOption[];
};

export function CourseFilterBar({ areas, modalities, statuses }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") params.set(key, value);
      else params.delete(key);
      startTransition(() => {
        const qs = params.toString();
        router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const clearAll = () => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  const activeArea = searchParams.get("area") ?? "all";
  const activeModality = searchParams.get("modality") ?? "all";
  const activeStatus = searchParams.get("status") ?? "all";
  const hasActive =
    activeArea !== "all" ||
    activeModality !== "all" ||
    activeStatus !== "all";

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_1fr_1fr_auto] md:gap-4 md:p-5">
      <FilterSelect
        label="Área de Formação"
        value={activeArea}
        options={areas}
        onChange={(v) => updateParam("area", v)}
      />
      <FilterSelect
        label="Modalidade"
        value={activeModality}
        options={modalities}
        onChange={(v) => updateParam("modality", v)}
      />
      <FilterSelect
        label="Estado do Curso"
        value={activeStatus}
        options={statuses}
        onChange={(v) => updateParam("status", v)}
      />
      <button
        onClick={clearAll}
        disabled={!hasActive}
        className={cn(
          "flex h-full items-end justify-center rounded-lg border border-border px-3 transition-colors md:h-auto md:items-center md:self-end md:py-2.5",
          hasActive
            ? "bg-card text-navy hover:bg-surface-low"
            : "cursor-not-allowed text-ink-faint"
        )}
        aria-label="Limpar filtros"
      >
        <FilterX className="h-4 w-4" />
        <span className="ml-1.5 text-xs font-semibold md:hidden">
          Limpar filtros
        </span>
      </button>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-lg border border-border bg-card pl-3 pr-9 text-sm font-medium text-navy focus:border-navy focus:ring-2 focus:ring-navy/20 focus:outline-none"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
      </div>
    </label>
  );
}
