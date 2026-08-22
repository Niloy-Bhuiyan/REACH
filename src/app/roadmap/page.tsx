"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useAssistantSubject } from "@/components/assistant/AssistantProvider";
import { AssistantEntry } from "@/components/assistant/AssistantSurface";
import { OpportunityDelta } from "@/components/delta/OpportunityDelta";
import { GapTypeBadge } from "@/components/gap/GapTypeBadge";
import { MilestoneCard } from "@/components/roadmap/Milestone";
import { useSetStatusLine } from "@/components/shell/AppShell";
import { Arrow, Button, ButtonLink } from "@/components/ui/Button";
import { Chip, Mono } from "@/components/ui/Chip";
import { Meter } from "@/components/ui/Meter";
import { Sheet, SheetGrip } from "@/components/ui/Overlay";
import { PixelIcon, Scenery } from "@/components/ui/PixelIcon";
import { Card, Eyebrow, Hairline, SectionHead } from "@/components/ui/Surface";
import { Skeleton, SkeletonRows } from "@/components/ui/States";
import {
  completeMilestone,
  getDelta,
  getPlan,
  skipMilestone,
  startMilestone,
} from "@/lib/api";
import { qk } from "@/lib/api/keys";
import type { Plan } from "@/lib/api/types";
import { closingDate, daysUntil } from "@/lib/utils/time";
import { GAP_LABEL } from "@/lib/utils/verdict";

/**
 * A sequenced plan against one named blocker, not a catalogue. Every milestone produces an
 * artefact REACH can later verify, resources hang off the milestone that needs them, and the
 * certificate question is answered with a verdict rather than a store.
 */
