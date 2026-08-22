"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Mono } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { Eyebrow, Hairline } from "@/components/ui/Surface";
import type { DiscoveryRun } from "@/lib/api/types";
import { useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";
import { ago } from "@/lib/utils/time";

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
    <section className={cn("overflow-hidden rounded-2xl bg-console", className)}>
      <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="relative flex size-2.5 items-center justify-center">
            <span className="absolute size-2.5 rounded-full bg-console-ok/30" />
            <span className="size-[6px] rounded-full bg-console-ok" />
          </span>
          <span className="text-subhead text-console-text">Finding opportunities</span>
          <span className="tnum font-mono text-meta text-console-meta">
            step {run.step} of {run.totalSteps}
          </span>
        </div>
        <button
          type="button"
          onClick={onStop}
          className="min-h-[38px] rounded-full px-4 text-sm font-medium text-console-meta transition-colors duration-150 hover:bg-white/10 hover:text-console-text focus-visible:outline-console-accent"
        >
          Stop
        </button>
      </header>

      <ol
        ref={listRef}
        aria-live="polite"
        aria-label="Discovery run activity"
        className={cn(
          "no-scrollbar flex flex-col overflow-y-auto px-5 pb-1",
          compact ? "max-h-[34vh]" : "max-h-[232px]",
        )}
      >
        <AnimatePresence initial={false}>
          {run.events.map((event) => (
            <motion.li
              key={event.id}
              initial={reduced ? { opacity: 1 } : { opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.14 }}
              className="grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-3 py-[7px]"
            >
              <Icon name="check" size={13} className="text-console-ok" strokeWidth={2.2} />
              <span className="min-w-0 truncate text-sm text-console-text">{event.label}</span>
              <span className="tnum font-mono text-meta text-console-accent">{event.detail}</span>
            </motion.li>
          ))}
        </AnimatePresence>

        {/* The stage now running. Named by its own event the moment it lands. */}
        <li className="grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-3 py-[7px]">
          <span aria-hidden className="flex size-4 items-center justify-center">
            <span className="size-[7px] animate-pulse rounded-full bg-console-meta" />
          </span>
          <span className="text-sm text-console-meta">Working…</span>
        </li>
      </ol>

      <div className="flex items-center gap-3 px-5 pt-2.5 pb-4">
        <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/12">
          <div
            className="h-full rounded-full bg-console-ok transition-[width] duration-[240ms] ease-linear"
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
        className="text-sm font-medium text-brand-text hover:underline"
      >
        Run log
      </button>
      <button
        type="button"
        onClick={onRerun}
        className="text-sm font-medium text-brand-text hover:underline"
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
