"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { GapTypeBadge } from "@/components/gap/GapTypeBadge";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { saveJob } from "@/lib/api";
import type { JobSummary } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { closingDate, daysUntil, freshness, verifiedAgo } from "@/lib/utils/time";
import { VERDICT_TONE } from "@/lib/utils/verdict";

const SOURCE_GLYPH = {
  "careers-page": "g-src-company",
  "job-board": "g-src-board",
  referral: "g-src-aggregator",
} as const;

const SOURCE_SHORT = {
  "careers-page": "Careers page",
  "job-board": "Job board",
  referral: "Referral",
} as const;

/** Freshness stamp. Stale content stays visible and offers a re-verify — it is never hidden. */
export function FreshnessStamp({
  iso,
  onReverify,
  delisted,
  className,
}: {
  iso: string;
  onReverify?: () => void;
  /** Rule 03 — shown for 48 h, labelled, and excluded from every count. */
  delisted?: boolean;
  className?: string;
}) {
  const band = freshness(iso);
  if (delisted) {
    return (
      <span
        className={cn(
          'tnum font-mono text-[11.5px] tracking-tight whitespace-nowrap text-apricot-text uppercase',
          className,
        )}
      >
        No longer listed at source · not counted
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "tnum font-mono text-[11.5px] tracking-tight whitespace-nowrap uppercase",
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
          className="text-[12px] font-semibold text-violet-text hover:underline"
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

/**
 * Desktop table row. Every row carries provenance: source, last-verified time in mono, the
 * evidence verdict or the single blocker with its gap type, then Save and one verdict-coloured
 * primary action.
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
  const action =
    job.verdict === "one-fix-away"
      ? { label: "See fix", href: `/one-fix/${job.blocker?.fixId ?? "sql"}`, tone: "apricot" as const }
      : job.verdict === "skip"
        ? { label: "Open", href: `/jobs/${job.id}`, tone: "terracotta" as const }
        : { label: "Open", href: `/jobs/${job.id}`, tone: "sage" as const };

  return (
    <tr
      className={cn(
        "border-t border-hairline transition-colors duration-100 hover:bg-row-hover",
        selected && "bg-violet-tint",
      )}
    >
      <td className="py-3 pr-4 pl-4 align-top">
        {selected && (
          <span aria-hidden className={cn("absolute left-0 h-9 w-[3px] rounded-r", tone.rule)} />
        )}
        <Link
          href={`/jobs/${job.id}`}
          className="text-[14.5px] font-semibold text-ink-link hover:underline"
        >
          {job.role}
        </Link>
        <p className="mt-0.5 text-[13px] text-ink-body">
          {job.company} · {job.location} · {job.mode} · {job.employment}
        </p>
      </td>

      <td className="py-3 pr-4 align-top">
        {job.blocker ? (
          <span className="flex flex-wrap items-center gap-1.5">
            <Chip tone="apricot">{job.blocker.label}</Chip>
            <GapTypeBadge gap={job.blocker.gapType} />
          </span>
        ) : job.hardBlocker ? (
          <Chip tone="terracotta">{job.hardBlocker}</Chip>
        ) : (
          <Chip tone="sage">
            <PixelIcon name="g-req-met" size={14} />
            {job.evidence.met} of {job.evidence.total} met
          </Chip>
        )}
      </td>

      <td className="py-3 pr-4 align-top">
        <span className="flex items-center gap-1.5 text-[13px] text-ink-body">
          <PixelIcon name={SOURCE_GLYPH[job.provenance.kind]} size={16} />
          {job.provenance.label}
        </span>
        <FreshnessStamp
          iso={job.provenance.verifiedAt}
          delisted={job.provenance.delisted}
          onReverify={onReverify}
          className="mt-1"
        />
      </td>

      <td className="py-3 pr-4 align-top">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            tone={job.saved ? "sage" : "violet"}
            onClick={() => save.mutate()}
            aria-pressed={job.saved}
          >
            {job.saved ? "Saved" : "Save"}
          </Button>
          <Link
            href={action.href}
            className={cn(
              "inline-flex min-h-[36px] items-center rounded-lg border px-3.5 text-[13.5px] font-semibold transition-colors duration-100",
              action.tone === "sage" && "border-sage bg-sage text-surface hover:bg-sage-hover",
              action.tone === "apricot" &&
                "border-apricot bg-apricot text-surface hover:bg-apricot-hover",
              action.tone === "terracotta" &&
                "border-terracotta-line bg-terracotta-tint text-terracotta-text hover:bg-[#f7e3dd]",
            )}
          >
            {action.label}
          </Link>
        </div>
      </td>
    </tr>
  );
}

/**
 * Mobile card. Two lines: title and freshness, then company · city · mode, then the evidence
 * chip and the gap type. 44px actions.
 */
export function JobCard({
  job,
  compact,
  onReverify,
}: {
  job: JobSummary;
  /** Home previews are compact: no action row, the whole card navigates. */
  compact?: boolean;
  onReverify?: () => void;
}) {
  const save = useSave(job);
  const closes = job.provenance.closesAt ? daysUntil(job.provenance.closesAt) : null;

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[14.5px] leading-snug font-semibold text-ink-link">{job.role}</span>
        <FreshnessStamp
          iso={job.provenance.verifiedAt}
          delisted={job.provenance.delisted}
          onReverify={onReverify}
        />
      </div>
      <p className="mt-0.5 text-[13px] text-ink-body">
        {job.company} · {job.location} · {job.mode}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {job.blocker ? (
          <>
            <Chip tone="apricot">{job.blocker.label}</Chip>
            <GapTypeBadge gap={job.blocker.gapType} />
          </>
        ) : job.hardBlocker ? (
          <Chip tone="terracotta">{job.hardBlocker}</Chip>
        ) : (
          <Chip tone="sage">
            {job.evidence.met} of {job.evidence.total} met
          </Chip>
        )}
        <Chip tone="stone">{job.employment}</Chip>
        {closes !== null && closes <= 10 && (
          <Chip tone="apricot" mono>
            Closes {closingDate(job.provenance.closesAt!)}
          </Chip>
        )}
      </div>
    </>
  );

  if (compact) {
    return (
      <Link
        href={`/jobs/${job.id}`}
        className="block rounded-[12px] border border-line bg-surface p-3.5 transition-colors duration-100 hover:bg-row-hover"
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className="rounded-[12px] border border-line bg-surface p-3.5">
      {inner}
      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="secondary"
          size="md"
          tone={job.saved ? "sage" : "violet"}
          onClick={() => save.mutate()}
          aria-pressed={job.saved}
          className="flex-1"
        >
          {job.saved ? "Saved" : "Save"}
        </Button>
        <Link
          href={
            job.verdict === "one-fix-away"
              ? `/one-fix/${job.blocker?.fixId ?? "sql"}`
              : `/jobs/${job.id}`
          }
          className={cn(
            "inline-flex min-h-[44px] flex-1 items-center justify-center rounded-[10px] text-[14px] font-semibold transition-colors duration-100",
            job.verdict === "apply-now" && "bg-sage text-surface hover:bg-sage-hover",
            job.verdict === "one-fix-away" && "bg-apricot text-surface hover:bg-apricot-hover",
            job.verdict === "skip" &&
              "border border-terracotta-line bg-terracotta-tint text-terracotta-text",
          )}
        >
          {job.verdict === "one-fix-away" ? "See fix" : "Open role"}
        </Link>
      </div>
    </div>
  );
}

/** Home's Summary Mode row: exactly three of these, then "see all". */
export function JobPreviewRow({ job }: { job: JobSummary }) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="-mx-2 flex items-center justify-between gap-3 rounded-[10px] px-2 py-3 transition-colors duration-100 hover:bg-row-hover"
    >
      <span className="min-w-0">
        <span className="block truncate text-[14.5px] font-semibold text-ink-link">
          {job.role}
        </span>
        <span className="block truncate text-[13px] text-ink-muted">{job.company}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {job.blocker ? (
          <Chip tone="apricot">{job.blocker.label}</Chip>
        ) : job.hardBlocker ? (
          <Chip tone="terracotta">{job.hardBlocker}</Chip>
        ) : (
          <>
            <Chip tone="stone">{job.location}</Chip>
            <Chip tone="stone" className="hidden md:inline-flex">
              {job.employment}
            </Chip>
          </>
        )}
      </span>
    </Link>
  );
}

export { SOURCE_GLYPH, SOURCE_SHORT };
