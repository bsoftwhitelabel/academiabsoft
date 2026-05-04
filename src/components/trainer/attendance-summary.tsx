"use client";

import { Users, CheckCircle2, XCircle } from "lucide-react";
import { AttendanceDonut } from "./attendance-donut";
import { cn } from "@/lib/utils";

type Filter = "all" | "present" | "absent";

type Props = {
  metrics: {
    total: number;
    present: number;
    absent: number;
    pending: number;
    adherence: number;
    avgCheckinMin: number;
  };
  activeFilter: Filter;
  onFilterChange: (f: Filter) => void;
};

export function AttendanceSummary({
  metrics,
  activeFilter,
  onFilterChange,
}: Props) {
  return (
    <div className="space-y-5">
      {/* donut + KPIs card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col items-center">
          <AttendanceDonut
            present={metrics.present}
            total={metrics.total}
          />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5">
          <KpiBlock label="Taxa adesão" value={`${metrics.adherence}%`} />
          <KpiBlock label="Tempo médio" value={`${metrics.avgCheckinMin}m`} />
        </div>
      </div>

      {/* view filter */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
          Filtros de Vista
        </p>
        <div className="space-y-2">
          <FilterTab
            label="Todos"
            count={metrics.total}
            icon={Users}
            isActive={activeFilter === "all"}
            onClick={() => onFilterChange("all")}
            variant="all"
          />
          <FilterTab
            label="Presentes"
            count={metrics.present}
            icon={CheckCircle2}
            isActive={activeFilter === "present"}
            onClick={() => onFilterChange("present")}
            variant="present"
          />
          <FilterTab
            label="Ausentes"
            count={metrics.absent + metrics.pending}
            icon={XCircle}
            isActive={activeFilter === "absent"}
            onClick={() => onFilterChange("absent")}
            variant="absent"
          />
        </div>
      </div>
    </div>
  );
}

function KpiBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold tabular-nums text-navy">{value}</p>
    </div>
  );
}

function FilterTab({
  label,
  count,
  icon: Icon,
  isActive,
  onClick,
  variant,
}: {
  label: string;
  count: number;
  icon: typeof Users;
  isActive: boolean;
  onClick: () => void;
  variant: "all" | "present" | "absent";
}) {
  const variantStyles = {
    all: isActive
      ? "bg-navy text-white"
      : "bg-card text-ink-muted hover:bg-surface-low",
    present: isActive
      ? "bg-emerald-600 text-white"
      : "bg-card text-ink-muted hover:bg-surface-low",
    absent: isActive
      ? "bg-red-600 text-white"
      : "bg-card text-ink-muted hover:bg-surface-low",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition-all",
        variantStyles[variant]
      )}
    >
      <span className="flex items-center gap-2.5">
        <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
        {label}
      </span>
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
          isActive ? "bg-white/20 text-white" : "bg-surface-mid text-navy"
        )}
      >
        {count}
      </span>
    </button>
  );
}
