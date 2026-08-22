"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useAssistantSubject } from "@/components/assistant/AssistantProvider";
import { AssistantEntry } from "@/components/assistant/AssistantSurface";
import { OpportunityDelta } from "@/components/delta/OpportunityDelta";
import { MilestoneCard } from "@/components/roadmap/Milestone";
import { useSetStatusLine } from "@/components/shell/AppShell";
import { Arrow, Button, ButtonLink } from "@/components/ui/Button";
import { Meta, Mono } from "@/components/ui/Chip";
import { Meter } from "@/components/ui/Meter";
import { Disclosure } from "@/components/ui/Disclosure";
import { Sheet, SheetGrip } from "@/components/ui/Overlay";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { Hairline, Page, Stack } from "@/components/ui/Surface";
import { Skeleton, SkeletonRows } from "@/components/ui/States";
import { completeMilestone, getDelta, getPlan, skipMilestone, startMilestone } from "@/lib/api";
import { qk } from "@/lib/api/keys";
import type { Plan } from "@/lib/api/types";
import { closingDate, daysUntil } from "@/lib/utils/time";
import { GAP_LABEL } from "@/lib/utils/verdict";

/**
 * A sequenced plan against one named blocker. Progress, the next action and the
 * expected impact dominate; resources and explanation appear only inside the
 * milestone you are on.
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
        ? "Plan complete"
        : `Step ${plan.data.step} of ${plan.data.totalSteps}`
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

  const current = data.milestones.find((m) => m.state === "current");

  return (
    <Page className="pt-6 pb-20 sm:pt-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href={`/one-fix/${data.fixId}`}
          className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-medium text-violet-text hover:underline"
        >
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 8H3M7 4L3 8l4 4" />
          </svg>
          The {data.fixId.toUpperCase()} fix
        </Link>
        <div className="ml-auto hidden sm:block">
          <AssistantEntry />
        </div>
      </div>

      <div className="mt-6 grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <Stack gap="md">
            {/* Progress and the next action, before anything else. */}
            <header>
              <div className="flex items-center gap-2.5">
                <PixelIcon name="px-map" size={28} height={32} />
                <span className="text-meta font-medium text-apricot-text">
                  {GAP_LABEL[data.gapType]}
                </span>
              </div>
              <h1 className="mt-3 text-title text-ink">{data.title}</h1>

              <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2">
                <span className="tnum text-body font-medium text-ink">
                  Step {data.step} of {data.totalSteps}
                </span>
                <Meta>{data.hoursSpent} h spent of ~{data.totalHours} h</Meta>
                <Meta>
                  {data.artefactsProduced} of {data.artefactsTotal} artefacts produced
                </Meta>
              </div>
              <Meter
                fill={data.progress / 100}
                tone="apricot"
                label={`${data.progress} per cent complete`}
                className="mt-3 max-w-[420px]"
              />

              {current && (
                <p className="mt-5 max-w-[58ch] text-body text-ink-body">
                  Next: <span className="text-ink">{current.title}</span> —{" "}
                  {current.hoursRemaining ?? current.hours} hours, producing {current.artefact}.
                </p>
              )}
            </header>

            <section>
              <h2 className="border-b border-line pb-2 text-section text-ink">The plan</h2>
              <ol className="mt-5">
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
            </section>

            <section>
              <Disclosure
                label="Evidence this plan adds"
                detail={data.evidenceAdded.map((e) => e.label).join(" · ")}
              >
                <ul className="pt-1">
                  {data.evidenceAdded.map((row, i) => (
                    <li key={row.label}>
                      {i > 0 && <Hairline />}
                      <div className="flex items-baseline justify-between gap-3 py-2">
                        <span className="text-sm text-ink">{row.label}</span>
                        <span
                          className={`text-sm ${
                            row.state === "Done" || row.state === "Verified"
                              ? "text-sage-text"
                              : row.state === "In progress"
                                ? "text-apricot-text"
                                : "text-ink-muted"
                          }`}
                        >
                          {row.state}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-ink-muted">
                  Artefacts feed your profile automatically, so the next run scores you higher
                  without re-entry.
                </p>
              </Disclosure>

              <Disclosure
                label="What comes after this plan"
                detail={`${data.queuedNext.label} · queued`}
              >
                <p className="pt-1 text-sm text-ink-body">
                  {data.queuedNext.label} — a {GAP_LABEL[data.queuedNext.gapType].toLowerCase()},{" "}
                  {data.queuedNext.roles} roles, about {data.queuedNext.weeks} weeks. One plan runs
                  at a time, so it stays queued until this one closes.
                </p>
              </Disclosure>
            </section>
          </Stack>
        </div>

        <aside className="min-w-0">
          <div className="lg:sticky lg:top-24">
            {delta.data && (
              <OpportunityDelta delta={delta.data} nowLabel="now" afterLabel="when this closes" />
            )}

            {delta.data && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-ink">Waiting on this plan</h3>
                <ul className="mt-2">
                  {delta.data.affected.slice(0, 3).map((job) => (
                    <li key={job.jobId} className="border-b border-hairline last:border-b-0">
                      <Link
                        href={`/jobs/${job.jobId}`}
                        className="-mx-2 block rounded-lg px-2 py-2 transition-colors duration-100 hover:bg-surface-sunken"
                      >
                        <span className="block text-sm text-ink">{job.role}</span>
                        <span className="mt-0.5 flex items-baseline gap-2">
                          <Meta>{job.company}</Meta>
                          <Mono
                            className={
                              daysUntil(job.closesAt) <= 10 ? "text-apricot-text" : undefined
                            }
                          >
                            {closingDate(job.closesAt)}
                          </Mono>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>

      <HowWeDecideSheet open={howWeDecide} onClose={() => setHowWeDecide(false)} />
    </Page>
  );
}

/* ── 12E — plan complete ────────────────────────────────────────────────── */

/** Completion reports realised against predicted and hands off. No trophy. */
function PlanComplete({ plan }: { plan: Plan }) {
  const client = useQueryClient();
  const completion = plan.completion!;

  const restart = useMutation({
    mutationFn: () => startMilestone(plan.milestones[0].id),
    onSuccess: (next) => client.setQueryData(qk.plan, next),
  });

  return (
    <Page width="reading" className="pt-10 pb-20">
      <Stack gap="md">
        <header>
          <span className="text-meta font-medium text-sage-text">
            {GAP_LABEL[plan.gapType]} closed
          </span>
          <h1 className="mt-2 text-display text-ink">{completion.headline}</h1>
        </header>

        <section>
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <h2 className="text-section text-ink">Delta · realised</h2>
            <Mono>Predicted +{completion.predicted}</Mono>
          </div>
          <p className="tnum mt-4 flex items-baseline gap-3">
            <span className="text-[34px] leading-none font-semibold tracking-[-0.03em] text-ink-muted">
              {completion.before}
            </span>
            <span aria-hidden className="text-ink-muted">
              →
            </span>
            <span className="text-[34px] leading-none font-semibold tracking-[-0.03em] text-sage-text">
              {completion.after}
            </span>
            <span className="text-body font-semibold text-sage-text">
              +{completion.realised}
            </span>
          </p>
          <p className="mt-3 max-w-[58ch] text-body text-ink-body">{completion.reason}</p>
        </section>

        <section>
          <h2 className="border-b border-line pb-2 text-section text-ink">
            Evidence this plan added
          </h2>
          <ul>
            {plan.evidenceAdded.map((row) => (
              <li
                key={row.label}
                className="flex items-baseline justify-between gap-3 border-b border-hairline py-2.5 last:border-b-0"
              >
                <span className="text-body text-ink">{row.label}</span>
                <span className="text-sm text-sage-text">{row.state}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-ink">Next blocker</h3>
          <p className="mt-1.5 max-w-[58ch] text-body text-ink-body">
            {plan.queuedNext.label} — a {GAP_LABEL[plan.queuedNext.gapType].toLowerCase()},{" "}
            {plan.queuedNext.roles} roles, about {plan.queuedNext.weeks} weeks. Queued, not started.
          </p>
        </section>

        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/discover?verdict=apply-now" size="lg">
            Apply to the {completion.realised} that opened
            <Arrow />
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
      </Stack>
    </Page>
  );
}

function HowWeDecideSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      label="How we decide certificate verdicts"
      height="min(540px, 88%)"
    >
      <SheetGrip />
      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <h2 className="text-section text-ink">How we decide a certificate verdict</h2>
        <ol className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto text-body text-ink-body">
          <li>
            <span className="font-medium text-ink">Do the postings ask for one?</span> We read the
            affected postings from the last verified run and count how many name a credential.
          </li>
          <li>
            <span className="font-medium text-ink">Is there cheaper evidence?</span> A published
            artefact an employer can open beats a completion badge, and costs nothing.
          </li>
          <li>
            <span className="font-medium text-ink">What kind of gap is it?</span> A knowledge gap is
            the one case where structure can be worth paying for.
          </li>
          <li>
            <span className="font-medium text-ink">What does it cost?</span> Money and hours, both
            counted against the roles it actually opens.
          </li>
        </ol>
        <Button size="lg" full className="mt-4" onClick={onClose}>
          Close
        </Button>
      </div>
    </Sheet>
  );
}

function RoadmapSkeleton() {
  return (
    <Page className="pt-8">
      <Skeleton className="h-[20px] w-[140px]" />
      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <Skeleton className="h-[32px] w-[46%]" />
          <Skeleton className="mt-5 h-[16px] w-[62%]" />
          <SkeletonRows rows={3} height={72} className="mt-10" />
        </div>
        <Skeleton className="h-[130px]" />
      </div>
    </Page>
  );
}
