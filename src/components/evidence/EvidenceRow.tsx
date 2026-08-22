import Link from "next/link";
import { Meta, Mono } from "@/components/ui/Chip";
import { ConnectionState, SourceMark } from "./SourceMark";
import { Icon } from "@/components/ui/Icon";
import type { EvidenceSource, RequirementRow } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { GAP_LABEL } from "@/lib/utils/verdict";

/**
 * A requirement row is a claim and its receipt. Met rows are quiet; the one that
 * is missing is the only thing on the list that takes colour, because it is the
 * only thing the verdict rests on.
 */
export function EvidenceRow({
  row,
  preferred,
}: {
  row: RequirementRow;
  preferred?: boolean;
}) {
  const met = row.state === "met";
  // A typed gap is the One Fix Away item — amber. An untyped missing hard
  // requirement is a blocker, and blockers are terracotta.
  const isGap = !met && !!row.gapType;

  return (
    <li className="grid gap-x-6 gap-y-1 border-b border-hairline py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,17rem)]">
      <div className="flex min-w-0 items-baseline gap-2.5">
        <span
          aria-hidden
          className={cn(
            "mt-[3px]",
            met ? "text-sage" : isGap ? "text-apricot" : "text-terracotta",
          )}
        >
          {met ? (
            <Icon name="check" size={14} strokeWidth={2.2} />
          ) : (
            <Icon name="minus" size={14} strokeWidth={2.2} />
          )}
        </span>
        <div className="min-w-0">
          <p
            className={cn(
              "text-body",
              met
                ? "text-ink"
                : preferred
                  ? "text-ink-body"
                  : isGap
                    ? "font-medium text-apricot-text"
                    : "font-medium text-terracotta-text",
            )}
          >
            {row.label}
          </p>
          <p className="mt-0.5 text-sm text-ink-muted">{row.detail}</p>
        </div>
      </div>

      <div className="min-w-0 sm:text-right">
        {row.evidence && (
          <p className="text-sm text-ink-body">
            {row.evidence.text}{" "}
            {row.evidence.href ? (
              <Link href={row.evidence.href} className="font-medium text-sage-text hover:underline">
                {row.evidence.source}
              </Link>
            ) : (
              <span className="font-medium text-sage-text">{row.evidence.source}</span>
            )}
          </p>
        )}

        {row.missingNote && <Meta>{row.missingNote}</Meta>}

        {(row.gapType || row.effortHours || row.unlocksElsewhere) && (
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2 sm:justify-end">
            {row.gapType && (
              <span className="text-meta font-medium text-apricot-text">
                {GAP_LABEL[row.gapType]}
              </span>
            )}
            {row.effortHours && <Mono>~{row.effortHours} h to close</Mono>}
            {row.unlocksElsewhere && row.fixId && (
              <Link
                href={`/one-fix/${row.fixId}`}
                className="text-meta font-medium text-brand-text hover:underline"
              >
                Unlocks {row.unlocksElsewhere} other roles
              </Link>
            )}
          </p>
        )}
      </div>
    </li>
  );
}

/**
 * An evidence connection: its own mark, its name, the state as a word, and what
 * it contributes. These are the things REACH reasons from, so they are meant to
 * be recognised at a glance rather than tucked into settings.
 */
export function IntegrationRow({
  source,
  onAction,
  pending,
}: {
  source: EvidenceSource;
  onAction?: () => void;
  pending?: boolean;
}) {
  return (
    <div className="flex items-center gap-3.5 border-b border-hairline py-4 last:border-b-0">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-canvas-deep text-ink-body"
      >
        <SourceMark id={source.id} size={19} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-body font-medium text-ink">{source.name}</span>
          <ConnectionState state={source.state} label={source.stateLabel} />
        </p>
        <p className="mt-0.5 truncate text-sm text-ink-muted">{source.stateDetail}</p>
      </div>

      {onAction && (
        <button
          type="button"
          onClick={onAction}
          disabled={pending}
          className="min-h-[40px] shrink-0 rounded-full px-3 text-sm font-medium text-brand-text hover:underline disabled:text-ink-disabled"
        >
          {pending ? "Working…" : source.action}
        </button>
      )}
    </div>
  );
}
