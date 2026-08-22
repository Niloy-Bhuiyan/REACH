"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/* ── Media queries ──────────────────────────────────────────────────────── */

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  // The viewport is an external store, so read it with the API meant for one:
  // no effect, no cascading render, and the server snapshot keeps hydration honest.
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** The 768 boundary: bottom nav appears, top nav disappears, detail becomes a sheet. */
export const useIsMobile = () => useMediaQuery("(max-width: 767px)");
export const useIsTablet = () => useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

/**
 * Reduced motion: count-ups resolve instantly, slides become fades, the console renders as a
 * static list. Nothing else changes.
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/* ── Local persistence ──────────────────────────────────────────────────── */

const PREFIX = "reach:";

export function readPersisted<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writePersisted<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* private mode / quota — the app still works, it just forgets */
  }
}

/**
 * State that survives a reload. Hydrates after mount so server and client markup match.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage after mount is exactly the external-read an effect exists for
    setValue(readPersisted(key, initial));
    setHydrated(true);
    // `initial` is a seed, not a dependency — re-reading on every render would fight the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        writePersisted(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, update, hydrated] as const;
}

/* ── Count-up ───────────────────────────────────────────────────────────── */

/**
 * The projected Delta number counts up once, 240 ms, when it first enters view.
 * Never loops, never re-runs on scroll, and resolves instantly under reduced motion.
 */
export function useCountUp(target: number, enabled = true, duration = 240) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(enabled && !reduced ? 0 : target);
  const ran = useRef(false);

  useEffect(() => {
    if (!enabled || ran.current) return;
    ran.current = true;
    if (reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced motion resolves the count instantly
      setValue(target);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, enabled, reduced, duration]);

  return value;
}

/** Fires once when the element first scrolls into view. */
export function useInView<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen]);

  return [ref, seen] as const;
}

/* ── Overlays ───────────────────────────────────────────────────────────── */

/**
 * Drawers and sheets trap focus and restore it to the trigger on close.
 * Esc closes any overlay.
 */
export function useFocusTrap(active: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    restoreTo.current = document.activeElement as HTMLElement | null;

    const node = ref.current;
    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    focusables()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      restoreTo.current?.focus?.();
    };
  }, [active, onClose]);

  return ref;
}

/** Cmd-K / Ctrl-K opens the assistant scoped to the current object. */
export function useKeyboardShortcut(key: string, handler: () => void, meta = true) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const hasMeta = event.metaKey || event.ctrlKey;
      if (event.key.toLowerCase() === key && (!meta || hasMeta)) {
        event.preventDefault();
        handler();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [key, handler, meta]);
}

/** Prevents the page behind an overlay from scrolling, without a layout shift. */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const { overflow, paddingRight } = document.body.style;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [active]);
}
