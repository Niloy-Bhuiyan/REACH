"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { cn } from "@/lib/utils/cn";
import { isActive, NAV_ITEMS } from "./nav";
import { Notifications } from "./Notifications";

/* ── Status line ────────────────────────────────────────────────────────── */

interface StatusValue {
  status: string | null;
  setStatus: (value: string | null) => void;
}

const StatusContext = createContext<StatusValue>({ status: null, setStatus: () => {} });

export const useStatusLine = () => useContext(StatusContext);

/** Pages declare their own status line; the shell renders it in the right cluster. */
export function useSetStatusLine(value: string | null) {
  const { setStatus } = useStatusLine();
  useEffect(() => {
    setStatus(value);
    return () => setStatus(null);
  }, [value, setStatus]);
}

/* ── Desktop top bar ────────────────────────────────────────────────────── */

function AppNav({ status }: { status: string | null }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 hidden h-16 border-b border-line bg-surface/85 backdrop-blur-md sm:block">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-full max-w-[1180px] items-center gap-8 px-5 sm:px-8 lg:px-10"
      >
        <Link
          href="/"
          className="flex min-h-[44px] items-center gap-2"
          aria-label="REACH — Focus"
        >
          <PixelIcon name="px-logo" size={22} height={21} priority />
          <span className="text-[17px] leading-none font-semibold tracking-[-0.02em] text-ink">
            REACH
          </span>
        </Link>

        <ul className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.match);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-[44px] items-center rounded-lg px-3 text-sm transition-colors duration-100",
                    active
                      ? "font-semibold text-ink"
                      : "font-medium text-ink-muted hover:bg-surface-sunken hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-1.5">
          {status && (
            <span className="tnum mr-1 hidden font-mono text-meta text-ink-muted lg:inline">
              {status}
            </span>
          )}
          <Notifications />
          <Link
            href="/profile"
            aria-label="Your profile"
            className="flex size-[44px] items-center justify-center"
          >
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-full bg-surface-sunken text-meta font-semibold text-ink-body transition-colors duration-100 hover:bg-group"
            >
              NM
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

/* ── Mobile bottom bar ──────────────────────────────────────────────────── */

function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
    >
      <ul className="flex h-[56px] items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.match);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="flex h-full min-h-[44px] flex-col items-center justify-center gap-1"
              >
                <PixelIcon
                  name={item.glyph}
                  size={20}
                  className={cn(!active && "opacity-45 grayscale")}
                />
                <span
                  className={cn(
                    "max-w-full truncate px-1 text-meta leading-none",
                    active ? "font-semibold text-ink" : "text-ink-muted",
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ── Shell ──────────────────────────────────────────────────────────────── */

export function AppShell({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<string | null>(null);
  const value = useMemo(() => ({ status, setStatus }), [status]);

  return (
    <StatusContext.Provider value={value}>
      <div className="flex min-h-dvh flex-col bg-canvas">
        <AppNav status={status} />
        <main className="flex-1 pb-[calc(56px+env(safe-area-inset-bottom))] sm:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
    </StatusContext.Provider>
  );
}
