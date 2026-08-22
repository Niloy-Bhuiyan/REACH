"use client";

import { motion } from "framer-motion";
import { Arrow, Button } from "@/components/ui/Button";
import { Chip, Mono } from "@/components/ui/Chip";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { Eyebrow } from "@/components/ui/Surface";
import { Disclosure } from "@/components/ui/Disclosure";
import type { CertificateVerdictValue, Milestone, Resource } from "@/lib/api/types";
import { useReducedMotion } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";

/* ── Node ───────────────────────────────────────────────────────────────── */

const NODE_GLYPH: Record<Milestone["state"], string> = {
  done: "g-node-done",
  current: "g-node-now",
  locked: "g-node-locked",
  skipped: "g-node-locked",
};

/**
 * Three node states — done (sage check), current (apricot ring, expanded), locked (stone,
 * collapsed). Progression is the layout, not a decoration. No trophies, no XP.
 */
export function MilestoneNode({ state, n }: { state: Milestone["state"]; n: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.span
      initial={false}
      animate={{ scale: 1 }}
      transition={{ duration: reduced ? 0 : 0.24, ease: [0.2, 0.8, 0.2, 1] }}
      className={cn(
        "tnum relative z-10 flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border-2 font-display text-[15px] font-bold",
        state === "done" && "border-sage bg-sage-tint text-sage-text",
        state === "current" && "border-apricot bg-apricot-tint text-apricot-text",
        (state === "locked" || state === "skipped") &&
          "border-group bg-canvas text-ink-disabled",
      )}
    >
      {state === "done" ? <PixelIcon name={NODE_GLYPH.done} size={22} /> : n}
    </motion.span>
  );
}

/* ── Resources ──────────────────────────────────────────────────────────── */

/**
 * Free first, at full weight, in sage. The paid option is a dashed, quieter card headed
 * "only if", and the reason is required. No catalogue, no provider logos, no browsing.
 */
