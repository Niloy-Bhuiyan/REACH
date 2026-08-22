"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { Eyebrow } from "@/components/ui/Surface";
import type { DiscoveryRun } from "@/lib/api/types";
import { useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";
import { ago, clock } from "@/lib/utils/time";

/**
 * The only dark surface in REACH. Exists while a run is active, then collapses to a single
 * summary line. Mono face, observable events only — no chain-of-thought, no fake code, and
 * never on Focus.
 *
 * The region is aria-live polite; it is not read event by event.
 */
export function RunConsole({
  run,
  onStop,
  className,
  compact,
}: {
  run: DiscoveryRun;
  onStop: () => void;
  className?: string;
  compact?: boolean;
}) {
  const reduced = useReducedMotion();
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [run.events.length]);

  const queued = run.events.length;

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[14px] border border-group bg-console",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <PixelIcon name="g-scan" size={22} />
          <div>
            <p className="text-[15px] font-semibold text-console-text">Activity Console</p>
            <p className="tnum font-mono text-[11.5px] tracking-tight text-console-meta uppercase">
              Step {run.step} of {run.totalSteps} · elapsed{" "}
              {elapsed(run.startedAt)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onStop}
          className="min-h-[44px] rounded-[9px] border border-white/20 px-3.5 text-[13.5px] font-semibold text-console-text transition-colors duration-100 hover:bg-white/10 focus-visible:outline-console-accent"
        >
          Stop run
        </button>
      </header>

      <ol
        ref={listRef}
        aria-live="polite"
        aria-label="Discovery run activity"
        className={cn(
          "flex flex-col overflow-y-auto px-4 py-3",
          compact ? "max-h-[38vh]" : "max-h-[320px]",
        )}
      >
        <AnimatePresence initial={false}>
          {run.events.map((event) => (
            <motion.li
              key={event.id}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12 }}
              className="tnum grid grid-cols-[68px_1fr_auto] items-baseline gap-3 py-[5px] font-mono text-[12.5px]"
            >
              <span className="text-console-meta">{clock(event.at)}</span>
              <span className="text-console-text">{event.label}</span>
              <span className="text-console-ok">{event.detail}</span>
            </motion.li>
          ))}
        </AnimatePresence>

        {/* Queued steps are named, so the console shows what the system will do, not what it thinks. */}
        {QUEUED_LABELS.slice(queued, queued + 3).map((label) => (
          <li
            key={label}
            className="tnum grid grid-cols-[68px_1fr_auto] items-baseline gap-3 py-[5px] font-mono text-[12.5px] text-console-meta"
          >
            <span aria-hidden>—</span>
            <span>{label}</span>
            <span>queued</span>
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-3 border-t border-white/10 px-4 py-3">
        <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-white/12">
          <div
            className="h-full rounded-full bg-console-accent transition-[width] duration-[240ms] ease-linear"
            style={{ width: `${run.progress}%` }}
          />
        </div>
        <span className="tnum font-mono text-[12px] text-console-text">{run.progress}%</span>
      </div>
    </section>
  );
}

const QUEUED_LABELS = [
  "Loading your evidence record",
  "Searching opportunity index",
  "Checking company career pages",
  "Querying trusted sources",
  "Deduplicating",
  "Verifying listings",
  "Applying eligibility filters",
  "Matching candidate evidence",
  "Ranking opportunities",
  "Identifying blockers",
  "Calculating Opportunity Delta",
  "Preparing results",
  "Run complete",
];

function elapsed(startedAt: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * On completion the console collapses to one mono line — found, deduped, eligible, kept,
 * verified. That line is the only dark surface left on the screen.
 */
export function RunSummaryLine({
  run,
  onRerun,
  onOpenLog,
  className,
}: {
  run: DiscoveryRun;
  onRerun: () => void;
  onOpenLog: () => void;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const { counts } = run;

  return (
    <motion.div
      initial={reduced ? false : { height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn("overflow-hidden rounded-[12px] bg-console", className)}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
        <span className="tnum font-mono text-[12px] tracking-tight text-console-text uppercase">
          Run complete · {counts.found.toLocaleString()} found ·{" "}
          {counts.deduped.toLocaleString()} deduped · {counts.eligible} eligible · {counts.kept}{" "}
          kept · verified {ago(run.completedAt ?? run.startedAt)}
        </span>
        <span className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onOpenLog}
            className="min-h-[36px] rounded-md px-2.5 font-mono text-[12px] text-console-accent uppercase hover:bg-white/10 focus-visible:outline-console-accent"
          >
            Open log
          </button>
          <button
            type="button"
            onClick={onRerun}
            className="min-h-[36px] rounded-md border border-white/20 px-2.5 font-mono text-[12px] text-console-text uppercase hover:bg-white/10 focus-visible:outline-console-accent"
          >
            Re-run
          </button>
        </span>
      </div>
    </motion.div>
  );
}

/** The run stats block in the Discovery rail. */
/** `bare` drops the card chrome, for when the panel is already inside one. */
export function RunStats({
  run,
  bare,
  className,
}: {
  run: DiscoveryRun;
  bare?: boolean;
  className?: string;
}) {
  const rows = [
    { label: "Index results", value: run.counts.found.toLocaleString() },
    { label: "After dedupe", value: run.counts.deduped.toLocaleString() },
    { label: "Eligible for you", value: run.counts.eligible },
    { label: "Kept", value: run.counts.kept },
  ];

  return (
    <div
      className={`${bare ? "" : "rounded-[14px] border border-line bg-surface p-4"} ${className ?? ""}`}
    >
      {!bare && <Eyebrow>This run</Eyebrow>}
      <dl className={`flex flex-col gap-2 ${bare ? "" : "mt-2.5"}`}>
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4">
            <dt className="text-[13.5px] text-ink-body">{row.label}</dt>
            <dd className="tnum font-mono text-[13px] font-medium text-ink">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 border-t border-hairline pt-2.5 text-[12.5px] text-ink-muted">
        {run.scan.careersPages} career pages · {run.scan.trustedSources} trusted sources ·{" "}
        {run.scan.referralNetworks} referral network
      </p>
    </div>
  );
}