export default function RoadmapPage() {
  const client = useQueryClient();
  const [howWeDecide, setHowWeDecide] = useState(false);

  const plan = useQuery({ queryKey: qk.plan, queryFn: getPlan });
  const delta = useQuery({ queryKey: qk.delta("sql"), queryFn: () => getDelta("sql") });

  const mutate = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "start" | "complete" | "skip" }) =>
      action === "start"
        ? startMilestone(id)
        : action === "complete"
          ? completeMilestone(id)
          : skipMilestone(id),
    onSuccess: (next) => {
      client.setQueryData(qk.plan, next);
      void client.invalidateQueries({ queryKey: ["focus"] });
    },
  });

  useSetStatusLine(
    plan.data
      ? plan.data.status === "complete"
        ? `${plan.data.totalSteps} of ${plan.data.totalSteps} steps · complete`
        : `Step ${plan.data.step} of ${plan.data.totalSteps} · on track`
      : null,
  );
  useAssistantSubject({
    scope: "roadmap",
    id: plan.data?.id ?? null,
    label: "Ask about this plan",
    subject: plan.data ? `This plan · ${plan.data.title}` : "This plan",
  });

  if (plan.isLoading || !plan.data) return <RoadmapSkeleton />;
  const data = plan.data;

  if (data.status === "complete" && data.completion) return <PlanComplete plan={data} />;

  return (
    <div className="relative mx-auto w-full max-w-[1440px] px-5 pb-28 sm:px-8 md:px-10 md:pb-14 xl:px-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[200px] overflow-hidden">
        <Scenery
          name="horizon-right"
          width={520}
          height={200}
          className="scenery-mask-l top-0 right-0 opacity-50"
        />
      </div>

      <header className="relative pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/one-fix/${data.fixId}`}
            className="min-h-[44px] content-center text-[13.5px] font-semibold text-violet-text hover:underline"
          >
            ← Back to the {data.fixId.toUpperCase()} fix
          </Link>
          <Mono className="hidden sm:inline">
            Created {closingDate(data.createdAt)} · {data.updatedNote}
          </Mono>
          <div className="ml-auto hidden sm:block">
            <AssistantEntry />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-start gap-5">
          <PixelIcon name="px-map" size={78} height={90} className="md:hidden" />
          <PixelIcon name="px-map" size={80} height={92} className="hidden md:block" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Eyebrow tone="violet">Target</Eyebrow>
              <span className="text-[13.5px] text-ink-body">
                {data.target.role} · {data.target.location} · {data.target.modes.join(" · ")}
              </span>
              <GapTypeBadge gap={data.gapType} />
            </div>
            <h1 className="mt-2 font-display text-[32px] leading-[1.06] font-extrabold tracking-[-.03em] text-ink sm:text-[42px]">
              {data.title}
            </h1>
            <p className="mt-2.5 max-w-[76ch] text-[15px] leading-relaxed text-ink-body">
              {data.summary}
            </p>
          </div>
        </div>

        {/* Progress is evidence, not a percentage of activity. */}
        <Card className="mt-5 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Eyebrow>Progress</Eyebrow>
            <p className="tnum mt-1 font-display text-[22px] leading-none font-extrabold text-ink">
              {data.step} of {data.totalSteps} steps
            </p>
            <div className="mt-2 flex items-center gap-2.5">
              <Meter fill={data.progress / 100} tone="apricot" label={`${data.progress}% complete`} />
              <span className="tnum font-mono text-[12.5px] text-apricot-text">
                {data.progress}%
              </span>
            </div>
          </div>
          <Stat label="Total effort" value={`~${data.totalHours} h across 2 weeks`} />
          <Stat label="Spent so far" value={`${data.hoursSpent} h`} mono />
          <Stat
            label="Artefacts produced"
            value={`${data.artefactsProduced} of ${data.artefactsTotal}`}
            mono
          />
        </Card>
      </header>

      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="min-w-0">
          <SectionHead
            glyph="px-map"
            title="The plan"
            detail="Week by week · each milestone names the evidence it produces"
          />
          <ol className="mt-4 flex flex-col">
            {data.milestones.map((milestone, i) => (
              <MilestoneCard
                key={milestone.id}
                milestone={milestone}
                last={i === data.milestones.length - 1}
                pending={mutate.isPending}
                onStart={() => mutate.mutate({ id: milestone.id, action: "start" })}
                onComplete={() => mutate.mutate({ id: milestone.id, action: "complete" })}
                onSkip={() => mutate.mutate({ id: milestone.id, action: "skip" })}
                onHowWeDecide={() => setHowWeDecide(true)}
              />
            ))}
          </ol>

          {/* One plan at a time. The next is previewed, not started. */}
          <Card className="mt-2 flex flex-wrap items-center gap-3 p-4">
            <PixelIcon name="g-node-locked" size={26} />
            <p className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-ink-body">
              Next roadmap after this one:{" "}
              <span className="font-semibold text-ink">{data.queuedNext.label}</span> — a genuine{" "}
              {GAP_LABEL[data.queuedNext.gapType].toLowerCase()}, {data.queuedNext.roles} roles,
              about {data.queuedNext.weeks} weeks. It stays queued until this plan closes.
            </p>
            <Button variant="tertiary" disabled reason="One plan at a time — this one is active">
              Preview ↗
            </Button>
          </Card>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          {delta.data && (
            <OpportunityDelta
              delta={delta.data}
              nowLabel="now"
              afterLabel="when this closes"
              className="lg:sticky lg:top-[92px]"
            />
          )}

          {delta.data && (
            <Card className="p-4">
              <div className="flex items-baseline justify-between gap-3">
                <Eyebrow>Opportunities waiting</Eyebrow>
                <span className="tnum font-mono text-[13px] font-semibold text-sage-text">
                  {delta.data.affected.length}
                </span>
              </div>
              <ul className="mt-2.5 flex flex-col">
                {delta.data.affected.slice(0, 3).map((job, i) => (
                  <li key={job.jobId}>
                    {i > 0 && <Hairline />}
                    <Link
                      href={`/jobs/${job.jobId}`}
                      className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-row-hover"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[13.5px] font-semibold text-ink-link">
                          {job.role}
                        </span>
                        <span className="block truncate text-[12.5px] text-ink-muted">
                          {job.company}
                        </span>
                      </span>
                      <Mono
                        className={
                          daysUntil(job.closesAt) <= 10 ? "text-apricot-text" : undefined
                        }
                      >
                        Closes {closingDate(job.closesAt)}
                      </Mono>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-2.5 border-t border-hairline pt-2.5 text-[12.5px] text-ink-body">
                {delta.data.affected.filter((job) => daysUntil(job.closesAt) <= 10).length} close
                within 10 days.
              </p>
            </Card>
          )}

          <Card className="p-4">
            <Eyebrow>Evidence this plan will add</Eyebrow>
            <ul className="mt-2.5 flex flex-col gap-2">
              {data.evidenceAdded.map((row) => (
                <li key={row.label} className="flex items-center gap-2.5">
                  <PixelIcon name={row.icon} size={20} />
                  <span className="flex-1 text-[13.5px] font-semibold text-ink">{row.label}</span>
                  <Chip
                    tone={
                      row.state === "Done" || row.state === "Verified"
                        ? "sage"
                        : row.state === "In progress"
                          ? "apricot"
                          : "stone"
                    }
                  >
                    {row.state}
                  </Chip>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12.5px] leading-snug text-ink-muted">
              Artefacts feed your profile automatically, so the next discovery run scores you
              higher without re-entry.
            </p>
          </Card>

          <div className="sm:hidden">
            <AssistantEntry className="w-full justify-center" />
          </div>
        </aside>
      </div>

      <HowWeDecideSheet open={howWeDecide} onClose={() => setHowWeDecide(false)} />
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <p
        className={`mt-1 text-[15px] font-semibold text-ink ${mono ? "tnum font-mono text-[16px]" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

/* ── 12E — plan complete ────────────────────────────────────────────────── */

/**
 * Completion reports the realised delta against the predicted one and hands off to the queued
 * plan. No trophy, no celebration screen.
 */
function PlanComplete({ plan }: { plan: Plan }) {
  const client = useQueryClient();
  const completion = plan.completion!;

  const restart = useMutation({
    mutationFn: () => startMilestone(plan.milestones[0].id),
    onSuccess: (next) => client.setQueryData(qk.plan, next),
  });

  return (
    <div className="relative mx-auto w-full max-w-[820px] px-5 pb-28 sm:px-8 md:pb-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[190px] overflow-hidden">
        <Scenery
          name="scene-path"
          width={720}
          height={190}
          className="scenery-mask-b inset-x-0 top-0 opacity-50"
          style={{ width: "100%", height: 190, objectFit: "cover" }}
        />
      </div>

      <header className="relative pt-6">
        <div className="flex items-center gap-3">
          <Link
            href="/roadmap"
            className="min-h-[44px] content-center text-[13.5px] font-semibold text-violet-text hover:underline"
          >
            ← Roadmap
          </Link>
          <Mono>
            {plan.totalSteps} of {plan.totalSteps} steps
          </Mono>
        </div>

        <div className="mt-4 flex items-start gap-4">
          <PixelIcon name="g-run-complete" size={56} />
          <div>
            <Eyebrow tone="sage">{GAP_LABEL[plan.gapType]} · closed</Eyebrow>
            <h1 className="mt-1 font-display text-[32px] leading-tight font-extrabold text-ink sm:text-[40px]">
              {completion.headline}
            </h1>
          </div>
        </div>
      </header>

      {/* Realised against predicted, with the reason for the difference. */}
      <Card tier={2} className="mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Eyebrow>Delta · realised</Eyebrow>
          <Mono>Predicted +{completion.predicted}</Mono>
        </div>
        <div className="mt-3 flex items-end gap-4">
          <div>
            <p className="tnum font-display text-[40px] leading-none font-extrabold text-ink">
              {completion.before}
            </p>
            <p className="mt-1 text-[13px] text-ink-muted">before</p>
          </div>
          <span aria-hidden className="pb-5 text-[22px] text-ink-placeholder">
            →
          </span>
          <div>
            <p className="tnum font-display text-[40px] leading-none font-extrabold text-sage-text">
              {completion.after}
            </p>
            <p className="mt-1 text-[13px] text-ink-muted">today</p>
          </div>
          <span className="tnum mb-5 ml-auto rounded-lg border border-sage-line bg-sage-tint px-2.5 py-1 font-display text-[19px] font-extrabold text-sage-text">
            +{completion.realised}
          </span>
        </div>
        <p className="mt-3 text-[13.5px] leading-relaxed text-ink-body">{completion.reason}</p>
      </Card>

      <section className="mt-6">
        <Eyebrow>Evidence this plan added</Eyebrow>
        <ul className="mt-2.5 flex flex-col gap-2">
          {plan.evidenceAdded.map((row) => (
            <li
              key={row.label}
              className="flex items-center gap-3 rounded-[12px] border border-line bg-surface p-3.5"
            >
              <PixelIcon name={row.icon} size={22} />
              <span className="flex-1 text-[14px] font-semibold text-ink">{row.label}</span>
              <Chip tone="sage">{row.state}</Chip>
            </li>
          ))}
        </ul>
      </section>

      <Card tint="apricot" className="mt-6 p-4">
        <Eyebrow tone="apricot">Next blocker</Eyebrow>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-body">
          {plan.queuedNext.label} — a {GAP_LABEL[plan.queuedNext.gapType].toLowerCase()},{" "}
          {plan.queuedNext.roles} roles, about {plan.queuedNext.weeks} weeks. Queued, not started.
        </p>
      </Card>

      <div className="mt-6 flex flex-wrap gap-2">
        <ButtonLink href="/discover?verdict=apply-now" size="lg">
          Apply to the {completion.realised} that opened <Arrow />
        </ButtonLink>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => restart.mutate()}
          disabled={restart.isPending}
        >
          Start the {plan.queuedNext.label} plan
        </Button>
      </div>
    </div>
  );
}

/* ── How we decide ──────────────────────────────────────────────────────── */

function HowWeDecideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} label="How we decide certificate verdicts" height="min(560px, 88%)">
      <SheetGrip />
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-5">
        <h2 className="font-display text-[22px] font-bold text-ink">
          How we decide a certificate verdict
        </h2>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          <ol className="flex flex-col gap-3 text-[14px] leading-relaxed text-ink-body">
            <li>
              <span className="font-semibold text-ink">1 · Do the postings ask for one?</span> We
              read the affected postings from the last verified run and count how many name a
              specific credential.
            </li>
            <li>
              <span className="font-semibold text-ink">2 · Is there cheaper evidence?</span> A
              published artefact an employer can open is stronger than a completion badge, and it
              costs nothing.
            </li>
            <li>
              <span className="font-semibold text-ink">3 · What kind of gap is it?</span> A
              knowledge gap is the one case where structure can be worth paying for. Signal and
              proof gaps are not.
            </li>
            <li>
              <span className="font-semibold text-ink">4 · What does it cost you?</span> Money and
              hours are both counted, against the number of roles it actually opens.
            </li>
          </ol>
          <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">
            Recommended means the postings ask for it by name. Optional means it helps but is not
            asked for. Unnecessary means an artefact you can build for free is stronger. Low ROI
            means it costs more than the roles it opens are worth right now.
          </p>
        </div>
        <Button size="lg" full className="mt-4" onClick={onClose}>
          Close
        </Button>
      </div>
    </Sheet>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pt-8 sm:px-8 md:px-10 xl:px-16">
      <Skeleton className="h-[20px] w-[200px]" />
      <div className="mt-5 flex gap-5">
        <Skeleton className="h-[92px] w-[80px]" />
        <div className="flex-1">
          <Skeleton className="h-[42px] w-[54%]" />
          <Skeleton className="mt-3 h-[18px] w-[80%]" />
        </div>
      </div>
      <Skeleton className="mt-5 h-[92px]" />
      <SkeletonRows rows={3} height={120} className="mt-7" />
    </div>
  );
}
