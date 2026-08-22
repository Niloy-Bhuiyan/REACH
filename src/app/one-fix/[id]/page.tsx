"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { use } from "react";
import { useAssistantSubject } from "@/components/assistant/AssistantProvider";
import { AssistantEntry } from "@/components/assistant/AssistantSurface";
import { DeltaAudit, OpportunityDelta } from "@/components/delta/OpportunityDelta";
import { GapTypeBadge, GapTypeRow } from "@/components/gap/GapTypeBadge";
import { useSetStatusLine } from "@/components/shell/AppShell";
import { Arrow, ButtonLink } from "@/components/ui/Button";
import { Chip, Mono } from "@/components/ui/Chip";
import { PixelIcon, Scenery } from "@/components/ui/PixelIcon";
import { Card, SectionHead } from "@/components/ui/Surface";
import { Skeleton, SkeletonRows } from "@/components/ui/States";
import { getDelta, getFix, getLatestRun } from "@/lib/api";
import { qk } from "@/lib/api/keys";
import { ago, closingDate, daysUntil } from "@/lib/utils/time";
import { GAP_LABEL, VERDICT_LABEL } from "@/lib/utils/verdict";

/**
 * The signature screen. It names the exact blocker, types the gap, states the smallest useful
 * intervention, and proves the Opportunity Delta by listing every posting it is counted from.
 * Narrative density: one large object, a scenery bookend at 50% opacity, section glyphs.
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
    <div className="relative mx-auto w-full max-w-[1440px] px-5 pb-28 sm:px-8 md:px-10 md:pb-14 xl:px-16">
      {/* Narrative density: a 50%-opacity scenery bookend behind the header only. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[220px] overflow-hidden">
        <Scenery
          name="horizon-right"
          width={520}
          height={220}
          className="scenery-mask-l top-0 right-0 opacity-50"
        />
      </div>

      <header className="relative pt-5">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/jobs/${data.jobId}`}
            className="min-h-[44px] content-center text-[13.5px] font-semibold text-violet-text hover:underline"
          >
            ← Back to {data.jobRole} · {data.jobCompany}
          </Link>
          <Mono className="hidden sm:inline">
            Fix {data.indexInRun} of {data.runFixCount} identified in today&apos;s run
          </Mono>
          <div className="ml-auto hidden sm:block">
            <AssistantEntry />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-start gap-5">
          <PixelIcon name="px-wrench" size={78} height={90} className="md:hidden" />
          <PixelIcon name="px-wrench" size={86} height={96} className="hidden md:block" />
          <div className="min-w-0 flex-1">
            <GapTypeBadge gap={data.gapType} size="md" />
            <p className="mt-2 max-w-[70ch] text-[15px] leading-relaxed text-ink-body">
              {data.eyebrow}
            </p>
            {/* The blocker is the headline. The user knows what to do before scrolling. */}
            <h1 className="mt-1.5 font-display text-[34px] leading-[1.05] font-extrabold tracking-[-.03em] text-ink sm:text-[44px] xl:text-[52px]">
              {data.headline}
            </h1>
            <p className="mt-3 max-w-[76ch] text-[15px] leading-relaxed text-ink-body">
              {data.body}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <ButtonLink href="/roadmap" tone="apricot" size="lg">
                Open the roadmap <Arrow />
              </ButtonLink>
              <ButtonLink href="/resume" variant="secondary" size="lg">
                Fix my CV wording now
              </ButtonLink>
              <span className="text-[13px] text-ink-muted">
                {GAP_LABEL[data.gapType]}s are usually a CV job, not a course.
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,352px)]">
        <div className="min-w-0 space-y-6">
          {/* All three gap types are shown; two are explicitly ruled out. */}
          <section>
            <SectionHead
              glyph="px-onefix"
              title="Which kind of gap this is"
              detail="The type decides the fix — and how long it takes"
            />
            <GapTypeRow verdicts={data.gapTypeVerdicts} className="mt-3" />
          </section>

          {/* Each step names its artefact and its hours. */}
          <section>
            <SectionHead
              glyph="px-wrench"
              title="The smallest useful fix"
              detail="Three steps · each produces something an employer can see"
              action={<Chip tone="apricot" mono>{`~${data.totalHours} hours total`}</Chip>}
            />
            <ol className="mt-3 flex flex-col gap-2">
              {data.steps.map((step) => (
                <li
                  key={step.n}
                  className="flex gap-4 rounded-[14px] border border-line bg-surface p-4"
                >
                  <span className="tnum flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full border border-apricot-line bg-apricot-tint font-display text-[16px] font-bold text-apricot-text">
                    {step.n}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-snug font-semibold text-ink">{step.title}</p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-ink-body">
                      {step.detail}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Chip tone="sage">Produces: {step.produces}</Chip>
                      <Mono>~{step.hours} h</Mono>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[13.5px] leading-relaxed text-ink-body">
              {data.noCourseNote}{" "}
              <Link href="/roadmap" className="font-semibold text-violet-text hover:underline">
                See certificate verdict →
              </Link>
            </p>
          </section>

          {/* Affected jobs are a real table, every row clickable back into Job Detail. */}
          {delta.data && (
            <section>
              <SectionHead
                glyph="px-apply"
                title={`The ${delta.data.gain} roles this unlocks`}
                detail="Every posting where this is the only unmet requirement"
                action={<Mono>From today&apos;s run</Mono>}
              />
              <div className="mt-3 overflow-hidden rounded-[14px] border border-line bg-surface">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-table-head">
                      {["Role", "Other reqs", "Source · verified", "After the fix"].map((head, i) => (
                        <th
                          key={head}
                          scope="col"
                          className={`px-4 py-2 text-[11.5px] font-bold tracking-[.1em] text-ink-muted uppercase ${
                            i === 2 ? "hidden md:table-cell" : ""
                          } ${i === 3 ? "text-right" : ""}`}
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {delta.data.affected.map((job) => (
                      <tr
                        key={job.jobId}
                        className="border-t border-hairline transition-colors duration-100 hover:bg-row-hover"
                      >
                        <td className="px-4 py-3 align-top">
                          <Link
                            href={`/jobs/${job.jobId}`}
                            className="text-[14.5px] font-semibold text-ink-link hover:underline"
                          >
                            {job.role}
                          </Link>
                          <p className="mt-0.5 text-[13px] text-ink-body">
                            {job.company} · {job.location}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Chip tone="sage">{job.otherRequirements}</Chip>
                        </td>
                        <td className="hidden px-4 py-3 align-top md:table-cell">
                          <Mono>
                            {job.source.replace("-", " ")} · {ago(job.verifiedAt)}
                          </Mono>
                          <br />
                          <Mono
                            className={
                              daysUntil(job.closesAt) <= 10 ? "text-apricot-text" : undefined
                            }
                          >
                            Closes {closingDate(job.closesAt)}
                          </Mono>
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          <Chip tone="sage">→ {VERDICT_LABEL[job.verdictAfter]}</Chip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2.5 text-[13.5px] text-ink-body">
                {delta.data.affected.filter((job) => daysUntil(job.closesAt) <= 10).length} of the{" "}
                {delta.data.gain} close in under 10 days — those are worth doing first.
              </p>
            </section>
          )}

          {/* Evidence for the classification, so "signal gap" is checkable. */}
          <section>
            <SectionHead glyph="px-github" title="Evidence we already have" />
            <ul className="mt-3 flex flex-col gap-2">
              {data.classificationEvidence.map((row) => (
                <li
                  key={row.title}
                  className="flex items-start gap-3 rounded-[12px] border border-line bg-surface p-3.5"
                >
                  <PixelIcon name={row.icon} size={24} />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold text-ink">{row.title}</span>
                    <span className="block text-[13px] text-ink-body">{row.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-body">
              This is why we call it a {GAP_LABEL[data.gapType].toLowerCase()} and not a knowledge
              gap — the work exists in your own sources.
            </p>
          </section>
        </div>

        {/* Rail — the Delta, audited on the page. */}
        <aside className="flex min-w-0 flex-col gap-4">
          {delta.data && (
            <>
              <OpportunityDelta
                delta={delta.data}
                eyebrow="Opportunity Delta"
                nowLabel="reachable now"
                afterLabel="after this fix"
              />
              <p className="tnum -mt-2 font-mono text-[11.5px] tracking-tight text-ink-muted uppercase">
                Counted, not predicted · {delta.data.now} of {delta.data.audit.verified} today ·{" "}
                {delta.data.after} of {delta.data.audit.verified} after
              </p>
              <DeltaAudit delta={delta.data} />
            </>
          )}

          <Card tint="apricot" className="p-4">
            <div className="flex items-center gap-2.5">
              <PixelIcon name="px-map" size={26} />
              <h3 className="font-display text-[17px] font-bold text-ink">Next after this</h3>
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-body">
              Close this and {data.nextBlocker.label} becomes your next blocker —{" "}
              {data.nextBlocker.roles} roles, a genuine {GAP_LABEL[data.nextBlocker.gapType].toLowerCase()},
              about {data.nextBlocker.weeks} weeks. The roadmap sequences both.
            </p>
            <ButtonLink href="/roadmap" tone="apricot" full className="mt-3">
              See the full roadmap <Arrow />
            </ButtonLink>
          </Card>

          <div className="sm:hidden">
            <AssistantEntry className="w-full justify-center" />
          </div>
        </aside>
      </div>

      {/* Mobile sticky bar: the CV shortcut and the roadmap primary. */}
      <div className="fixed inset-x-0 bottom-[58px] z-20 flex gap-2 border-t border-line bg-surface px-4 py-3 shadow-tier3 md:hidden">
        <ButtonLink href="/resume" variant="secondary" size="lg" className="flex-1">
          Fix my CV
        </ButtonLink>
        <ButtonLink href="/roadmap" tone="apricot" size="lg" className="flex-[1.4]">
          Open the roadmap <Arrow />
        </ButtonLink>
      </div>
    </div>
  );
}

function FixSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pt-8 sm:px-8 md:px-10 xl:px-16">
      <Skeleton className="h-[20px] w-[240px]" />
      <div className="mt-5 flex gap-5">
        <Skeleton className="h-[96px] w-[86px]" />
        <div className="flex-1">
          <Skeleton className="h-[22px] w-[160px]" />
          <Skeleton className="mt-3 h-[52px] w-[70%]" />
          <Skeleton className="mt-3 h-[18px] w-[90%]" />
        </div>
      </div>
      <SkeletonRows rows={3} height={110} className="mt-8" />
    </div>
  );
}
