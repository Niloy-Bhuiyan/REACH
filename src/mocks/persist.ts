/**
 * The user's decisions survive a reload — saved jobs, accepted and rejected edits, milestone
 * progress, engine choice, privacy toggles, the target. Everything else is re-seeded, because
 * a run is a run.
 */

const KEY = "reach:mock-state";

export function readState<T extends object>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<T>) } : fallback;
  } catch {
    return fallback;
  }
}

export function writeState(state: object): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* private mode / quota — the session still works, it just forgets */
  }
}
