"use client";

import Link from "next/link";
import {
  Bell,
  Calendar,
  PenLine,
  CheckCircle2,
  UserPlus,
  FileText,
  Sparkles,
  Inbox,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Notification, NotificationKind } from "@/lib/notifications";

const KIND_ICON: Record<NotificationKind, typeof Bell> = {
  SESSION_STARTING: Calendar,
  SIGNATURE_REQUIRED: PenLine,
  ATTENDANCE_PENDING: CheckCircle2,
  CERTIFICATE_READY: Sparkles,
  TRAINEE_ENROLLED: UserPlus,
  ATA_REQUIRED: FileText,
  GENERIC: Bell,
};

const KIND_COLOR: Record<NotificationKind, string> = {
  SESSION_STARTING: "bg-blue-50 text-blue-700",
  SIGNATURE_REQUIRED: "bg-amber-50 text-amber-700",
  ATTENDANCE_PENDING: "bg-emerald-50 text-emerald-700",
  CERTIFICATE_READY: "bg-purple-50 text-purple-700",
  TRAINEE_ENROLLED: "bg-blue-50 text-blue-700",
  ATA_REQUIRED: "bg-red-50 text-red-700",
  GENERIC: "bg-slate-100 text-slate-700",
};

type Props = {
  notifications: Notification[];
};

export function NotificationBell({ notifications }: Props) {
  const urgentCount = notifications.filter((n) => n.isUrgent).length;
  const total = notifications.length;
  const hasAny = total > 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={`Notificações${total ? ` (${total})` : ""}`}
          className="relative grid h-9 w-9 place-items-center rounded-md text-ink-muted transition-colors hover:bg-surface-low hover:text-navy"
        >
          <Bell className="h-4 w-4" strokeWidth={2} />
          {hasAny && (
            <span
              className={cn(
                "absolute right-1 top-1 grid h-4 min-w-[16px] place-items-center rounded-full px-1 text-[9px] font-bold leading-none text-white ring-2 ring-background",
                urgentCount > 0 ? "bg-red-500" : "bg-navy"
              )}
            >
              {total > 9 ? "9+" : total}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[360px] p-0"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-bold text-navy">Notificações</h3>
          {total > 0 && (
            <span className="rounded-full bg-navy/8 px-2 py-0.5 text-[10px] font-bold text-navy">
              {total}
            </span>
          )}
        </div>

        {!hasAny ? (
          <div className="px-6 py-12 text-center">
            <Inbox className="mx-auto mb-3 h-8 w-8 text-ink-faint" />
            <p className="text-sm font-bold text-navy">Tudo em dia</p>
            <p className="mt-1 text-xs text-ink-muted">
              Sem notificações pendentes.
            </p>
          </div>
        ) : (
          <ul className="max-h-[420px] divide-y divide-border overflow-y-auto">
            {notifications.map((n) => {
              const Icon = KIND_ICON[n.kind];
              const colorCls = KIND_COLOR[n.kind];
              const content = (
                <div className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-low/50">
                  <div
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-md",
                      colorCls
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-bold text-navy">
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">
                        {n.body}
                      </p>
                    )}
                  </div>
                  {n.isUrgent && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                  )}
                </div>
              );
              return (
                <li key={n.id}>
                  {n.href ? (
                    <Link href={n.href}>{content}</Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
