import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/lib/mock-data";

const TYPE_DOT = {
  evaluation: "bg-blue-500",
  material: "bg-gold",
  presence: "bg-slate-300",
  certificate: "bg-emerald-500",
} as const;

type Props = {
  activities: ActivityItem[];
};

export function ActivityTimeline({ activities }: Props) {
  return (
    <ol className="relative space-y-5 border-l border-border pl-5">
      {activities.map((activity) => (
        <li key={activity.id} className="relative">
          <span
            className={cn(
              "absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-card",
              TYPE_DOT[activity.type]
            )}
          />
          <p className="text-sm font-bold text-navy">{activity.title}</p>
          <p className="mt-0.5 text-xs text-ink-muted">{activity.description}</p>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            {activity.timestamp}
          </p>
        </li>
      ))}
    </ol>
  );
}
