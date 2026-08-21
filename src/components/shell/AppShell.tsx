"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { cn } from "@/lib/utils/cn";
import { isActive, NAV_ITEMS } from "./nav";
import { Notifications } from "./Notifications";

/* ── Status line ────────────────────────────────────────────────────────── */

/**
 * The right cluster on desktop is one status line, one bell, one avatar. Nothing else.
 * Pages set the line's text; the shell owns the slot.
 */
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
    <header className="sticky top-0 z-30 hidden h-[72px] border-b border-line bg-surface sm:block">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-6 md:px-10"
      >
        <div className="flex items-center gap-8 lg:gap-11">
          <Link href="/" className="flex items-center gap-2.5" aria-label="REACH — Focus">
            <PixelIcon name="px-logo" size={34} height={33} priority />
            <span className="font-display text-[24px] leading-none font-extrabold text-ink">
              REACH
            </span>
          </Link>

          <ul className="flex items-center gap-5 lg:gap-[30px]">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.match);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex h-[72px] items-center text-[15px] transition-colors duration-100",
                      active ? "font-bold text-ink" : "text-ink-body hover:text-ink",
                    )}
                  >
                    {item.label}
                    {active && (
                      <span
                        aria-hidden
                        className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-violet"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center gap-4">
          {status && (
            <span className="tnum hidden font-mono text-[12px] tracking-tight text-ink-muted md:inline">
              {status}
            </span>
          )}
          <Notifications />
          <Link
            href="/profile"
            aria-label="Your profile"
            className="flex h-[44px] w-[44px] items-center justify-center rounded-[10px] border border-violet-line bg-violet-tint font-display text-[14px] font-bold text-violet-text transition-colors duration-100 hover:bg-violet-line"
          >
            NM
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
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] sm:hidden"
    >
      <ul className="flex h-[58px] items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.match);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="relative flex h-full min-h-[44px] flex-col items-center justify-center gap-[3px]"
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 top-0 h-[3px] rounded-b-full bg-violet"
                  />
                )}
                <PixelIcon name={item.glyph} size={22} className={cn(!active && "opacity-70")} />
                <span
                  className={cn(
                    "max-w-full truncate px-1 text-[12px] leading-none",
                    active ? "font-bold text-violet-text" : "text-ink-muted",
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
        {/* Bottom-bar clearance so a sticky primary action is never covered. */}
        <main className="flex-1 pb-[calc(58px+env(safe-area-inset-bottom))] sm:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
    </StatusContext.Provider>
  );
}
