import { cn } from "@/lib/utils/cn";

export type ChipTone =
  | "neutral"
  | "brand"
  | "sage"
  | "apricot"
  | "terracotta"
  | "stone";

/**
 * A chip exists for a verdict or a state — something the eye must catch.
 * Ordinary metadata is plain text, so use `Meta` for that instead.
 *
 * Pills, tinted, no border: a fill is already a boundary, and a rounded fill on
 * warm paper reads as a label rather than a box.
 */
const TONES: Record<ChipTone, string> = {
  neutral: "bg-surface-sunken text-ink-body",
  stone: "bg-surface-sunken text-ink-muted",
  brand: "bg-brand-tint text-brand-text",
  sage: "bg-sage-tint text-sage-text",
  apricot: "bg-apricot-tint text-apricot-text",
  terracotta: "bg-terracotta-tint text-terracotta-text",
};

export function Chip({
  tone = "neutral",
  mono,
  size = "sm",
  className,
  children,
}: {
  tone?: ChipTone;
  mono?: boolean;
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        size === "sm" ? "px-2.5 py-[3px] text-meta" : "px-3.5 py-[7px] text-sm",
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
