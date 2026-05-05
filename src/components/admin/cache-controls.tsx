"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Trash2,
  Database,
  GraduationCap,
  Building2,
  FolderTree,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  clearAllCache,
  clearCoursesCache,
  clearTenantCache,
  clearAreasCache,
} from "@/app/[tenantSlug]/admin/cache/actions";
import { cn } from "@/lib/utils";

type Action = () => Promise<{ ok: boolean; message?: string; error?: string }>;

const SCOPED_ACTIONS: Array<{
  id: string;
  icon: typeof Database;
  title: string;
  description: string;
  ttl: string;
  action: Action;
}> = [
  {
    id: "tenant",
    icon: Building2,
    title: "Tenant · branding",
    description: "Logo, cores, código DGERT, domínio personalizado.",
    ttl: "TTL 1h",
    action: clearTenantCache,
  },
  {
    id: "courses",
    icon: GraduationCap,
    title: "Catálogo de cursos",
    description: "Lista pública, detalhe de curso, módulos, edições.",
    ttl: "TTL 5min",
    action: clearCoursesCache,
  },
  {
    id: "areas",
    icon: FolderTree,
    title: "Áreas de formação",
    description: "Categorização DGERT (CITE-F).",
    ttl: "TTL 1h",
    action: clearAreasCache,
  },
];

export function CacheControls() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);

  const run = (id: string, action: Action) => {
    setActiveId(id);
    startTransition(async () => {
      const res = await action();
      if (res.ok) {
        toast.success(res.message ?? "Cache limpa.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Erro");
      }
      setActiveId(null);
    });
  };

  return (
    <div className="space-y-6">
      {/* Nuke button */}
      <article className="rounded-2xl border-2 border-red-300/60 bg-red-50/40 p-6 ring-1 ring-red-200/30">
        <header className="mb-3 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-red-100 text-red-700">
            <Trash2 className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy">Limpar tudo</h2>
            <p className="text-xs text-ink-muted">
              Invalida todas as caches do teu tenant. Use após alterações em
              massa (importação de cursos, mudança de branding, etc.).
            </p>
          </div>
        </header>
        <button
          type="button"
          onClick={() => run("all", clearAllCache)}
          disabled={pending}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md bg-red-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-red-700",
            pending && "cursor-wait opacity-60"
          )}
        >
          {pending && activeId === "all" ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />A limpar…
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5" />
              Limpar toda a cache
            </>
          )}
        </button>
      </article>

      {/* Scoped buttons */}
      <article className="rounded-2xl border border-border bg-card p-6">
        <header className="mb-4">
          <h2 className="text-base font-bold text-navy">
            Limpeza seletiva por área
          </h2>
          <p className="mt-1 text-xs text-ink-muted">
            Invalida apenas a cache da área indicada. Mais cirúrgico — usa
            quando sabes exatamente o que mudou.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {SCOPED_ACTIONS.map((it) => {
            const Icon = it.icon;
            const isLoading = pending && activeId === it.id;
            return (
              <article
                key={it.id}
                className="flex flex-col rounded-xl border border-border bg-surface-low/40 p-4"
              >
                <header className="mb-2 flex items-start justify-between gap-2">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-card text-navy ring-1 ring-border">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="rounded-full bg-card px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink-subtle ring-1 ring-border">
                    {it.ttl}
                  </span>
                </header>
                <h3 className="text-sm font-bold text-navy">{it.title}</h3>
                <p className="mt-1 flex-1 text-[11px] leading-relaxed text-ink-muted">
                  {it.description}
                </p>
                <button
                  type="button"
                  onClick={() => run(it.id, it.action)}
                  disabled={pending}
                  className={cn(
                    "mt-3 inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-navy transition-colors hover:bg-surface-low",
                    pending && "cursor-wait opacity-60"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Limpar…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3" />
                      Limpar
                    </>
                  )}
                </button>
              </article>
            );
          })}
        </div>
      </article>
    </div>
  );
}
