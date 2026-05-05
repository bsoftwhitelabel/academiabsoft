import Link from "next/link";
import { LogIn, ShieldAlert } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";

type Props = {
  tenantSlug: string;
  title?: string;
  hasBottomNav?: boolean;
};

/**
 * Renders an in-app empty state when the page-level session is missing.
 * Used INSTEAD OF a redirect, so navigation never bumps the user out.
 * Middleware already enforces auth on /portal /admin /trainer — this is a
 * safety net for transient cases (cookie expired between requests, etc.).
 */
export function SessionRequired({
  tenantSlug,
  title = "Sessão expirada",
  hasBottomNav,
}: Props) {
  return (
    <DashboardShell hasBottomNav={hasBottomNav}>
      <PageHeader title={title} />
      <div className="rounded-2xl border border-amber-300/60 bg-amber-50/40 px-8 py-12 text-center ring-1 ring-amber-200/40">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-amber-700">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-navy">
          A tua sessão expirou
        </h2>
        <p className="mt-2 max-w-md text-sm text-ink-muted mx-auto">
          Por segurança, vamos pedir-te para entrar novamente. Os teus dados
          estão guardados.
        </p>
        <Link
          href={`/${tenantSlug}/auth/login`}
          className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-navy px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-navy/90"
        >
          <LogIn className="h-3.5 w-3.5" />
          Entrar
        </Link>
      </div>
    </DashboardShell>
  );
}
