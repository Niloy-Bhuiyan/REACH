"use client";

import { Arrow, Button } from "@/components/ui/Button";
import { Mono } from "@/components/ui/Chip";
import { Eyebrow } from "@/components/ui/Surface";
import type { CertificateVerdictValue, Milestone, Resource } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

/**
 * Progression is the layout. Done is a tick, current is filled, locked is an
 * outline — no trophies, no XP, no quest chrome.
 */
export function MilestoneNode({ state, n }: { state: Milestone["state"]; n: number }) {
  return (
    <span
      className={cn(
        "tnum relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-meta font-semibold",
        state === "done" && "bg-sage text-white",
        state === "current" && "bg-apricot text-white",
        (state === "locked" || state === "skipped") &&
          "border border-group bg-surface text-ink-disabled",
      )}
    >
      {state === "done" ? "✓" : n}
    </span>
  );
}

/**
 * Free first at full weight. The paid option is quieter, headed "only if", and
 * its reason is required — this is not a catalogue.
 */
export function ResourceCard({ resource }: { resource: Resource }) {
  const free = resource.cost === "free";
  return (
    <div className={cn("py-3", !free && "opacity-75")}>
      <Eyebrow tone={free ? "sage" : "muted"}>
        {free ? "Best free resource" : `Paid alternative — only if ${resource.onlyIf}`}
      </Eyebrow>
      <p className={cn("mt-1 text-body", free ? "text-ink" : "text-ink-body")}>{resource.title}</p>
      <p className="mt-0.5 text-sm text-ink-muted">{resource.detail}</p>
      <p className="mt-1.5 flex items-baseline gap-3">
        <Mono>
          {resource.costLabel} · ~{formatMinutes(resource.minutes)}
        </Mono>
        {free ? (
          <a
            href={resource.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[36px] items-center text-sm font-medium text-sage-text hover:underline"
          >
            Open
          </a>
        ) : (
          <span className="text-sm text-ink-muted">Not required</span>
        )}
      </p>
    </div>
  );
}

function formatMinutes(minutes: number) {
  return minutes < 120 ? `${minutes} min` : `${Math.round(minutes / 60)} h`;
}

const CERT: Record<CertificateVerdictValue, { label: string; tone: string }> = {
  recommended: { label: "Recommended", tone: "text-sage-text" },
  optional: { label: "Optional", tone: "text-brand-text" },
  unnecessary: { label: "Unnecessary", tone: "text-ink-muted" },
  "low-roi": { label: "Low ROI", tone: "text-terracotta-text" },
};

/** A word plus a reason, with "how we decide" inspectable. Never a store. */
export function CertificateVerdict({
  verdict,
  reason,
  onHowWeDecide,
}: {
  verdict: CertificateVerdictValue;
  reason: string;
  onHowWeDecide?: () => void;
}) {
  const meta = CERT[verdict];
  return (
    <div className="py-3">
      <p className="flex items-baseline gap-2">
        <Eyebrow>Certificate</Eyebrow>
        <span className={cn("text-sm font-semibold", meta.tone)}>{meta.label}</span>
      </p>
      <p className="mt-1 text-sm text-ink-muted">{reason}</p>
      {onHowWeDecide && (
        <button
          type="button"
          onClick={onHowWeDecide}
          className="mt-1 min-h-[36px] text-sm font-medium text-brand-text hover:underline"
        >
          How we decide
        </button>
      )}
    </div>
  );
}

/**
 * Only the current milestone is open. Completed and locked steps stay one row
 * tall — that is what keeps a nine-step plan readable without pagination.
 */
export function MilestoneCard({
  milestone,
  last,
  onStart,
  onComplete,
  onSkip,
  onHowWeDecide,
  pending,
}: {
  milestone: Milestone;
  last: boolean;
  onStart: () => void;
  onComplete: () => void;
  onSkip: () => void;
  onHowWeDecide: () => void;
  pending: boolean;
}) {
  const open = milestone.state === "current";

  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!last && (
        <span
          aria-hidden
          className={cn(
            "absolute top-7 bottom-0 left-[11px] w-px transition-colors duration-300",
            milestone.state === "done" ? "bg-sage-line" : "bg-line",
          )}
        />
      )}

      <MilestoneNode state={milestone.state} n={milestone.n} />

      <div className={cn("min-w-0 flex-1", milestone.state === "skipped" && "opacity-60")}>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3
            className={cn(
              "text-subhead",
              milestone.state === "skipped" ? "text-ink-muted line-through" : "text-ink",
            )}
          >
            {milestone.title}
          </h3>
          <Mono>
            {milestone.hoursRemaining ? `~${milestone.hoursRemaining} h left` : `${milestone.hours} h`}
          </Mono>
        </div>

        <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2.5">
          <span
            className={cn(
              "text-sm",
              milestone.state === "done"
                ? "text-sage-text"
                : open
                  ? "text-apricot-text"
                  : "text-ink-muted",
            )}
          >
            {milestone.week}
          </span>
          <span className="text-sm text-ink-muted">
            {milestone.artefact}
            {milestone.state === "done" && " ✓"}
          </span>
          {milestone.blocksOpportunities && (
            <span className="text-sm text-ink-muted">
              blocks {milestone.blocksOpportunities} roles
            </span>
          )}
        </p>

        {/* Detail and resources appear only when the milestone is the one you are on. */}
        {open && (
          <>
            <p className="mt-2.5 max-w-[62ch] text-body text-ink-body">{milestone.detail}</p>

            {milestone.resources.length > 0 && (
              <div className="mt-3 divide-y divide-hairline border-y border-hairline">
                {milestone.resources.map((resource) => (
                  <ResourceCard key={resource.title} resource={resource} />
                ))}
                {milestone.certificate && (
                  <CertificateVerdict
                    verdict={milestone.certificate.verdict}
                    reason={milestone.certificate.reason}
                    onHowWeDecide={onHowWeDecide}
                  />
                )}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button tone="apricot" size="lg" onClick={onStart} disabled={pending}>
                Start this milestone
                <Arrow />
              </Button>
              <Button variant="secondary" onClick={onComplete} disabled={pending}>
                Mark done
              </Button>
              <Button variant="ghost" onClick={onSkip} disabled={pending}>
                Skip
              </Button>
            </div>
            <p className="mt-2 text-sm text-ink-muted">
              REACH re-checks GitHub automatically once the artefact is published.
            </p>
          </>
        )}
      </div>
    </li>
  );
}
