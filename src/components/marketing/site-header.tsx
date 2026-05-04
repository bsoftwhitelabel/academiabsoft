import Link from "next/link";
import { GraduationCap, Globe, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  tenantSlug: string;
  tenantName: string;
};

export function SiteHeader({ tenantSlug, tenantName }: Props) {
  return (
    <header className="sticky top-0 z-40 h-topbar border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-container items-center px-4 md:px-8">
        {/* left spacer — keeps brand centered on desktop */}
        <div className="hidden flex-1 md:flex" />

        {/* brand */}
        <Link
          href={`/${tenantSlug}/catalog`}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <div className="grid h-8 w-8 place-items-center rounded-md bg-navy text-white">
            <GraduationCap className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight text-navy">
            {tenantName}
          </span>
        </Link>

        {/* right cluster */}
        <div className="ml-auto flex flex-1 items-center justify-end gap-2 md:gap-4">
          <button className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink-muted transition-colors hover:bg-surface-low hover:text-navy">
            <Globe className="h-4 w-4" />
            <span>PT</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>
          <Button
            asChild
            size="sm"
            className="bg-navy text-white hover:bg-navy/90"
          >
            <Link href={`/${tenantSlug}/auth/login`}>Entrar</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
