import { Icon } from "@/components/ui/Icon";
import type { GapType } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { GAP_DIAGNOSIS, GAP_ICON, GAP_LABEL } from "@/lib/utils/verdict";

/** Each gap type has its own glyph and a one-line diagnosis. */
export function GapTypeBadge({
  gap,
  size = "sm",
  className,
}: {
  gap: GapType;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-apricot-line bg-apricot-tint font-semibold text-apricot-text",
        size === "sm" ? "px-2 py-[3px] text-[12px]" : "px-2.5 py-1 text-[13px]",
        className,
      )}
    >
      <Icon name={GAP_ICON[gap]} size={size === "sm" ? 13 : 16} />
      {GAP_LABEL[gap]}
    </span>
  );
}

/**
 * All three types are shown, not just yours — the user's highlighted, the others explicitly
 * ruled out, so the classification is legible rather than asserted.
 */
export function GapTypeRow({
  verdicts,
  className,
}: {
  verdicts: Record<GapType, { verdict: string; ruled: "yours" | "out" | "partly" }>;
  className?: string;
}) {
  const order: GapType[] = ["knowledge", "proof", "signal"];
  return (
    <div className={cn("grid gap-3 sm:grid-cols-3", className)}>
      {order.map((gap) => {
        const entry = verdicts[gap];
        const mine = entry.ruled === "yours";
        return (
          <div
            key={gap}
            className={cn(
              "flex flex-col gap-2 rounded-2xl border p-4",
              mine
                ? "border-apricot-line bg-apricot-tint"
                : "border-line bg-surface",
            )}
          >
            <div className="flex items-center gap-2.5">
              <Icon name={GAP_ICON[gap]} size={20} className={cn(!mine && "opacity-65")} />
              <span
                className={cn(
                  "font-display text-[17px] font-bold",
                  mine ? "text-apricot-text" : "text-ink",
                )}
              >
                {GAP_LABEL[gap]}
              </span>
            </div>
            <p className="text-[13.5px] leading-snug text-ink-body">{GAP_DIAGNOSIS[gap]}</p>
            <p
              className={cn(
                "mt-auto pt-1 text-[13px] font-semibold",
                mine ? "text-apricot-text" : "text-ink-muted",
              )}
            >
              {entry.verdict}
            </p>
          </div>
        );
      })}
    </div>
  );
}
