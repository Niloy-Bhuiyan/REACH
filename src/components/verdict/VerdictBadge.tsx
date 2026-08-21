import Link from "next/link";
import { PixelIcon } from "@/components/ui/PixelIcon";
import type { Verdict } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { VERDICT_LABEL, VERDICT_SHORT, VERDICT_TONE } from "@/lib/utils/verdict";

/** Always word + colour, never colour alone. */
export function VerdictBadge({
  verdict,
  size = "md",
  className,
}: {
  verdict: Verdict;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const tone = VERDICT_TONE[verdict];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-bold tracking-[.08em] uppercase",
        size === "sm" && "px-2 py-[3px] text-[11.5px]",
        size === "md" && "px-2.5 py-1 text-[12px]",
        size === "lg" && "px-3 py-1.5 text-[13px]",
        tone.tint,
        tone.line,
        tone.text,
        className,
      )}
    >
      {VERDICT_LABEL[verdict]}
    </span>
  );
}

/**
 * Mobile 3-up count strip. Colour + number + word with a 3px verdict rule.
 * Verdict counts are visible at every width — dropping them is forbidden.
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
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {items.map((verdict) => {
        const tone = VERDICT_TONE[verdict];
        return (
          <Link
            key={verdict}
            href={`/discover?verdict=${verdict}`}
            className={cn(
              "relative flex min-h-[72px] flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[12px] border bg-surface pt-[3px] transition-colors duration-100 hover:bg-row-hover",
              tone.line,
            )}
          >
            <span aria-hidden className={cn("absolute top-0 h-[3px] w-full", tone.rule)} />
            <span className={cn("tnum font-display text-[26px] leading-none font-extrabold", tone.text)}>
              {counts[verdict]}
            </span>
            <span className="px-1 text-center text-[12px] leading-tight font-semibold text-ink-body">
              {VERDICT_LABEL[verdict]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/** Desktop tabs carrying the verdict counts. */
export function VerdictTabItem({ verdict, count }: { verdict: Verdict; count: number }) {
  return (
    <>
      <PixelIcon name={verdict === "skip" ? "px-skip" : verdict === "apply-now" ? "px-apply" : "px-onefix"} size={18} />
      <span>{VERDICT_SHORT[verdict]}</span>
      <span className={cn("tnum font-bold", VERDICT_TONE[verdict].text)}>{count}</span>
    </>
  );
}
