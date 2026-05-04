import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  icon: LucideIcon;
  /** color theme of the icon background */
  variant?: "blue" | "gold" | "emerald" | "purple";
  trend?: { label: string; positive?: boolean };
  className?: string;
};

const VARIANTS = {
  blue: "bg-blue-50 text-blue-600",
  gold: "bg-gold-50 text-gold-700",
  emerald: "bg-emerald-50 text-emerald-600",
  purple: "bg-purple-50 text-purple-600",
} as const;

export function StatCard({
  label,
  value,
  icon: Icon,
  variant = "blue",
  trend,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-navy/15",
        className
      )}
    >
      <div
        className={cn(
          "grid h-11 w-11 shrink-0 place-items-center rounded-lg",
          VARIANTS[variant]
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-bold leading-none text-navy">
          {value}
        </p>
        {trend && (
          <p
            className={cn(
              "mt-1.5 text-[11px] font-semibold",
              trend.positive ? "text-emerald-600" : "text-ink-muted"
            )}
          >
            {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
