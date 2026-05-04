"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, History, User, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  tenantSlug: string;
};

export function MobileBottomNav({ tenantSlug }: Props) {
  const pathname = usePathname();
  const items = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: `/${tenantSlug}/portal/dashboard`,
    },
    {
      label: "Cursos",
      icon: BookOpen,
      href: `/${tenantSlug}/portal/courses`,
    },
    {
      label: "Histórico",
      icon: History,
      href: `/${tenantSlug}/portal/history`,
    },
    {
      label: "Perfil",
      icon: User,
      href: `/${tenantSlug}/portal/profile`,
    },
  ];

  return (
    <>
      {/* floating QR button (mobile only) */}
      <Link
        href={`/${tenantSlug}/portal/checkin`}
        aria-label="Check-in via QR"
        className="fixed bottom-20 right-4 z-50 grid h-12 w-12 place-items-center rounded-full bg-navy text-white shadow-navy-glow ring-4 ring-background transition-transform hover:scale-105 md:hidden"
      >
        <QrCode className="h-5 w-5" strokeWidth={2.25} />
      </Link>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background/95 backdrop-blur-md md:hidden">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-3 text-[10px] font-semibold transition-colors",
                isActive
                  ? "text-navy"
                  : "text-ink-subtle hover:text-navy"
              )}
            >
              <Icon
                className="h-5 w-5"
                strokeWidth={isActive ? 2.5 : 2}
              />
              {item.label}
              {isActive && (
                <span className="absolute bottom-0 h-0.5 w-12 rounded-t-full bg-navy" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
