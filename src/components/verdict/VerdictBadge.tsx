import Link from "next/link";
import type { Verdict } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { VERDICT_LABEL, VERDICT_TONE } from "@/lib/utils/verdict";

/**
 * A verdict is a word with a dot. The dot carries the colour, the word carries
 * the meaning — so it survives colour blindness and a greyscale print alike.
 */
export function VerdictBadge({
  verdict,
  size = "md",
  pill,
  className,
}: {
  verdict: Verdict;
  size?: "sm" | "md" | "lg";
  /** A tinted pill, for the one place on a screen where the verdict is the headline. */
  pill?: boolean;
  className?: string;
}) {
  const tone = VERDICT_TONE[verdict];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-semibold",
        size === "sm" && "text-meta",
        size === "md" && "text-sm",
        size === "lg" && "text-body",
        pill && cn("rounded-full px-4 py-[7px]", tone.tint),
        tone.text,
        className,
      )}
    >
      <span aria-hidden className={cn("size-[7px] shrink-0 rounded-full", tone.rule)} />
      {VERDICT_LABEL[verdict]}
    </span>
  );
}

/**
 * The mobile triage strip. Three numbers, three words, no boxes — the count is
 * the loudest thing on the row because it is the answer to "what do I have today".
 */
export function VerdictCountStrip({
  counts,
  className,
}: {
  counts: Record<Verdict, number>;
  className?: string;
}) {
  const items: Verdict[] = ["apply-now", "one-fix-away", "skip"];
  return (
    <div className={cn("grid grid-cols-3 divide-x divide-line", className)}>
      {items.map((verdict) => {
        const tone = VERDICT_TONE[verdict];
        return (
          <Link
            key={verdict}
            href={`/discover?verdict=${verdict}`}
            className="flex min-h-[64px] flex-col items-center justify-center gap-0.5 transition-colors duration-100 hover:bg-surface-sunken"
          >
            <span className={cn("tnum text-[26px] leading-none font-semibold", tone.text)}>
              {counts[verdict]}
            </span>
            <span className="text-meta text-ink-muted">{VERDICT_LABEL[verdict]}</span>
          </Link>
        );
      })}
    </div>
  );
}
