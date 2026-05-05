import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  hasBottomNav?: boolean;
  message?: string;
};

export function PageLoading({ hasBottomNav, message = "A carregar…" }: Props) {
  return (
    <main
      className={cn(
        "min-h-screen bg-background pt-topbar md:pl-sidebar",
        hasBottomNav && "pb-20 md:pb-0"
      )}
    >
      <div className="mx-auto max-w-container px-4 py-6 md:px-8 md:py-8">
        {/* header skeleton */}
        <div className="mb-8 space-y-3">
          <div className="h-3 w-24 animate-pulse rounded bg-surface-low" />
          <div className="h-7 w-72 animate-pulse rounded bg-surface-low" />
          <div className="h-4 w-96 max-w-full animate-pulse rounded bg-surface-low" />
        </div>

        {/* stats grid skeleton */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>

        {/* content rows skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-border bg-card"
            />
          ))}
        </div>

        {/* floating "a carregar" pill */}
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 shadow-lg"
        >
          <Loader2 className="h-4 w-4 animate-spin text-navy" strokeWidth={2.5} />
          <span className="text-xs font-bold text-navy">{message}</span>
        </div>
      </div>
    </main>
  );
}
