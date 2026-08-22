"use client";

import Link from "next/link";
import { useState } from "react";
import { Drawer, Sheet, SheetGrip } from "@/components/ui/Overlay";
import { Meta, Mono } from "@/components/ui/Chip";
import { Eyebrow, Hairline } from "@/components/ui/Surface";
import type { OpportunityDelta as Delta } from "@/lib/api/types";
import { useCountUp, useInView, useIsMobile } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";
import { closingDate, daysUntil } from "@/lib/utils/time";
import { VERDICT_LABEL } from "@/lib/utils/verdict";

/**
 * Counted, never projected. The figure is stored against a completed run and
 * rendered here — it is never derived on the client, so the same number cannot
 * differ between two screens.
 *
 * It stays distinctive by being the only place two large numbers sit either side
 * of an arrow, not by adding chrome around them. The projected figure counts up
 * once on first reveal and never again.
 */
export function OpportunityDelta({
  delta,
  variant = "full",
  nowLabel = "reachable now",
  afterLabel = "after this fix",
  className,
}: {
  delta: Delta;
  variant?: "full" | "inline" | "strip";
  nowLabel?: string;
  afterLabel?: string;
  className?: string;
}) {
  const [ref, seen] = useInView<HTMLDivElement>();
  const after = useCountUp(delta.after, seen);
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const numbers = (
    <span className="tnum flex items-baseline gap-2.5">
      <span className="font-display text-[34px] leading-none text-ink-muted">
        {delta.now}
      </span>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="size-4 shrink-0 self-center text-ink-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 8h10M9 4l4 4-4 4" />
      </svg>
      <span className="font-display text-[34px] leading-none text-sage-text">
        {after}
      </span>
      <span className="text-body font-semibold text-sage-text">+{delta.gain}</span>
    </span>
  );

  if (variant === "strip") {
    return (
      <>
        <div ref={ref} className={cn("flex items-center gap-3", className)}>
          <div className="min-w-0 flex-1">
            <Eyebrow>Opportunity Delta</Eyebrow>
            <div className="mt-1">{numbers}</div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="min-h-[44px] shrink-0 text-sm font-medium text-brand-text hover:underline"
          >
            Inspect
          </button>
        </div>
        <DrillDown delta={delta} open={open} onClose={() => setOpen(false)} asSheet={isMobile} />
      </>
    );
  }

  if (variant === "inline") {
    return (
      <>
        <div ref={ref} className={cn("sm:border-l sm:border-line sm:pl-7", className)}>
          <Eyebrow>Opportunity Delta</Eyebrow>
          <div className="mt-2">{numbers}</div>
          <p className="mt-2 text-sm text-ink-muted">
            {nowLabel} → {afterLabel}
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-2 min-h-[36px] text-sm font-medium text-brand-text hover:underline"
          >
            Inspect the {delta.gain}
          </button>
        </div>
        <DrillDown delta={delta} open={open} onClose={() => setOpen(false)} asSheet={isMobile} />
      </>
    );
  }

  return (
    <>
      <div ref={ref} className={className}>
        <div className="flex items-baseline justify-between gap-3">
          <Eyebrow>Opportunity Delta</Eyebrow>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="min-h-[36px] text-sm font-medium text-brand-text hover:underline"
          >
            Inspect the {delta.gain}
          </button>
        </div>
        <div className="mt-3">{numbers}</div>
        <p className="mt-1.5 text-sm text-ink-muted">
          {nowLabel} → {afterLabel}
        </p>
        {/* Every number this size has its derivation on the same screen. */}
        <p className="mt-3 text-sm leading-relaxed text-ink-body">{delta.basis}</p>
      </div>

      <DrillDown delta={delta} open={open} onClose={() => setOpen(false)} asSheet={isMobile} />
    </>
  );
}

/** The audit: 54 verified, 12 already Apply Now, 8 blocked by this alone, 4 excluded. */
export function DeltaAudit({ delta, className }: { delta: Delta; className?: string }) {
  const rows = [
    { label: "Verified postings in today's run", value: delta.audit.verified },
    { label: "Already Apply Now", value: delta.audit.alreadyApplyNow },
    { label: "Blocked by this only", value: delta.audit.blockedByThisOnly, strong: true },
    {
      label: "Blocked by this + something else",
      value: `${delta.audit.blockedByThisPlusOther} · not counted`,
      muted: true,
    },
  ];

  return (
    <div className={className}>
      <Eyebrow>How this was counted</Eyebrow>
      <dl className="mt-2">
        {rows.map((row, i) => (
          <div key={row.label}>
            {i > 0 && <Hairline />}
            <div className="flex items-baseline justify-between gap-4 py-2">
              <dt className={cn("text-sm", row.muted ? "text-ink-muted" : "text-ink-body")}>
                {row.label}
              </dt>
              <dd
                className={cn(
                  "tnum font-mono text-meta whitespace-nowrap",
                  row.strong ? "font-semibold text-sage-text" : "text-ink",
                  row.muted && "text-ink-muted",
                )}
              >
                {row.value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
      {/* The exclusion is what makes the number trustworthy. */}
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        Only postings where this is the sole remaining requirement are counted. The{" "}
        {delta.audit.blockedByThisPlusOther} that need a second fix stay out of the number — you
        can see them under Roadmap.
      </p>
    </div>
  );
}

function DrillDown({
  delta,
  open,
  onClose,
  asSheet,
}: {
  delta: Delta;
  open: boolean;
  onClose: () => void;
  asSheet: boolean;
}) {
  const soon = delta.affected.filter((job) => daysUntil(job.closesAt) <= 10).length;

  const list = (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-start justify-between gap-3 px-6 pt-6 pb-4">
        <div>
          <h2 className="text-section text-ink">Where the +{delta.gain} comes from</h2>
          <p className="mt-0.5 text-sm text-ink-muted">
            {delta.affected.length} postings, looked up — not recalculated
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mt-1 -mr-2 flex size-[44px] items-center justify-center rounded-lg text-ink-muted hover:bg-surface-sunken"
        >
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        <DeltaAudit delta={delta} className="border-b border-line pb-5" />

        <ul className="mt-2">
          {delta.affected.map((job) => (
            <li key={job.jobId} className="border-b border-hairline last:border-b-0">
              <Link
                href={`/jobs/${job.jobId}`}
                onClick={onClose}
                className="-mx-2 block rounded-lg px-2 py-3 transition-colors duration-100 hover:bg-surface-sunken"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-subhead text-ink">{job.role}</span>
                  <span className="shrink-0 text-meta font-semibold text-sage-text">
                    → {VERDICT_LABEL[job.verdictAfter]}
                  </span>
                </div>
                <p className="mt-0.5">
                  <Meta>
                    {job.company} · {job.location} · {job.otherRequirements}
                  </Meta>
                </p>
                <p className="mt-1">
                  <Mono
                    className={daysUntil(job.closesAt) <= 10 ? "text-apricot-text" : undefined}
                  >
                    Closes {closingDate(job.closesAt)}
                  </Mono>
                </p>
              </Link>
            </li>
          ))}
        </ul>

        {soon > 0 && (
          <p className="mt-4 text-sm text-ink-body">
            {soon} of these close within 10 days — the roadmap puts them first.
          </p>
        )}
      </div>
    </div>
  );

  if (asSheet) {
    return (
      <Sheet open={open} onClose={onClose} label="Opportunity Delta audit" height="88%">
        <SheetGrip />
        {list}
      </Sheet>
    );
  }

  return (
    <Drawer open={open} onClose={onClose} label="Opportunity Delta audit">
      {list}
    </Drawer>
  );
}
