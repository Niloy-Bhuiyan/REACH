"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Chip, Meta, Mono } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { saveJob } from "@/lib/api";
import type { JobSummary } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { closingDate, daysUntil, freshness, verifiedAgo } from "@/lib/utils/time";
import { GAP_LABEL, VERDICT_LABEL, VERDICT_TONE } from "@/lib/utils/verdict";

/** "Remote · BD" already says the mode; do not say it twice. */
function placeLine(job: JobSummary) {
  const parts = [job.location];
  if (!job.location.toLowerCase().includes(job.mode.toLowerCase())) parts.push(job.mode);
  return parts.join(" · ");
}

const SOURCE_SHORT = {
  "careers-page": "Careers page",
  "job-board": "Job board",
  referral: "Referral",
} as const;

/**
 * A company tile, lettered until real logos exist. Warm and neutral on purpose:
 * the verdict already has a colour, and a coloured tile would say it twice.
 */
export function CompanyTile({ name, size = 46 }: { name: string; size?: number }) {
  return (
    <span
      aria-hidden
      className="font-display flex shrink-0 items-center justify-center rounded-xl bg-canvas-deep text-ink-body"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/**
 * Freshness is mono and muted until it matters. Stale content stays on screen
 * and offers a re-check; it is never hidden.
 */
export function FreshnessStamp({
  iso,
  onReverify,
  delisted,
  className,
}: {
  iso: string;
  onReverify?: () => void;
  delisted?: boolean;
  className?: string;
}) {
  if (delisted) {
    return (
      <span className={cn("tnum font-mono text-meta text-apricot-text", className)}>
        No longer listed · not counted
      </span>
    );
  }
  const band = freshness(iso);
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-1.5", className)}>
      <span
        className={cn(
          "tnum font-mono text-meta whitespace-nowrap",
          band === "fresh" ? "text-ink-muted" : "text-apricot-text",
        )}
      >
        {verifiedAgo(iso)}
        {band !== "fresh" && " · stale"}
      </span>
      {band !== "fresh" && onReverify && (
        <button
          type="button"
          onClick={onReverify}
          className="min-h-[36px] text-meta font-medium text-brand-text hover:underline"
        >
          Re-verify
        </button>
      )}
    </span>
  );
}

function useSave(job: JobSummary) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => saveJob(job.id, !job.saved),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["jobs"] });
      void client.invalidateQueries({ queryKey: ["focus"] });
    },
  });
}

/** The one line that says why this row is where it is. */
function Signal({ job }: { job: JobSummary }) {
  if (job.blocker) {
    return (
      <span className="text-sm text-apricot-text">
        Needs {job.blocker.label.replace(/^Add /, "")} ·{" "}
        {GAP_LABEL[job.blocker.gapType].toLowerCase()}
      </span>
    );
  }
  if (job.hardBlocker) {
    return <span className="text-sm text-terracotta-text">{job.hardBlocker}</span>;
  }
  return (
    <span className="text-sm text-sage-text">
      {job.evidence.met} of {job.evidence.total} requirements met
    </span>
  );
}

const VERDICT_CHIP_TONE = {
  "apply-now": "sage",
  "one-fix-away": "apricot",
  skip: "terracotta",
} as const;

/** The verdict, as a word in its own colour. Never a colour on its own. */
export function VerdictChip({ job }: { job: JobSummary }) {
  return (
    <Chip tone={VERDICT_CHIP_TONE[job.verdict]}>
      <span aria-hidden className="size-[6px] rounded-full bg-current" />
      {VERDICT_LABEL[job.verdict]}
    </Chip>
  );
}

/**
 * Desktop row. Two lines and a hairline: role, then everything that qualifies it.
 * Actions stay quiet until the row is hovered, so a list of forty reads as a list.
 */
