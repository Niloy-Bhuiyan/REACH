import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./Icon";

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
 * An empty state names what is missing and what to do about it: one quiet mark,
 * one sentence, one action. Never a blank card, never a spinner.
 */
export function EmptyState({
  icon = "target",
  title,
  body,
  children,
  className,
}: {
  icon?: IconName;
  title: string;
  body?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 py-14 text-center", className)}>
      <span
        aria-hidden
        className="flex size-14 items-center justify-center rounded-full bg-canvas-deep text-ink-muted"
      >
        <Icon name={icon} size={24} />
      </span>
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
  className,
}: {
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn("rounded-2xl border border-terracotta-line bg-terracotta-tint p-4", className)}
    >
      <div className="flex gap-3">
        <Icon name="alert" size={19} className="mt-0.5 text-terracotta" />
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
