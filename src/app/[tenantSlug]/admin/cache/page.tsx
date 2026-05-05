import { redirect } from "next/navigation";
import { Database, Zap, Info } from "lucide-react";
import { DashboardShell, PageHeader } from "@/components/dashboard/dashboard-shell";
import { CacheControls } from "@/components/admin/cache-controls";
import { getSession } from "@/lib/auth/session";

export const metadata = { title: "Cache · Performance" };

type Props = { params: { tenantSlug: string } };

export default async function AdminCachePage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect(`/${params.tenantSlug}/auth/login`);
  if (session.role !== "ADMIN" && session.role !== "OWNER") {
    redirect(`/${params.tenantSlug}/catalog`);
  }

  return (
    <DashboardShell>
      <PageHeader
        breadcrumb={[
          { label: "Gestão", href: `/${params.tenantSlug}/admin` },
          { label: "Cache" },
        ]}
        title="Gestão de Cache"
        description="Controlo manual da cache de leitura · invalidação cirúrgica por área"
      />

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-gold" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-subtle">
              Performance
            </h3>
          </div>
          <p className="text-sm text-navy">
            Cache reduz queries Prisma de <strong>50-300ms</strong> para{" "}
            <strong>&lt;1ms</strong> em hits.
          </p>
        </article>

        <article className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-subtle">
              Auto-invalidação
            </h3>
          </div>
          <p className="text-sm text-navy">
            Cada área tem TTL próprio. Tags são invalidadas automaticamente em
            mutações (criar/editar curso, etc.).
          </p>
        </article>

        <article className="rounded-xl border border-blue-200 bg-blue-50/40 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Quando limpar manualmente
            </h3>
          </div>
          <p className="text-sm text-navy">
            Após edições directas na DB, importação em massa, ou se o catálogo
            mostrar dados desactualizados.
          </p>
        </article>
      </div>

      <CacheControls />

      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-navy">
          Como funciona
        </h2>
        <ol className="space-y-3 text-sm text-ink-muted">
          <li className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy/8 text-[11px] font-bold text-navy">
              1
            </span>
            <span>
              <strong className="text-navy">Primeiro acesso a uma página:</strong>{" "}
              query Prisma → resultado guardado na cache com tag (ex.{" "}
              <code className="rounded bg-surface-low px-1 py-0.5 font-mono text-[10px]">
                courses:tenantId
              </code>
              ).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy/8 text-[11px] font-bold text-navy">
              2
            </span>
            <span>
              <strong className="text-navy">Acessos seguintes:</strong> servidos
              da memória — instantâneos.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy/8 text-[11px] font-bold text-navy">
              3
            </span>
            <span>
              <strong className="text-navy">Mutação (ex. criar curso):</strong>{" "}
              tag invalidada → próxima leitura refaz a query → cache renovada.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy/8 text-[11px] font-bold text-navy">
              4
            </span>
            <span>
              <strong className="text-navy">TTL:</strong> mesmo sem mutação, a
              cache expira no tempo configurado para garantir frescura.
            </span>
          </li>
        </ol>
      </section>
    </DashboardShell>
  );
}