export function JobRow({
  job,
  selected,
  onReverify,
}: {
  job: JobSummary;
  selected?: boolean;
  onReverify?: () => void;
}) {
  const save = useSave(job);
  const tone = VERDICT_TONE[job.verdict];
  const closes = job.provenance.closesAt ? daysUntil(job.provenance.closesAt) : null;
  const href =
    job.verdict === "one-fix-away" ? `/one-fix/${job.blocker?.fixId ?? "sql"}` : `/jobs/${job.id}`;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 rounded-xl border-t border-hairline py-3.5 pl-4 transition-colors duration-150 first:border-t-0 hover:bg-row-hover",
        selected && "bg-brand-tint",
      )}
    >
      <span
        aria-hidden
        className={cn("absolute top-1/2 left-0 size-[7px] -translate-y-1/2 rounded-full", tone.rule)}
      />

      <div className="min-w-0 flex-1">
        <Link
          href={`/jobs/${job.id}`}
          className="font-display text-[1.0625rem] text-ink hover:underline"
        >
          {job.role}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <Meta>
            {job.company} · {placeLine(job)}
          </Meta>
        </p>
      </div>

      <div className="hidden w-[220px] shrink-0 md:block">
        <Signal job={job} />
        <p className="mt-0.5">
          <Mono>{SOURCE_SHORT[job.provenance.kind]}</Mono>
        </p>
      </div>

      <div className="hidden w-[196px] shrink-0 lg:block">
        <FreshnessStamp
          iso={job.provenance.verifiedAt}
          delisted={job.provenance.delisted}
          onReverify={onReverify}
        />
        {closes !== null && closes <= 10 && (
          <p className="mt-0.5">
            <Mono className="text-apricot-text">
              Closes {closingDate(job.provenance.closesAt!)}
            </Mono>
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1 pr-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => save.mutate()}
          aria-pressed={job.saved}
          className={cn(!job.saved && "opacity-0 focus-visible:opacity-100 group-hover:opacity-100")}
        >
          {job.saved ? "Saved" : "Save"}
        </Button>
        <Link
          href={href}
          className="inline-flex min-h-[38px] items-center rounded-full border border-control bg-surface px-4 text-sm font-medium text-ink transition-colors duration-150 hover:bg-surface-sunken"
        >
          {job.verdict === "one-fix-away" ? "See fix" : "Open"}
        </Link>
      </div>
    </div>
  );
}

/**
 * Mobile card. The same information as the row, composed for a thumb: a tile to
 * anchor the eye, the role in the display face, the verdict as a word, and one
 * filled action.
 */
export function JobCard({
  job,
  compact,
  onReverify,
}: {
  job: JobSummary;
  compact?: boolean;
  onReverify?: () => void;
}) {
  const save = useSave(job);
  const tone = VERDICT_TONE[job.verdict];
  const href =
    job.verdict === "one-fix-away" ? `/one-fix/${job.blocker?.fixId ?? "sql"}` : `/jobs/${job.id}`;

  if (compact) {
    return (
      <Link
        href={href}
        className="-mx-2 block rounded-xl px-2 py-3 transition-colors duration-150 hover:bg-surface-sunken"
      >
        <div className="flex items-start gap-2.5">
          <span
            aria-hidden
            className={cn("mt-[7px] size-[7px] shrink-0 rounded-full", tone.rule)}
          />
          <div className="min-w-0 flex-1">
            <span className="font-display text-[1.0625rem] text-ink">{job.role}</span>
            <p className="mt-0.5">
              <Meta>
                {job.company} · {placeLine(job)}
              </Meta>
            </p>
            <p className="mt-1.5">
              <Signal job={job} />
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article className="mt-3 rounded-2xl border border-line bg-surface p-4 first:mt-0">
      <div className="flex items-start gap-3.5">
        <CompanyTile name={job.company} />
        <div className="min-w-0 flex-1">
          <Link href={`/jobs/${job.id}`} className="font-display text-[1.25rem] text-ink">
            {job.role}
          </Link>
          <p className="mt-0.5 flex items-center gap-1.5">
            <Meta>{job.company}</Meta>
            {!job.provenance.delisted && (
              <Icon name="checkCircle" size={13} className="text-sage" />
            )}
          </p>
        </div>
        <VerdictChip job={job} />
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-sm text-ink-body">
        <Icon name="pin" size={14} className="text-ink-muted" />
        {placeLine(job)}
      </p>

      <p className="mt-1.5">
        <Signal job={job} />
      </p>

      {/* Provenance gets its own line: beside two buttons it wraps to shreds. */}
      <div className="mt-4 border-t border-hairline pt-3">
        <FreshnessStamp
          iso={job.provenance.verifiedAt}
          delisted={job.provenance.delisted}
          onReverify={onReverify}
        />
        <div className="mt-2.5 flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => save.mutate()}
            aria-pressed={job.saved}
            className="shrink-0"
          >
            {job.saved ? "Saved" : "Save"}
          </Button>
          <Link
            href={href}
            className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-sm font-medium text-white transition-colors duration-150 hover:bg-brand-hover"
          >
            {job.verdict === "one-fix-away" ? "See the fix" : "View role"}
            <Icon name="arrowRight" size={14} className="opacity-80" />
          </Link>
        </div>
      </div>
    </article>
  );
}

/** Home's preview row: title, one qualifier, nothing else. */
export function JobPreviewRow({ job }: { job: JobSummary }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="-mx-2 flex items-baseline justify-between gap-4 rounded-xl px-2 py-2.5 transition-colors duration-150 hover:bg-surface-sunken"
    >
      <span className="font-display min-w-0 flex-1 truncate text-[1.0625rem] text-ink">
        {job.role}
      </span>
      <span className="shrink-0">
        {job.blocker ? (
          <span className="text-sm text-apricot-text">
            {job.blocker.label.replace(/^Add /, "Needs ")}
          </span>
        ) : job.hardBlocker ? (
          <Meta>{job.hardBlocker}</Meta>
        ) : (
          <Meta>{job.company}</Meta>
        )}
      </span>
    </Link>
  );
}

export { SOURCE_SHORT };
