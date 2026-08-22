"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import { useAssistantSubject } from "@/components/assistant/AssistantProvider";
import { AssistantEntry } from "@/components/assistant/AssistantSurface";
import { DeltaAudit, OpportunityDelta } from "@/components/delta/OpportunityDelta";
import { useSetStatusLine } from "@/components/shell/AppShell";
import { Arrow, ButtonLink } from "@/components/ui/Button";
import { Meta, Mono } from "@/components/ui/Chip";
import { Disclosure } from "@/components/ui/Disclosure";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { Hairline, Page, Stack } from "@/components/ui/Surface";
import { Skeleton, SkeletonRows } from "@/components/ui/States";
import { getDelta, getFix, getLatestRun } from "@/lib/api";
import { qk } from "@/lib/api/keys";
import type { GapType } from "@/lib/api/types";
import { ago, closingDate, daysUntil } from "@/lib/utils/time";
import { GAP_DIAGNOSIS, GAP_LABEL, VERDICT_LABEL } from "@/lib/utils/verdict";

/**
 * The signature screen. The blocker is the headline, the classification is
 * checkable, the intervention is three concrete steps, and the number is audited
 * on the page rather than asserted.
 */
export default function OneFixPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const fix = useQuery({ queryKey: qk.fix(id), queryFn: () => getFix(id) });
  const delta = useQuery({ queryKey: qk.delta(id), queryFn: () => getDelta(id) });
  const run = useQuery({ queryKey: qk.latestRun, queryFn: getLatestRun });

  useSetStatusLine(run.data?.completedAt ? `Verified ${ago(run.data.completedAt)}` : null);
  useAssistantSubject({
    scope: "fix",
    id,
    label: "Ask about this fix",
    subject: fix.data ? `This fix · ${fix.data.headline}` : "This fix",
  });

  if (fix.isLoading || !fix.data) return <FixSkeleton />;
  const data = fix.data;

  return (
    <Page className="pt-6 pb-28 sm:pt-8 sm:pb-20">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href={`/jobs/${data.jobId}`}
          className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-medium text-brand-text hover:underline"
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
          {data.jobRole} · {data.jobCompany}
        </Link>
        <Mono className="ml-auto">
          Fix {data.indexInRun} of {data.runFixCount}
        </Mono>
      </div>

      <div className="mt-6 grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <Stack gap="md">
            {/* The blocker is the headline. You know what to do before scrolling. */}
            <header>
              <div className="flex items-center gap-2.5">
                <PixelIcon name="px-wrench" size={30} height={34} />
                <span className="text-meta font-medium text-apricot-text">
                  {GAP_LABEL[data.gapType]}
                </span>
              </div>
              <h1 className="mt-3 max-w-[18ch] text-display text-ink">{data.headline}</h1>
              <p className="mt-3 max-w-[60ch] text-body text-ink-body">{data.body}</p>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <ButtonLink href="/roadmap" tone="apricot" size="lg">
                  Open the roadmap
                  <Arrow />
                </ButtonLink>
                <ButtonLink href="/resume" variant="secondary" size="lg">
                  Fix my CV wording
                </ButtonLink>
              </div>
            </header>

            {/* Three steps, each naming what it produces and what it costs. */}
            <section>
              <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                <h2 className="text-section text-ink">The fix</h2>
                <Mono>~{data.totalHours} hours total</Mono>
              </div>
              <ol>
                {data.steps.map((step) => (
                  <li
                    key={step.n}
                    className="grid gap-x-6 gap-y-1 border-b border-hairline py-3.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]"
                  >
                    <div className="flex min-w-0 gap-3">
                      <span className="tnum text-body text-ink-muted">{step.n}</span>
                      <div className="min-w-0">
                        <p className="text-body text-ink">{step.title}</p>
                        <p className="mt-0.5 text-sm text-ink-muted">{step.detail}</p>
                      </div>
                    </div>
                    <p className="flex items-baseline gap-2 sm:justify-end">
                      <span className="text-sm text-sage-text">{step.produces}</span>
                      <Mono>~{step.hours} h</Mono>
                    </p>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-sm text-ink-muted">
                {data.noCourseNote}{" "}
                <Link href="/roadmap" className="font-medium text-brand-text hover:underline">
                  See the certificate verdict
                </Link>
              </p>
            </section>

            {/* Every affected posting, clickable back into Job Detail. */}
            {delta.data && (
              <section>
                <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                  <h2 className="text-section text-ink">The {delta.data.gain} roles this opens</h2>
                  <Mono>From today&apos;s run</Mono>
                </div>
                <ul>
                  {delta.data.affected.map((job) => (
                    <li key={job.jobId}>
                      <Link
                        href={`/jobs/${job.jobId}`}
                        className="-mx-2 flex items-baseline gap-4 rounded-lg border-b border-hairline px-2 py-3 transition-colors duration-100 hover:bg-surface-sunken"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-body text-ink">{job.role}</span>
                          <span className="mt-0.5 block">
                            <Meta>
                              {job.company} · {job.location} · {job.otherRequirements}
                            </Meta>
                          </span>
                        </span>
                        <span className="hidden shrink-0 sm:block">
                          <Mono
                            className={
                              daysUntil(job.closesAt) <= 10 ? "text-apricot-text" : undefined
                            }
                          >
                            Closes {closingDate(job.closesAt)}
                          </Mono>
                        </span>
                        <span className="shrink-0 text-sm font-medium text-sage-text">
                          → {VERDICT_LABEL[job.verdictAfter]}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-ink-muted">
                  {delta.data.affected.filter((job) => daysUntil(job.closesAt) <= 10).length} of
                  these close in under 10 days — worth doing first.
                </p>
              </section>
            )}

            {/* The classification, and the evidence behind it. Checkable, not asserted. */}
            <section>
              <GapTypes verdicts={data.gapTypeVerdicts} />

              <Disclosure
                label="Evidence behind this classification"
                detail={`${data.classificationEvidence.length} sources`}
              >
                <ul className="pt-1">
                  {data.classificationEvidence.map((row, i) => (
                    <li key={row.title}>
                      {i > 0 && <Hairline />}
                      <div className="py-2">
                        <p className="text-sm font-medium text-ink">{row.title}</p>
                        <p className="mt-0.5 text-sm text-ink-muted">{row.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-ink-muted">
                  This is why we call it a {GAP_LABEL[data.gapType].toLowerCase()} — the work
                  exists in your own sources.
                </p>
              </Disclosure>

              {delta.data && (
                <Disclosure label="How the number was counted" detail={`+${delta.data.gain}`}>
                  <DeltaAudit delta={delta.data} className="pt-1" />
                </Disclosure>
              )}
            </section>
          </Stack>
        </div>

        <aside className="min-w-0">
          <div className="lg:sticky lg:top-24">
            {delta.data && <OpportunityDelta delta={delta.data} />}

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-ink">Next after this</h3>
              <p className="mt-1.5 text-sm text-ink-body">
                {data.nextBlocker.label} becomes your next blocker — {data.nextBlocker.roles} roles,
                about {data.nextBlocker.weeks} weeks. The roadmap sequences both.
              </p>
              <ButtonLink href="/roadmap" variant="link" className="mt-2">
                See the full roadmap
              </ButtonLink>
            </div>

            <div className="mt-8 hidden lg:block">
              <AssistantEntry className="w-full justify-center" />
            </div>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-[56px] z-20 flex gap-2 border-t border-line bg-surface px-4 py-3 lg:hidden">
        <ButtonLink href="/resume" variant="secondary" size="lg">
          Fix my CV
        </ButtonLink>
        <ButtonLink href="/roadmap" tone="apricot" size="lg" className="flex-1">
          Open the roadmap
        </ButtonLink>
      </div>
    </Page>
  );
}

/**
 * All three types are shown so the classification is legible rather than
 * asserted — but as three columns of text, not three cards.
 */
function GapTypes({
  verdicts,
}: {
  verdicts: Record<GapType, { verdict: string; ruled: "yours" | "out" | "partly" }>;
}) {
  const order: GapType[] = ["knowledge", "proof", "signal"];
  return (
    <div className="border-b border-line pb-5">
      <h2 className="text-section text-ink">Which kind of gap this is</h2>
      <p className="mt-0.5 text-sm text-ink-muted">
        The type decides the fix, and how long it takes.
      </p>
      <div className="mt-4 grid gap-5 sm:grid-cols-3 sm:gap-7">
        {order.map((gap) => {
          const entry = verdicts[gap];
          const mine = entry.ruled === "yours";
          return (
            <div key={gap} className={mine ? "" : "opacity-60"}>
              <p
                className={
                  mine
                    ? "text-body font-semibold text-apricot-text"
                    : "text-body font-medium text-ink"
                }
              >
                {GAP_LABEL[gap]}
              </p>
              <p className="mt-1 text-sm text-ink-body">{GAP_DIAGNOSIS[gap]}</p>
              <p
                className={`mt-1.5 text-sm font-medium ${
                  mine ? "text-apricot-text" : "text-ink-muted"
                }`}
              >
                {entry.verdict}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FixSkeleton() {
  return (
    <Page className="pt-8">
      <Skeleton className="h-[20px] w-[200px]" />
      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <Skeleton className="h-[18px] w-[100px]" />
          <Skeleton className="mt-4 h-[46px] w-[64%]" />
          <Skeleton className="mt-4 h-[18px] w-[86%]" />
          <SkeletonRows rows={3} height={64} className="mt-10" />
        </div>
        <Skeleton className="h-[140px]" />
      </div>
    </Page>
  );
}
