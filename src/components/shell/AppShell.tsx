"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Wordmark } from "@/components/ui/Brand";
import { Icon } from "@/components/ui/Icon";
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
    <header className="sticky top-0 z-30 hidden h-[72px] border-b border-line bg-canvas/85 backdrop-blur-md sm:block">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-full max-w-[1200px] items-center gap-10 px-5 sm:px-8 lg:px-10"
      >
        <Link
          href="/"
          className="flex min-h-[44px] items-center"
          aria-label="REACH — Focus"
        >
          <Wordmark size={26} />
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
                    "flex min-h-[44px] items-center rounded-full px-4 text-sm transition-colors duration-150",
                    active
                      ? "font-semibold text-ink"
                      : "font-medium text-ink-body hover:bg-surface-sunken hover:text-ink",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2">
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
              className="flex size-9 items-center justify-center rounded-full border border-line bg-surface text-meta font-semibold text-ink-body transition-colors duration-150 hover:bg-surface-sunken"
            >
              NM
            </span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

/* ── Mobile top bar ─────────────────────────────────────────────────────── */

/**
 * The phone keeps the mark and says where you are — the section name carries an
 * underline so the answer is available without reading the bottom bar.
 */
function MobileTopBar() {
  const pathname = usePathname();
  const current = NAV_ITEMS.find((item) => isActive(pathname, item.match));

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur-md sm:hidden">
      <Link href="/" className="flex min-h-[44px] items-center" aria-label="REACH — Focus">
        <Wordmark size={22} />
      </Link>
      {current && (
        <>
          <span aria-hidden className="h-5 w-px bg-line" />
          <span className="relative min-w-0 truncate pb-1 text-subhead font-medium text-brand-text">
            {current.label}
            <span
              aria-hidden
              className="absolute inset-x-0 -bottom-0.5 flex items-center justify-center"
            >
              <span className="h-[2px] w-full rounded-full bg-brand/35" />
              <span className="absolute size-[5px] rounded-full bg-brand" />
            </span>
          </span>
        </>
      )}
      <div className="ml-auto">
        <Notifications />
      </div>
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
      <ul className="flex h-[64px] items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.match);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="relative flex h-full min-h-[44px] flex-col items-center justify-center gap-1"
              >
                <Icon
                  name={item.icon}
                  size={21}
                  className={active ? "text-brand" : "text-ink-muted"}
                />
                <span
                  className={cn(
                    "max-w-full truncate px-1 text-meta leading-none",
                    active ? "font-semibold text-brand-text" : "text-ink-muted",
                  )}
                >
                  {item.label}
                </span>
                {active && (
                  <span
                    aria-hidden
                    className="absolute bottom-1 size-[4px] rounded-full bg-brand"
                  />
                )}
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
        <MobileTopBar />
        <main className="flex-1 pb-[calc(64px+env(safe-area-inset-bottom))] sm:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
    </StatusContext.Provider>
  );
}
