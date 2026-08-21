import {
  DELIST_RETENTION_HOURS,
  FRESHNESS_EXPIRED_HOURS,
  FRESHNESS_STALE_HOURS,
  SOURCE_STALE_DAYS,
} from "@/lib/api/contract";
import type { Freshness } from "@/lib/api/types";

/**
 * The only place a timestamp becomes a band or a phrase, so the data contract's rule 02 is
 * enforced in one function rather than at forty call sites.
 *
 * All timestamps are stored UTC and rendered in the user's local zone. Ages under an hour read in
 * minutes, under a day in hours, then in days — never a bare date, because the point of the stamp
 * is recency rather than history.
 */

export function hoursSince(iso: string, now = Date.now()): number {
  return (now - new Date(iso).getTime()) / 3_600_000;
}

/** ≤ 24 h fresh · 24–72 h stale · > 72 h expired (shown, but excluded from every count). */
export function freshness(iso: string, now = Date.now()): Freshness {
  const h = hoursSince(iso, now);
  if (h < FRESHNESS_STALE_HOURS) return "fresh";
  if (h < FRESHNESS_EXPIRED_HOURS) return "stale";
  return "expired";
}

/** "18 min" · "4 h" · "2 d". Never a bare date. */
export function age(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.round(hours / 24)} d`;
}

/** "verified 4 h ago" */
export function verifiedAgo(iso: string, now = Date.now()): string {
  return `verified ${age(iso, now)} ago`;
}

/** "4 h ago" */
export function ago(iso: string, now = Date.now()): string {
  const value = age(iso, now);
  return value === "just now" ? value : `${value} ago`;
}

/** "30 Aug" — used only for closing dates, where the calendar date is the point. */
export function closingDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  });
}

/** "9 days" until a deadline, floored at 0. */
export function daysUntil(iso: string, now = Date.now()): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 86_400_000));
}

/** Local wall clock for console events, in mono. */
export function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/** Rule 08 — evidence-source staleness is a different clock and never marks a posting stale. */
export function sourceIsStale(iso: string, now = Date.now()): boolean {
  return hoursSince(iso, now) > SOURCE_STALE_DAYS * 24;
}

/** Rule 03 — a delisted posting is retained this long, then dropped. */
export function delistExpired(iso: string, now = Date.now()): boolean {
  return hoursSince(iso, now) > DELIST_RETENTION_HOURS;
}
