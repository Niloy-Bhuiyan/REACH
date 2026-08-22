"use client";

import { Button } from "@/components/ui/Button";
import { Meta, Mono } from "@/components/ui/Chip";
import { cn } from "@/lib/utils/cn";
import type { SuggestedEdit } from "@/lib/api/types";

/**
 * Four parts, always: before, after, why, evidence — then accept and reject.
 * An unsupported claim is visibly blocked rather than quietly written: Accept is
 * disabled, the reason is on the control, and the only way forward is proving it.
 */
export function DiffCard({
  edit,
  index,
  total,
  onAccept,
  onReject,
  pending,
  className,
}: {
  edit: SuggestedEdit;
  index: number;
  total: number;
  onAccept: () => void;
  onReject: () => void;
  pending: boolean;
  className?: string;
}) {
  const blocked = edit.state === "blocked" || edit.evidence === null;
  const settled = edit.state === "accepted" || edit.state === "rejected";

  return (
    <article
      className={cn(
        "border-b border-line py-6 last:border-b-0",
        settled && "opacity-70",
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="flex items-baseline gap-2">
          <Mono>
            {index} of {total}
          </Mono>
          <span className="text-sm text-ink-muted">
            {edit.section} · {edit.locator}
          </span>
        </p>
        {blocked && (
          <span className="text-meta font-medium text-terracotta-text">No supporting evidence</span>
        )}
      </div>

      {/* The change itself, on the reading surface it will land on. */}
      <div className="mt-3 overflow-hidden rounded-lg border border-surface-read-border bg-surface-read">
        <p className="border-b border-surface-read-border px-4 py-3 text-sm text-ink-muted line-through decoration-ink-disabled">
          {edit.before}
        </p>
        <p className={cn("px-4 py-3 text-body", blocked ? "text-terracotta-text" : "text-ink")}>
          {edit.after}
        </p>
      </div>

      <p className="mt-3 max-w-[62ch] text-sm text-ink-body">
        {blocked ? edit.blockedReason : edit.why}
      </p>

      {edit.evidence ? (
        <p className="mt-2 max-w-[62ch] text-sm text-sage-text">{edit.evidence.text}</p>
      ) : (
        <p className="mt-2 max-w-[62ch] text-sm text-ink-muted">
          We cannot support this from your CV, GitHub or portfolio.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {settled ? (
          <Meta>{edit.state === "accepted" ? "Accepted · applies on save" : "Rejected"}</Meta>
        ) : (
          <>
            <Button
              tone="sage"
              onClick={onAccept}
              disabled={blocked || pending}
              reason={
                blocked
                  ? "No source of yours supports this claim, so it cannot be accepted"
                  : undefined
              }
            >
              {blocked ? "Accept · disabled" : "Accept"}
            </Button>
            <Button variant="secondary" onClick={onReject} disabled={pending}>
              {blocked ? "Dismiss" : "Reject"}
            </Button>
            {blocked && (
              <a
                href="/profile"
                className="ml-auto min-h-[36px] content-center text-sm font-medium text-violet-text hover:underline"
              >
                Add the evidence
              </a>
            )}
          </>
        )}
      </div>
    </article>
  );
}
