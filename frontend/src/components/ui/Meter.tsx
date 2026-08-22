import { cn } from "@/lib/utils/cn";

/**
 * Track #EDEAF7. Fills use the family button tone, never the light accent, so the
 * indicator clears 3:1. The word leads; the bar supports.
 *
 * `value: null` means unavailable — a dashed surface with an empty track and the words
 * "Not yet measured". A 0% bar would be a false statement.
 */
export function Meter({
  fill,
  tone = "violet",
  label,
  className,
  height = 8,
}: {
  /** 0–1. Ignored when `label` marks the reading unavailable. */
  fill: number | null;
  tone?: "violet" | "sage" | "apricot";
  /** Announced instead of a number — the word is the meaning. */
  label: string;
  className?: string;
  height?: number;
}) {
  const tones = {
    violet: "bg-violet",
    sage: "bg-sage",
    apricot: "bg-apricot",
  } as const;

  return (
    <div
      role="meter"
      aria-valuetext={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={fill === null ? undefined : Math.round(fill * 100)}
      className={cn(
        "w-full overflow-hidden rounded-full bg-track",
        fill === null && "border border-dashed border-group bg-transparent",
        className,
      )}
      style={{ height }}
    >
      {fill !== null && (
        <div
          className={cn("h-full rounded-full transition-[width] duration-[320ms]", tones[tone])}
          style={{ width: `${Math.round(fill * 100)}%` }}
        />
      )}
    </div>
  );
}
