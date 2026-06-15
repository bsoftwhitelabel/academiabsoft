export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
        <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
      </div>
      <div className="rounded-md border bg-background">
        <div className="flex gap-4 border-b p-3">
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className="h-4 flex-1 bg-muted/60 animate-pulse rounded" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 border-b p-3 last:border-b-0">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-4 flex-1 bg-muted/30 animate-pulse rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
