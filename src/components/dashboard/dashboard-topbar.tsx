import Image from "next/image";
import { Bell, HelpCircle, Search } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

type Props = {
  user: {
    fullName: string;
    role: string;
    avatarUrl?: string | null;
  };
  searchPlaceholder?: string;
  hasNotifications?: boolean;
  className?: string;
};

export function DashboardTopbar({
  user,
  searchPlaceholder = "Pesquisar...",
  hasNotifications = false,
  className,
}: Props) {
  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-30 flex h-topbar items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur-md md:left-sidebar md:px-8",
        className
      )}
    >
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-lg border border-border bg-surface-low/50 pl-9 pr-3 text-sm text-foreground placeholder:text-ink-subtle focus:border-navy focus:bg-background focus:ring-2 focus:ring-navy/20 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          aria-label="Notificações"
          className="relative grid h-9 w-9 place-items-center rounded-md text-ink-muted transition-colors hover:bg-surface-low hover:text-navy"
        >
          <Bell className="h-4 w-4" strokeWidth={2} />
          {hasNotifications && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
          )}
        </button>
        <button
          aria-label="Ajuda"
          className="grid h-9 w-9 place-items-center rounded-md text-ink-muted transition-colors hover:bg-surface-low hover:text-navy"
        >
          <HelpCircle className="h-4 w-4" strokeWidth={2} />
        </button>

        <div className="ml-1 flex items-center gap-3 border-l border-border pl-3">
          <div className="hidden text-right md:block">
            <p className="text-sm font-bold leading-tight text-navy">
              {user.fullName}
            </p>
            <p className="text-[11px] leading-tight text-ink-subtle">
              {user.role}
            </p>
          </div>
          <UserAvatar user={user} />
        </div>
      </div>
    </header>
  );
}

function UserAvatar({ user }: { user: Props["user"] }) {
  if (user.avatarUrl) {
    return (
      <div className="relative h-9 w-9 overflow-hidden rounded-full ring-2 ring-surface-mid">
        <Image
          src={user.avatarUrl}
          alt={user.fullName}
          fill
          sizes="36px"
          className="object-cover"
        />
      </div>
    );
  }
  return (
    <div className="grid h-9 w-9 place-items-center rounded-full bg-navy text-xs font-bold text-white ring-2 ring-surface-mid">
      {getInitials(user.fullName)}
    </div>
  );
}
