import { cn } from "@/lib/utils/cn";

/**
 * The word leads; the bar supports. A null value means unavailable and renders
 * an empty dashed track — a 0% bar would be a false statement.
 */
export function Meter({
  fill,
  tone = "brand",
  label,
  className,
  height = 5,
}: {
  fill: number | null;
  tone?: "brand" | "sage" | "apricot" | "neutral";
  label: string;
  className?: string;
  height?: number;
}) {
  const tones = {
    brand: "bg-brand",
    sage: "bg-sage",
    apricot: "bg-apricot",
    neutral: "bg-ink",
  } as const;

  return (
    <div
      role="meter"
      aria-valuetext={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={fill === null ? undefined : Math.round(fill * 100)}
      className={cn(
        "w-full overflow-hidden rounded-full",
        fill === null ? "border border-dashed border-group" : "bg-track",
        className,
      )}
      style={{ height }}
    >
      {fill !== null && (
        <div
          className={cn("h-full rounded-full transition-[width] duration-300", tones[tone])}
          style={{ width: `${Math.round(fill * 100)}%` }}
        />
      )}
    </div>
  );
}