export function ResourceCard({ resource }: { resource: Resource }) {
  const free = resource.cost === "free";
  return (
    <div
      className={cn(
        "rounded-[12px] p-3.5",
        free
          ? "border border-sage-line bg-sage-tint"
          : "border border-dashed border-group bg-canvas",
      )}
    >
      <Eyebrow tone={free ? "sage" : "muted"}>
        {free ? "Best free resource" : `Paid alternative — only if ${resource.onlyIf}`}
      </Eyebrow>
      <p
        className={cn(
          "mt-1.5 text-[14.5px] leading-snug font-semibold",
          free ? "text-ink" : "text-ink-body",
        )}
      >
        {resource.title}
      </p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-body">{resource.detail}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Chip tone={free ? "sage" : "stone"} mono>
          {resource.costLabel} · ~{formatMinutes(resource.minutes)}
        </Chip>
        {free ? (
          <a
            href={resource.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center px-1 text-[13.5px] font-semibold text-sage-text hover:underline"
          >
            Open ↗
          </a>
        ) : (
          <span className="text-[13px] text-ink-muted">Not required</span>
        )}
      </div>
    </div>
  );
}

function formatMinutes(minutes: number) {
  return minutes < 120 ? `${minutes} min` : `${Math.round(minutes / 60)} h`;
}

/* ── Certificate verdict ────────────────────────────────────────────────── */

const CERT: Record<
  CertificateVerdictValue,
  { label: string; glyph: string; tone: "sage" | "violet" | "stone" | "terracotta" }
> = {
  recommended: { label: "Recommended", glyph: "g-cert-rec", tone: "sage" },
  optional: { label: "Optional", glyph: "g-cert-opt", tone: "violet" },
  unnecessary: { label: "Unnecessary", glyph: "g-cert-unnec", tone: "stone" },
  "low-roi": { label: "Low ROI", glyph: "g-cert-lowroi", tone: "terracotta" },
};

/** A word plus a reason, with "how we decide" inspectable. Never a store. */
export function CertificateVerdict({
  verdict,
  reason,
  onHowWeDecide,
  compact,
  bare,
}: {
  verdict: CertificateVerdictValue;
  reason: string;
  onHowWeDecide?: () => void;
  compact?: boolean;
  /** Inside a disclosure the row above already carries the box and the word. */
  bare?: boolean;
}) {
  const meta = CERT[verdict];
  return (
    <div className={bare ? "" : "rounded-[12px] border border-line bg-surface p-3.5"}>
      {!bare && (
        <div className="flex items-center gap-2.5">
          <PixelIcon name={meta.glyph} size={compact ? 22 : 26} />
          <Eyebrow>Certificate verdict</Eyebrow>
          <Chip tone={meta.tone}>{meta.label}</Chip>
        </div>
      )}
      <p className={`text-[13px] leading-relaxed text-ink-body ${bare ? "" : "mt-2"}`}>
        {reason}
      </p>
      {onHowWeDecide && (
        <button
          type="button"
          onClick={onHowWeDecide}
          className="mt-1 min-h-[44px] text-[13px] font-semibold text-violet-text hover:underline"
        >
          How we decide ↗
        </button>
      )}
    </div>
  );
}

/* ── Milestone card ─────────────────────────────────────────────────────── */

/**
 * Only the current milestone is open. Completed and locked steps stay one row tall — that is
 * what keeps a nine-step plan readable without pagination.
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
  const free = milestone.resources.filter((resource) => resource.cost === "free");
  const paid = milestone.resources.filter((resource) => resource.cost !== "free");

  return (
    <li className="relative flex gap-4 pb-4">
      {/* The rail. Sage behind a completed node, stone ahead of it. */}
      {!last && (
        <span
          aria-hidden
          className={cn(
            "absolute top-[38px] bottom-0 left-[18px] w-[2px] transition-colors duration-[300ms]",
            milestone.state === "done" ? "bg-sage-line" : "bg-group",
          )}
        />
      )}

      <MilestoneNode state={milestone.state} n={milestone.n} />

      <div
        className={cn(
          "min-w-0 flex-1 rounded-[14px] border p-4",
          open ? "border-apricot-line bg-surface shadow-tier2" : "border-line bg-surface",
          milestone.state === "skipped" && "opacity-70",
        )}
      >
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <Mono
            className={
              milestone.state === "done"
                ? "text-sage-text"
                : open
                  ? "text-apricot-text"
                  : undefined
            }
          >
            {milestone.week}
          </Mono>
          <Mono className="ml-auto">
            {milestone.hoursRemaining
              ? `~${milestone.hoursRemaining} h remaining`
              : `${milestone.hours} h`}
          </Mono>
        </div>

        <h3
          className={cn(
            "mt-1 text-[15.5px] leading-snug font-semibold",
            milestone.state === "skipped" ? "text-ink-muted line-through" : "text-ink",
          )}
        >
          {milestone.title}
        </h3>

        {(open || milestone.state === "done") && (
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-body">{milestone.detail}</p>
        )}

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <Chip tone={milestone.state === "done" ? "sage" : "stone"}>
            <PixelIcon name={milestone.artefactIcon} size={14} />
            {milestone.artefact}
            {milestone.state === "done" && " ✓"}
          </Chip>
          {milestone.blocksOpportunities && (
            <Chip tone="apricot">Blocks {milestone.blocksOpportunities} opportunities</Chip>
          )}
          {milestone.artefactVerified && <Mono>{milestone.artefactVerified}</Mono>}
          {milestone.closesPlan && <Chip tone="violet">Closes the roadmap</Chip>}
        </div>

        {open && (
          <>
            {/*
              The free resource is the recommendation, so it stays on the surface.
              The paid alternative and the certificate verdict are answers to
              questions the user may not be asking yet, so they wait one row down.
            */}
            {free.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {free.map((resource) => (
                  <ResourceCard key={resource.title} resource={resource} />
                ))}
              </div>
            )}

            {(paid.length > 0 || milestone.certificate) && (
              <div className="mt-3">
                {paid.map((resource) => (
                  <Disclosure
                    key={resource.title}
                    label="Is there a paid option?"
                    detail={`${resource.costLabel} · not required`}
                  >
                    <ResourceCard resource={resource} />
                  </Disclosure>
                ))}

                {milestone.certificate && (
                  <Disclosure
                    label="Do I need a certificate?"
                    detail={CERT[milestone.certificate.verdict].label}
                  >
                    <CertificateVerdict
                      verdict={milestone.certificate.verdict}
                      reason={milestone.certificate.reason}
                      onHowWeDecide={onHowWeDecide}
                      bare
                    />
                  </Disclosure>
                )}
              </div>
            )}

            <p className="mt-3 text-[13px] text-ink-muted">
              Mark done when the artefact is published — REACH re-checks GitHub automatically.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="tertiary"
                onClick={onSkip}
                disabled={pending}
                className="px-1 text-ink-muted"
              >
                Skip this step
              </Button>
              <Button
                variant="secondary"
                onClick={onComplete}
                disabled={pending}
                className="ml-auto"
              >
                Mark done
              </Button>
              <Button tone="apricot" onClick={onStart} disabled={pending}>
                Start this milestone <Arrow />
              </Button>
            </div>
          </>
        )}
      </div>
    </li>
  );
}
