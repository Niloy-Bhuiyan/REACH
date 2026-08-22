"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Mono } from "@/components/ui/Chip";
import { Eyebrow, Hairline } from "@/components/ui/Surface";
import type { DiscoveryRun } from "@/lib/api/types";
import { useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";
import { ago, clock } from "@/lib/utils/time";

/**
 * The console is the signature moment while a run is live — and only then.
 * It shows what the system did, never what it thought. The region is a single
 * polite live region; it is not read event by event.
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

  return (
    <section className={cn("overflow-hidden rounded-xl bg-console", className)}>
      <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex items-baseline gap-2.5">
          <span className="text-subhead text-console-text">Finding opportunities</span>
          <span className="tnum font-mono text-meta text-console-meta">
            step {run.step} of {run.totalSteps}
          </span>
        </div>
        <button
          type="button"
          onClick={onStop}
          className="min-h-[36px] rounded-lg px-2.5 text-sm font-medium text-console-meta transition-colors duration-100 hover:bg-white/10 hover:text-console-text focus-visible:outline-console-accent"
        >
          Stop
        </button>
      </header>

      <ol
        ref={listRef}
        aria-live="polite"
        aria-label="Discovery run activity"
        className={cn(
          "flex flex-col overflow-y-auto px-5 pb-1",
          compact ? "max-h-[34vh]" : "max-h-[212px]",
        )}
      >
        <AnimatePresence initial={false}>
          {run.events.map((event) => (
            <motion.li
              key={event.id}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.12 }}
              className="tnum grid grid-cols-[58px_1fr_auto] items-baseline gap-3 py-[5px] font-mono text-meta"
            >
              <span className="text-console-meta">{clock(event.at)}</span>
              <span className="text-console-text">{event.label}</span>
              <span className="text-console-ok">{event.detail}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>

      <div className="flex items-center gap-3 px-5 pt-2 pb-4">
        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-console-accent transition-[width] duration-[240ms] ease-linear"
            style={{ width: `${run.progress}%` }}
          />
        </div>
        <span className="tnum font-mono text-meta text-console-meta">{run.progress}%</span>
      </div>
    </section>
  );
}

/**
 * Once the run is done the console stops being the point. What remains is one
 * quiet line of provenance — no dark bar, no statistics competing with results.
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
  const { counts } = run;
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1.5", className)}>
      <Mono>
        {counts.kept} kept from {counts.found.toLocaleString()} · verified{" "}
        {ago(run.completedAt ?? run.startedAt)}
      </Mono>
      <button
        type="button"
        onClick={onOpenLog}
        className="text-sm font-medium text-violet-text hover:underline"
      >
        Run log
      </button>
      <button
        type="button"
        onClick={onRerun}
        className="text-sm font-medium text-violet-text hover:underline"
      >
        Re-run
      </button>
    </div>
  );
}

/**
 * The run's numbers, available on demand rather than occupying the rail.
 * Nothing here is what the user came for.
 */
export function RunStats({ run }: { run: DiscoveryRun }) {
  const rows = [
    { label: "Found in index", value: run.counts.found.toLocaleString() },
    { label: "After dedupe", value: run.counts.deduped.toLocaleString() },
    { label: "Eligible for you", value: run.counts.eligible },
    { label: "Kept", value: run.counts.kept },
  ];

  return (
    <div>
      <Eyebrow>This run</Eyebrow>
      <dl className="mt-1.5">
        {rows.map((row, i) => (
          <div key={row.label}>
            {i > 0 && <Hairline />}
            <div className="flex items-baseline justify-between gap-4 py-1.5">
              <dt className="text-sm text-ink-body">{row.label}</dt>
              <dd className="tnum font-mono text-meta text-ink">{row.value}</dd>
            </div>
          </div>
        ))}
      </dl>
      <p className="mt-2.5 text-sm text-ink-muted">
        Scanned {run.scan.careersPages} career pages, {run.scan.trustedSources} trusted sources and{" "}
        {run.scan.referralNetworks} referral network.
      </p>
    </div>
  );
}
