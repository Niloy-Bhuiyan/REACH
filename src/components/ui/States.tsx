import { cn } from "@/lib/utils/cn";
import { PixelIcon } from "./PixelIcon";

/** Skeletons sit at the real row geometry so nothing jumps when data lands. */
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div aria-hidden className={cn("skeleton", className)} style={style} />;
}

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
 * Empty states are where the pixel art earns its place: one piece of art, one
 * sentence naming what is missing, one action. Never a blank card, never a spinner.
 */
export function EmptyState({
  glyph,
  glyphSize = 64,
  title,
  body,
  children,
  className,
}: {
  glyph: string;
  glyphSize?: number;
  title: string;
  body?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 py-14 text-center", className)}>
      <PixelIcon name={glyph} size={glyphSize} className="opacity-90" />
      <h3 className="mt-1 text-section text-ink">{title}</h3>
      {body && <div className="max-w-[44ch] text-body text-ink-body">{body}</div>}
      {children && <div className="mt-3 flex flex-col items-center gap-2.5">{children}</div>}
    </div>
  );
}

/** An error names what happened and what is still true. It is quiet, not alarming. */
export function ErrorNotice({
  title,
  children,
  actions,
  glyph,
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
      className={cn("rounded-xl border border-terracotta-line bg-terracotta-tint p-4", className)}
    >
      <div className="flex gap-3">
        {glyph && <PixelIcon name={glyph} size={26} className="mt-0.5" />}
        <div className="min-w-0 flex-1">
          <p className="text-subhead text-terracotta-text">{title}</p>
          {children && <div className="mt-1 text-sm text-ink-body">{children}</div>}
          {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

/** Stale content stays visible and offers a re-check. It is never hidden. */
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
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      <span className="tnum font-mono text-meta text-apricot-text">{children}</span>
      {action}
    </div>
  );
}
