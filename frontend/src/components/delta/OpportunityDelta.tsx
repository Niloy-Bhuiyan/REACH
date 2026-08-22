"use client";

import Link from "next/link";
import { useState } from "react";
import { Drawer, Sheet, SheetGrip } from "@/components/ui/Overlay";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { Eyebrow, Hairline } from "@/components/ui/Surface";
import type { OpportunityDelta as Delta } from "@/lib/api/types";
import { useCountUp, useInView, useIsMobile } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";
import { closingDate, daysUntil } from "@/lib/utils/time";
import { VERDICT_LABEL } from "@/lib/utils/verdict";

/**
 * Five required parts: current set, projected set, delta badge, plain-language basis,
 * drill-down. Counted, never projected — the number is stored against a completed run and
 * rendered, never derived here.
 *
 * The projected number counts up once on first reveal, 240 ms, in tabular numerals so the
 * width never jumps. It never loops and never re-runs on scroll.
 */
export function OpportunityDelta({
  delta,
  variant = "full",
  nowLabel = "reachable now",
  afterLabel = "after this fix",
  eyebrow = "Opportunity Delta",
  className,
}: {
  delta: Delta;
  variant?: "full" | "strip";
  nowLabel?: string;
  afterLabel?: string;
  eyebrow?: string;
  className?: string;
}) {
  const [ref, seen] = useInView<HTMLDivElement>();
  const after = useCountUp(delta.after, seen);
  const [drillOpen, setDrillOpen] = useState(false);
  const isMobile = useIsMobile();

  if (variant === "strip") {
    return (
      <>
        <div
          ref={ref}
          className={cn(
            "flex items-center gap-3 rounded-[12px] border border-group bg-canvas px-3.5 py-3",
            className,
          )}
        >
          <PixelIcon name="g-delta" size={22} />
          <div className="min-w-0 flex-1">
            <Eyebrow>{eyebrow}</Eyebrow>
            <p className="tnum mt-0.5 flex items-baseline gap-1.5 font-display text-[19px] leading-none font-extrabold text-ink">
              {delta.now}
              <span aria-hidden className="text-ink-muted">
                →
              </span>
              {after}
              <span className="ml-1 rounded-md border border-sage-line bg-sage-tint px-1.5 py-0.5 text-[13px] text-sage-text">
                +{delta.gain}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDrillOpen(true)}
            className="min-h-[44px] shrink-0 px-2 text-[13.5px] font-semibold text-violet-text hover:underline"
          >
            Inspect
          </button>
        </div>
        <DrillDown
          delta={delta}
          open={drillOpen}
          onClose={() => setDrillOpen(false)}
          asSheet={isMobile}
        />
      </>
    );
  }

  return (
    <>
      <div
        ref={ref}
        className={cn(
          "rounded-[14px] border border-group bg-surface p-5 shadow-tier2",
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <PixelIcon name="g-delta" size={24} />
            <Eyebrow>{eyebrow}</Eyebrow>
          </div>
          <button
            type="button"
            onClick={() => setDrillOpen(true)}
            className="min-h-[44px] text-[13.5px] font-semibold text-violet-text hover:underline"
          >
            Inspect the {delta.gain}
          </button>
        </div>

        <div className="mt-4 flex items-end gap-4">
          <div>
            <p className="tnum font-display text-[40px] leading-none font-extrabold text-ink">
              {delta.now}
            </p>
            <p className="mt-1 text-[13px] text-ink-muted">{nowLabel}</p>
          </div>
          <span aria-hidden className="pb-5 text-[22px] text-ink-placeholder">
            →
          </span>
          <div>
            <p className="tnum font-display text-[40px] leading-none font-extrabold text-sage-text">
              {after}
            </p>
            <p className="mt-1 text-[13px] text-ink-muted">{afterLabel}</p>
          </div>
          <span className="tnum mb-5 ml-auto rounded-lg border border-sage-line bg-sage-tint px-2.5 py-1 font-display text-[19px] font-extrabold text-sage-text">
            +{delta.gain}
          </span>
        </div>

        {/* Every number over 24px has an inspectable derivation on the same screen. */}
        <p className="mt-3 text-[13px] leading-relaxed text-ink-body">{delta.basis}</p>
      </div>

      <DrillDown
        delta={delta}
        open={drillOpen}
        onClose={() => setDrillOpen(false)}
        asSheet={isMobile}
      />
    </>
  );
}

/** The audit table — 54 verified, 12 already Apply Now, 8 blocked by this alone, 4 excluded. */
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
    <div className={cn("rounded-[14px] border border-line bg-surface p-4", className)}>
      <Eyebrow>How this was counted</Eyebrow>
      <dl className="mt-2.5 flex flex-col">
        {rows.map((row, i) => (
          <div key={row.label}>
            {i > 0 && <Hairline />}
            <div className="flex items-center justify-between gap-4 py-2.5">
              <dt
                className={cn(
                  "text-[13.5px]",
                  row.muted ? "text-ink-muted" : "text-ink-body",
                )}
              >
                {row.label}
              </dt>
              <dd
                className={cn(
                  "tnum font-mono text-[13px] whitespace-nowrap",
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
      {/* The exclusion is stated — that is what makes the number trustworthy. */}
      <p className="mt-2 border-t border-hairline pt-2.5 text-[13px] leading-relaxed text-ink-body">
        Only postings where this is the sole remaining requirement are counted. The{" "}
        {delta.audit.blockedByThisPlusOther} that need a second fix stay out of the number — you
        can see them under Roadmap.
      </p>
    </div>
  );
}

/** The drill-down is a lookup of stored posting ids, not a reconstruction. */
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
      <header className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
        <div>
          <Eyebrow>Where the +{delta.gain} comes from</Eyebrow>
          <p className="mt-0.5 font-display text-[19px] font-bold text-ink">
            {delta.affected.length} affected postings
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-[44px] w-[44px] items-center justify-center rounded-[9px] text-ink-body hover:bg-row-hover"
        >
          ✕
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <DeltaAudit delta={delta} />

        <ul className="mt-4 flex flex-col gap-2">
          {delta.affected.map((job) => (
            <li key={job.jobId}>
              <Link
                href={`/jobs/${job.jobId}`}
                onClick={onClose}
                className="block rounded-[12px] border border-line bg-surface p-3.5 transition-colors duration-100 hover:bg-row-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[14.5px] font-semibold text-ink-link">{job.role}</span>
                  <span className="shrink-0 rounded-md border border-sage-line bg-sage-tint px-2 py-0.5 text-[12px] font-bold text-sage-text">
                    → {VERDICT_LABEL[job.verdictAfter]}
                  </span>
                </div>
                <p className="mt-0.5 text-[13px] text-ink-body">
                  {job.company} · {job.location} · {job.otherRequirements}
                </p>
                <p className="tnum mt-1.5 font-mono text-[11.5px] tracking-tight text-ink-muted uppercase">
                  {job.source.replace("-", " ")} · closes {closingDate(job.closesAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        {soon > 0 && (
          <p className="mt-3 text-[13px] text-ink-body">
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
