"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Chip, Mono } from "@/components/ui/Chip";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { Eyebrow } from "@/components/ui/Surface";
import type { SuggestedEdit } from "@/lib/api/types";
import { useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";

/**
 * Four parts, always: before, after, why, evidence — then accept and reject.
 * Unsupported claims are visibly blocked rather than quietly written: the Accept control is
 * disabled until evidence exists, and the reason is stated on the card.
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
  const reduced = useReducedMotion();
  const blocked = edit.state === "blocked" || edit.evidence === null;
  const settled = edit.state === "accepted" || edit.state === "rejected";

  return (
    <motion.article
      layout={reduced ? false : "position"}
      transition={{ duration: 0.16, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn(
        "rounded-[14px] border p-4",
        blocked
          ? "border-terracotta-line bg-terracotta-tint"
          : edit.state === "accepted"
            ? "border-sage-line bg-sage-tint"
            : "border-line bg-surface",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {blocked ? (
          <>
            <Eyebrow tone="terracotta">Edit {index} · blocked</Eyebrow>
            <Chip tone="terracotta">
              <PixelIcon name="g-noevidence" size={13} />
              No supporting evidence
            </Chip>
          </>
        ) : (
          <>
            <Eyebrow>
              Suggested edit {index} of {total}
            </Eyebrow>
            <Chip tone="stone">{edit.kind}</Chip>
          </>
        )}
        <Mono className="ml-auto">
          {edit.section} · {edit.locator}
        </Mono>
      </div>

      {/* Diffs render on the reading surface. */}
      <div className="mt-3 overflow-hidden rounded-[10px] border border-surface-read-border bg-surface-read">
        <div className="border-b border-surface-read-border px-3.5 py-2.5">
          <Eyebrow>Before</Eyebrow>
          <p className="mt-1 text-[13.5px] leading-relaxed text-ink-muted line-through decoration-terracotta/40">
            {edit.before}
          </p>
        </div>
        <div className="px-3.5 py-2.5">
          <Eyebrow tone={blocked ? "terracotta" : "sage"}>After</Eyebrow>
          <p
            className={cn(
              "mt-1 text-[13.5px] leading-relaxed",
              blocked ? "text-terracotta-text" : "text-ink",
            )}
          >
            {edit.after}
          </p>
        </div>
      </div>

      <p className="mt-2.5 text-[13px] leading-relaxed text-ink-body">
        <span className="font-semibold text-ink">Why:</span> {blocked ? edit.blockedReason : edit.why}
      </p>

      {edit.evidence ? (
        <p className="mt-2 flex items-start gap-2 rounded-[10px] border border-sage-line bg-sage-tint px-3 py-2 text-[13px] leading-snug text-ink-body">
          <PixelIcon name={edit.evidence.icon} size={18} className="mt-[1px]" />
          <span>
            <span className="font-semibold text-sage-text">Supporting evidence:</span>{" "}
            {edit.evidence.text}
          </span>
        </p>
      ) : (
        <p className="mt-2 flex items-start gap-2 text-[13px] leading-snug text-terracotta-text">
          <PixelIcon name="g-noevidence" size={18} className="mt-[1px]" />
          We cannot support this claim from your CV, GitHub or portfolio.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {settled ? (
          <Chip tone={edit.state === "accepted" ? "sage" : "stone"}>
            {edit.state === "accepted" ? "Accepted · applies on save" : "Rejected"}
          </Chip>
        ) : (
          <>
            <Button
              tone="sage"
              size="md"
              onClick={onAccept}
              disabled={blocked || pending}
              reason={
                blocked
                  ? "No source of yours supports this claim, so it cannot be accepted"
                  : undefined
              }
              className="min-w-[104px]"
            >
              {blocked ? "Accept · disabled" : "Accept"}
            </Button>
            <Button variant="secondary" size="md" onClick={onReject} disabled={pending}>
              {blocked ? "Dismiss" : "Reject"}
            </Button>
          </>
        )}
        {blocked && (
          <a
            href="/profile"
            className="ml-auto min-h-[44px] content-center text-[13px] font-semibold text-violet-text hover:underline"
          >
            Add the evidence to your profile →
          </a>
        )}
      </div>
    </motion.article>
  );
}
