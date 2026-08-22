import { cn } from "@/lib/utils/cn";

export type ChipTone =
  | "neutral"
  | "violet"
  | "sage"
  | "apricot"
  | "terracotta"
  | "stone";

const TONES: Record<ChipTone, string> = {
  neutral: "bg-canvas text-ink-body border-line",
  stone: "bg-canvas text-ink-muted border-group",
  violet: "bg-violet-tint text-violet-text border-violet-line",
  sage: "bg-sage-tint text-sage-text border-sage-line",
  apricot: "bg-apricot-tint text-apricot-text border-apricot-line",
  terracotta: "bg-terracotta-tint text-terracotta-text border-terracotta-line",
};

/**
 * A chip always carries a word. Colour is never the only cue, so a tone without a
 * readable label is a bug, not a style choice.
 */
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
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12.5px] leading-none font-semibold whitespace-nowrap",
        mono && "font-mono tnum text-[12px] tracking-tight",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Mono meta line — timestamps, counts, ids. 12px floor, tabular numerals. */
export function Mono({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "tnum font-mono text-[12px] tracking-tight text-ink-muted uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}
