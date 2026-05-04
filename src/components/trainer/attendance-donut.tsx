type Props = {
  present: number;
  total: number;
  size?: number;
  strokeWidth?: number;
};

/**
 * Pure-SVG donut chart for the attendance summary.
 * Two arcs: gold for present, surface-mid for remaining.
 */
export function AttendanceDonut({
  present,
  total,
  size = 200,
  strokeWidth = 18,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = total > 0 ? present / total : 0;
  const dash = circumference * ratio;
  const gap = circumference - dash;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="-rotate-90"
        aria-hidden
      >
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        {/* progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#CCA823"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${gap}`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tabular-nums leading-none text-navy md:text-4xl">
          {present}
          <span className="text-ink-faint">/{total}</span>
        </span>
        <span className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-subtle">
          Presentes
        </span>
      </div>
    </div>
  );
}
