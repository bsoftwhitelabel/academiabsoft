import { Sparkles } from "lucide-react";

type Props = {
  level: string;
  description: string;
  currentHours: number;
  targetHours: number;
};

export function MilestoneCard({
  level,
  description,
  currentHours,
  targetHours,
}: Props) {
  const progress = Math.min(100, (currentHours / targetHours) * 100);

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-6">
      <h3 className="mb-4 text-h3 font-bold text-navy">Próximo Marco</h3>

      <div className="mb-6 rounded-lg border border-gold/20 bg-gold/5 p-4">
        <div className="mb-2.5 inline-flex items-center gap-2 text-gold-700">
          <Sparkles className="h-4 w-4" strokeWidth={2.5} />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {level}
          </span>
        </div>
        <p className="text-sm leading-snug text-navy">{description}</p>
      </div>

      <div className="mt-auto space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-ink-muted">Meta: {targetHours}h</span>
          <span className="text-navy tabular-nums">
            {currentHours}/{targetHours}h
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-surface-mid">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-light to-gold"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
