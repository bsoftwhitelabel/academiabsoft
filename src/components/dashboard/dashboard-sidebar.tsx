"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, LucideIcon, LogOut, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";

export type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
};

type Props = {
  brandTitle: string;
  brandSubtitle: string;
  items: SidebarItem[];
  showSupport?: boolean;
  showLogout?: boolean;
};

export function DashboardSidebar({
  brandTitle,
  brandSubtitle,
  items,
  showSupport = true,
  showLogout = true,
}: Props) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-sidebar flex-col border-r border-border bg-card md:flex">
      <div className="flex flex-col gap-1 px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-navy text-white">
            <GraduationCap className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-base font-bold tracking-tight text-navy">
            {brandTitle}
          </span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-subtle">
          {brandSubtitle}
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-surface-low font-semibold text-navy"
                  : "text-ink-muted hover:bg-surface-low/60 hover:text-navy"
              )}
            >
              {isActive && (
                <span className="absolute -right-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-navy" />
              )}
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
                {item.label}
              </span>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    isActive
                      ? "bg-navy text-white"
                      : "bg-surface-mid text-ink-muted"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 px-3 pb-4 pt-4">
        {showSupport && (
          <button className="flex w-full items-center justify-center gap-2 rounded-md bg-surface-low px-3 py-2 text-xs font-semibold text-navy transition-colors hover:bg-surface-mid">
            <LifeBuoy className="h-4 w-4" strokeWidth={2} />
            Suporte
          </button>
        )}
        {showLogout && (
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-red-50 hover:text-red-600">
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Sair
          </button>
        )}
      </div>
    </aside>
  );
}
