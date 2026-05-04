import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  /** Adds extra bottom padding for mobile bottom-nav. */
  hasBottomNav?: boolean;
  className?: string;
};

export function DashboardShell({ children, hasBottomNav, className }: Props) {
  return (
    <main
      className={cn(
        "min-h-screen bg-background pt-topbar md:pl-sidebar",
        hasBottomNav && "pb-20 md:pb-0",
        className
      )}
    >
      <div className="mx-auto max-w-container px-4 py-6 md:px-8 md:py-8">
        {children}
      </div>
    </main>
  );
}

export function PageHeader({
  breadcrumb,
  title,
  description,
  actions,
}: {
  breadcrumb?: { label: string; href?: string }[];
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-ink-faint">›</span>}
                {item.href ? (
                  <a
                    href={item.href}
                    className="transition-colors hover:text-navy"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-navy">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-h1 font-bold tracking-tight text-navy">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}
