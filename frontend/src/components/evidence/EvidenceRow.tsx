import Link from "next/link";
import { GapTypeBadge } from "@/components/gap/GapTypeBadge";
import { Chip } from "@/components/ui/Chip";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { SourceGlyph } from "./Marks";
import type { EvidenceSource, RequirementRow } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

/**
 * Every requirement row carries its evidence and the source it came from, so the verdict is
 * auditable line by line. Nothing is inferred.
 *
 * Missing items are separated by consequence: a missing hard requirement drives the verdict
 * (terracotta); a missing preferred item is an optional gain (stone).
 */
export function EvidenceRow({
  row,
  preferred,
}: {
  row: RequirementRow;
  preferred?: boolean;
}) {
  const met = row.state === "met";
  // A typed gap is the One Fix Away item — apricot. An untyped missing hard requirement is a
  // blocker, and blockers are terracotta.
  const isGap = !met && !!row.gapType;
  const glyph = met ? "g-req-met" : preferred || isGap ? "g-noevidence" : "g-req-missing";

  return (
    <li
      className={cn(
        "grid gap-x-4 gap-y-1.5 border-t border-hairline px-3 py-3 first:border-t-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]",
        row.state === "missing" && !preferred && (isGap ? "bg-apricot-tint/60" : "bg-terracotta-tint/50"),
      )}
    >
      <div className="flex min-w-0 gap-2.5">
        <PixelIcon name={glyph} size={18} className="mt-[3px]" />
        <div className="min-w-0">
          <p
            className={cn(
              "text-[14.5px] leading-snug font-semibold",
              met ? "text-ink" : preferred ? "text-ink-body" : isGap ? "text-apricot-text" : "text-terracotta-text",
            )}
          >
            {row.label}
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-ink-muted">{row.detail}</p>
        </div>
      </div>

      <div className="min-w-0 sm:pl-0">
        {row.evidence && (
          <p className="flex flex-wrap items-center gap-1.5 text-[13px] leading-snug text-ink-body">
            <span>{row.evidence.text}</span>
            {row.evidence.href ? (
              <Link
                href={row.evidence.href}
                className="rounded-md border border-sage-line bg-sage-tint px-1.5 py-0.5 text-[12px] font-semibold text-sage-text hover:underline"
              >
                {row.evidence.source} ↗
              </Link>
            ) : (
              <span className="rounded-md border border-sage-line bg-sage-tint px-1.5 py-0.5 text-[12px] font-semibold text-sage-text">
                {row.evidence.source}
              </span>
            )}
          </p>
        )}

        {row.missingNote && (
          <p className="text-[13px] leading-snug text-ink-muted">{row.missingNote}</p>
        )}

        {(row.gapType || row.effortHours || row.unlocksElsewhere) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {row.gapType && <GapTypeBadge gap={row.gapType} />}
            {row.effortHours && <Chip tone="stone" mono>{`~${row.effortHours} h to close`}</Chip>}
            {row.unlocksElsewhere && row.fixId && (
              <Link
                href={`/one-fix/${row.fixId}`}
                className="text-[13px] font-semibold text-apricot-text hover:underline"
              >
                Closing this unlocks {row.unlocksElsewhere} other roles →
              </Link>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * Four real connection states — connected/syncing (sage), needs attention (apricot + reason +
 * Reconnect), not connected (stone, effect stated), missing-and-costing (violet, because it is
 * the product's ask).
 */
const SOURCE_TONE = {
  connected: { dot: "bg-sage", text: "text-sage-text", border: "border-line" },
  syncing: { dot: "bg-sage", text: "text-sage-text", border: "border-line" },
  attention: {
    dot: "bg-apricot",
    text: "text-apricot-text",
    border: "border-apricot-line bg-apricot-tint",
  },
  "not-connected": { dot: "bg-ink-disabled", text: "text-ink-muted", border: "border-line" },
  "missing-costly": {
    dot: "bg-violet",
    text: "text-violet-text",
    border: "border-violet-line bg-violet-tint",
  },
} as const;

export function IntegrationRow({
  source,
  onAction,
  pending,
  compact,
}: {
  source: EvidenceSource;
  onAction?: () => void;
  pending?: boolean;
  compact?: boolean;
}) {
  const tone = SOURCE_TONE[source.state];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[12px] border px-3.5 py-3",
        tone.border,
        !tone.border.includes("bg-") && "bg-surface",
      )}
    >
      <SourceGlyph
        id={source.id}
        icon={source.icon}
        name={source.name}
        size={compact ? 22 : 26}
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
          {source.name}
          <span aria-hidden className={cn("h-[7px] w-[7px] shrink-0 rounded-full", tone.dot)} />
        </p>
        <p className={cn("truncate text-[12.5px]", tone.text)}>{source.stateDetail}</p>
      </div>
      {onAction && (
        <button
          type="button"
          onClick={onAction}
          disabled={pending}
          className="min-h-[44px] shrink-0 px-1 text-[13.5px] font-semibold text-violet-text hover:underline disabled:text-ink-disabled"
        >
          {pending ? "Working…" : source.action}
        </button>
      )}
    </div>
  );
}
