import { cn } from "@/lib/utils/cn";

export type ChipTone =
  | "neutral"
  | "violet"
  | "sage"
  | "apricot"
  | "terracotta"
  | "stone";

/**
 * A chip exists for a verdict or a state — something the eye must catch.
 * Ordinary metadata is plain text, so use `Meta` for that instead.
 *
 * Tints carry the meaning; borders are dropped, because a fill is already
 * a boundary.
 */
const TONES: Record<ChipTone, string> = {
  neutral: "bg-surface-sunken text-ink-body",
  stone: "bg-surface-sunken text-ink-muted",
  violet: "bg-violet-tint text-violet-text",
  sage: "bg-sage-tint text-sage-text",
  apricot: "bg-apricot-tint text-apricot-text",
  terracotta: "bg-terracotta-tint text-terracotta-text",
};

export function Chip({
  tone = "neutral",
  mono,
  className,
  children,
}: {
  tone?: ChipTone;
  mono?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-[3px] text-meta font-medium whitespace-nowrap",
        mono && "tnum font-mono",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Metadata as text. Separated by a middot, never boxed — this is what replaces
 * most of the chips.
 */
export function Meta({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={cn("text-sm text-ink-muted", className)}>{children}</span>;
}

/** Mono is for timestamps, counts and ids — data, not decoration. */
export function Mono({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("tnum font-mono text-meta text-ink-muted", className)}>{children}</span>
  );
}
