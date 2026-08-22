import { cn } from "@/lib/utils/cn";
import { PixelIcon } from "./PixelIcon";

/**
 * Loading is a skeleton bar at the real row geometry, 1.2 s shimmer.
 * Runs use the Activity Console instead. Never a spinner for anything over a second.
 */
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div aria-hidden className={cn("skeleton", className)} style={style} />;
}

/** Skeleton rows at the geometry of the list they replace. */
export function SkeletonRows({
  rows = 3,
  height = 56,
  className,
}: {
  rows?: number;
  height?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)} aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} style={{ height }} />
      ))}
    </div>
  );
}

/**
 * Empty state: a scenery vignette, one sentence naming what is missing, and exactly one
 * action. Never a blank card, never a spinner. Where the state has a cause, it is named
 * and quantified — "Posted under 3 days removes 51 of them" — never a shrug.
 */
export function EmptyState({
  glyph,
  glyphSize = 72,
  title,
  body,
  children,
  className,
}: {
  glyph: string;
  glyphSize?: number;
  title: string;
  body?: React.ReactNode;
  /** Exactly one primary action, plus at most one quiet alternative. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-[14px] border border-line bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      <PixelIcon name={glyph} size={glyphSize} />
      <h3 className="font-display text-[22px] leading-tight font-bold text-ink">{title}</h3>
      {body && (
        <div className="max-w-[46ch] text-[14.5px] leading-relaxed text-ink-body">{body}</div>
      )}
      {children && <div className="mt-2 flex flex-col items-center gap-2">{children}</div>}
    </div>
  );
}

/**
 * Error: 2px terracotta border, terracotta tint, a 13px message with a word.
 * Never a red border alone.
 */
export function ErrorNotice({
  title,
  children,
  actions,
  glyph = "g-failed",
  className,
}: {
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  glyph?: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex gap-3.5 rounded-[14px] border-2 border-terracotta-line bg-terracotta-tint p-4",
        className,
      )}
    >
      <PixelIcon name={glyph} size={32} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-terracotta-text">{title}</p>
        {children && (
          <div className="mt-1 text-[13px] leading-relaxed text-ink-body">{children}</div>
        )}
        {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/**
 * Stale: an apricot chip plus a Re-verify action. Content stays visible —
 * it is never silently hidden.
 */
export function StaleNotice({
  children,
  action,
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2.5 rounded-[10px] border border-apricot-line bg-apricot-tint px-3 py-2",
        className,
      )}
    >
      <PixelIcon name="g-stale" size={20} />
      <span className="tnum font-mono text-[12px] tracking-tight text-apricot-text uppercase">
        {children}
      </span>
      {action}
    </div>
  );
}
