"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useAssistantSubject } from "@/components/assistant/AssistantProvider";
import { OpportunityDelta } from "@/components/delta/OpportunityDelta";
import { IntegrationRow } from "@/components/evidence/EvidenceRow";
import { JobCard, JobPreviewRow } from "@/components/job/JobRow";
import { SearchField } from "@/components/shell/SearchField";
import { TargetPill, TargetSheet } from "@/components/shell/TargetPill";
import { useSetStatusLine } from "@/components/shell/AppShell";
import { Arrow, Button, ButtonLink } from "@/components/ui/Button";
import { Disclosure } from "@/components/ui/Disclosure";
import { Meter } from "@/components/ui/Meter";
import { PixelIcon, Scenery } from "@/components/ui/PixelIcon";
import { Card, Eyebrow, Hairline } from "@/components/ui/Surface";
import { EmptyState, Skeleton, SkeletonRows } from "@/components/ui/States";
import { VerdictCountStrip } from "@/components/verdict/VerdictBadge";
import { getDelta, getFocus } from "@/lib/api";
import { qk } from "@/lib/api/keys";
import type { FocusSummary, Verdict } from "@/lib/api/types";
import { ago } from "@/lib/utils/time";
import { VERDICT_LABEL, VERDICT_TONE } from "@/lib/utils/verdict";

/**
 * Focus — Summary Mode. Orient and route: answer five questions in five seconds.
 *
 * The blocker and the fix are one story, so they are one card. Everything the
 * screen used to explain twice — what a verdict list is, what an evidence source
 * is for — it now says once, or defers.
 */
export default function FocusPage() {
  const focus = useQuery({ queryKey: qk.focus, queryFn: getFocus });
  const delta = useQuery({ queryKey: qk.delta("sql"), queryFn: () => getDelta("sql") });

  useSetStatusLine(focus.data ? `Verified ${ago(focus.data.lastRun.verifiedAt)}` : null);
  useAssistantSubject({
    scope: "profile",
    id: null,
    label: "Ask REACH",
    subject: "Your focus · today's run",
  });

  if (focus.isLoading || !focus.data) return <FocusSkeleton />;
  if (!focus.data.target) return <NoTarget />;

  const data = focus.data;

  return (
    <div className="mx-auto w-full max-w-[1440px]">
      <Hero data={data} />

      <div className="flex flex-col gap-4 px-5 pt-4 pb-12 sm:gap-[22px] sm:px-8 sm:pt-6 md:px-10 xl:px-16">
        {/* Mobile: three status cards become a tap-through count strip. */}
        <VerdictCountStrip counts={data.counts} className="sm:hidden" />

        <NextMove data={data} deltaSlot={delta.data} />

        <VerdictCards data={data} />

        {/* Mobile: Roadmap follows the previews — real opportunities sit above the plan. */}
        <RoadmapCard data={data} className="sm:hidden" />

        <EvidenceCard data={data} />
      </div>
    </div>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────────── */

function Hero({ data }: { data: FocusSummary }) {
  return (
    <section className="relative overflow-hidden">
      {/*
        Scenery is a background layer only, masked to transparent before content begins.
        hero-left / hero-right are opaque screenshot crops with the old UI baked into the
        artwork — the clean true-alpha pair is horizon-left / horizon-right.
      */}
      <Scenery
        name="horizon-left"
        width={352}
        height={250}
        className="scenery-mask-r bottom-0 left-0 hidden opacity-90 md:block"
      />
      <Scenery
        name="horizon-right"
        width={352}
        height={250}
        className="scenery-mask-l right-0 bottom-0 hidden opacity-90 md:block"
      />
      {/*
        Mobile: one band, masked at the bottom so the navy headline keeps contrast.
        Built from the two clean halves — horizon-mobile.png is another opaque crop
        with a line of the old UI baked across its top edge.
      */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[178px] overflow-hidden md:hidden"
      >
        <Scenery
          name="horizon-left"
          width={352}
          height={250}
          className="scenery-mask-b top-0 left-0 opacity-55"
          style={{ width: "58%", height: 178, objectFit: "cover", objectPosition: "left bottom" }}
        />
        <Scenery
          name="horizon-right"
          width={352}
          height={250}
          className="scenery-mask-b top-0 right-0 opacity-55"
          style={{ width: "58%", height: 178, objectFit: "cover", objectPosition: "right bottom" }}
        />
      </span>

      <div className="relative mx-auto flex max-w-[760px] flex-col items-center gap-3.5 px-5 pt-8 pb-8 text-center sm:pt-11 md:pt-[46px] md:pb-11">
        <h1 className="font-display text-[34px] leading-none font-extrabold tracking-[-.03em] text-ink sm:text-[52px] md:text-[62px] xl:text-[74px]">
          Your Focus
        </h1>
        <p className="max-w-[60ch] text-[14.5px] leading-relaxed text-ink-body sm:text-[17px]">
          What to apply for now, what is blocking you, what to do next.
        </p>
        <TargetPill target={data.target!} compact className="md:[&_span]:whitespace-nowrap" />
        <SearchField className="mt-1 w-full md:w-[660px]" />
      </div>
    </section>
  );
}

/* ── Tier 1 — one blocker, one fix, one plan ────────────────────────────── */

/**
 * The blocker and the fastest fix were two cards telling one story: the same
 * skill, the same roles, the same action. They are one card now, and the
 * roadmap keeps its own because it is a different destination.
 */
function NextMove({
  data,
  deltaSlot,
}: {
  data: FocusSummary;
  deltaSlot?: React.ComponentProps<typeof OpportunityDelta>["delta"];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3 sm:gap-[22px]">
      <Card tint="violet" className="flex flex-col gap-4 p-5 sm:col-span-2 sm:p-6">
        <div className="flex items-start gap-4">
          <PixelIcon name="px-blocker" size={62} height={72} className="sm:hidden" />
          <PixelIcon name="px-blocker" size={72} height={84} className="hidden sm:block" />
          <div className="min-w-0">
            <Eyebrow tone="violet">Your biggest blocker</Eyebrow>
            <h2 className="mt-0.5 font-display text-[21px] leading-tight font-bold text-ink sm:text-[25px]">
              {data.biggestBlocker.mobileTitle}
            </h2>
            <p className="mt-1.5 max-w-[52ch] text-[14.5px] leading-relaxed text-ink-body">
              {data.fastestFix.mobileBody}
            </p>
          </div>
        </div>

        {deltaSlot && (
          <OpportunityDelta delta={deltaSlot} variant="strip" afterLabel="after the fix" />
        )}

        <div className="mt-auto flex flex-wrap items-center gap-2.5">
          <ButtonLink href={data.fastestFix.href}>
            {data.fastestFix.action} <Arrow />
          </ButtonLink>
          <ButtonLink href={data.biggestBlocker.href} variant="quiet">
            See what is missing
          </ButtonLink>
        </div>
      </Card>

      <RoadmapCard data={data} className="hidden sm:flex" />
    </div>
  );
}

function RoadmapCard({ data, className }: { data: FocusSummary; className?: string }) {
  return (
    <Card tint="apricot" className={`flex flex-col gap-3 p-5 sm:p-6 ${className ?? ""}`}>
      <div className="flex items-start gap-4">
        <PixelIcon name="px-map" size={62} height={72} className="sm:hidden" />
        <PixelIcon name="px-map" size={64} height={74} className="hidden sm:block" />
        <div className="min-w-0 flex-1">
          <Eyebrow tone="apricot">Your roadmap</Eyebrow>
          <h2 className="mt-0.5 font-display text-[21px] leading-tight font-bold text-ink sm:text-[23px]">
            Step {data.roadmap.step} of {data.roadmap.totalSteps}
          </h2>
          <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-body">{data.roadmap.next}</p>
          <div className="mt-3 flex items-center gap-2.5">
            <Meter
              fill={data.roadmap.progress / 100}
              tone="apricot"
              label={`${data.roadmap.progress}% complete`}
            />
            <span className="tnum font-mono text-[12px] text-apricot-text">
              {data.roadmap.progress}%
            </span>
          </div>
        </div>
      </div>
      <ButtonLink href={data.roadmap.href} tone="apricot" className="mt-auto self-start">
        Open roadmap
      </ButtonLink>
    </Card>
  );
}

/* ── Tier 2 — the three verdict lists ───────────────────────────────────── */

/**
 * The glyph, the word and the count say what each list is. The sentence that
 * used to sit under every heading said it a second time, so it is gone.
 */
const VERDICT_CARD: Record<Verdict, { glyph: string; cta: string; href: string }> = {
  "apply-now": {
    glyph: "px-apply",
    cta: "Browse all opportunities",
    href: "/discover?verdict=apply-now",
  },
  "one-fix-away": {
    glyph: "px-onefix",
    cta: "See all one-fix roles",
    href: "/discover?verdict=one-fix-away",
  },
  skip: {
    glyph: "px-skip",
    cta: "Review skipped roles",
    href: "/discover?verdict=skip",
  },
};

function VerdictCards({ data }: { data: FocusSummary }) {
  return (
    <>
      {/* Desktop: three equal-height cards, CTAs pinned to the bottom edge. */}
      <div className="hidden gap-[22px] sm:grid sm:grid-cols-3">
        {(["apply-now", "one-fix-away", "skip"] as Verdict[]).map((verdict) => {
          const meta = VERDICT_CARD[verdict];
          const tone = VERDICT_TONE[verdict];
          const jobs = data.previews[verdict];

          return (
            <Card
              key={verdict}
              className="relative flex flex-col overflow-hidden p-5 sm:p-6"
              tier={verdict === "apply-now" ? 2 : 1}
            >
              {verdict === "apply-now" && (
                <span aria-hidden className={`absolute inset-x-0 top-0 h-[3px] ${tone.rule}`} />
              )}
              <div className="flex items-center gap-3">
                <PixelIcon name={meta.glyph} size={34} height={34} />
                <h2 className="min-w-0 flex-1 font-display text-[21px] leading-tight font-bold text-ink">
                  {VERDICT_LABEL[verdict]}
                </h2>
                <span
                  className={`tnum rounded-md border px-2.5 py-1 text-[14px] font-bold ${tone.tint} ${tone.line} ${tone.text}`}
                >
                  {data.counts[verdict]}
                </span>
              </div>

              <div className="mt-3 flex flex-col">
                {jobs.map((job, i) => (
                  <div key={job.id}>
                    {i > 0 && <Hairline />}
                    <JobPreviewRow job={job} />
                  </div>
                ))}
              </div>

              <ButtonLink
                href={meta.href}
                full
                variant={verdict === "apply-now" ? "primary" : "quiet"}
                tone={
                  verdict === "apply-now"
                    ? "violet"
                    : verdict === "one-fix-away"
                      ? "apricot"
                      : "terracotta"
                }
                className="mt-auto pt-0"
              >
                {meta.cta}
              </ButtonLink>
            </Card>
          );
        })}
      </div>

      {/* Mobile: two rows + "see all n", then Skip collapses to one review row. */}
      <div className="flex flex-col gap-4 sm:hidden">
        {(["apply-now", "one-fix-away"] as Verdict[]).map((verdict) => (
          <section key={verdict} className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <PixelIcon name={VERDICT_CARD[verdict].glyph} size={28} />
              <h2 className="flex-1 font-display text-[19px] font-bold text-ink">
                {VERDICT_LABEL[verdict]}
              </h2>
              <span
                className={`tnum rounded-md border px-2 py-0.5 text-[13px] font-bold ${VERDICT_TONE[verdict].tint} ${VERDICT_TONE[verdict].line} ${VERDICT_TONE[verdict].text}`}
              >
                {data.counts[verdict]}
              </span>
            </div>
            {data.previews[verdict].slice(0, 2).map((job) => (
              <JobCard key={job.id} job={job} compact />
            ))}
            <Link
              href={VERDICT_CARD[verdict].href}
              className="flex min-h-[44px] items-center justify-center rounded-[10px] border-[1.5px] border-control text-[14px] font-semibold text-violet-text"
            >
              See all {data.counts[verdict]}
            </Link>
          </section>
        ))}

        {/* Nothing is hidden — the count and the three blockers stay visible. */}
        <Link
          href="/discover?verdict=skip"
          className="flex items-center gap-3 rounded-[12px] border border-terracotta-line bg-terracotta-tint p-3.5"
        >
          <PixelIcon name="px-skip" size={28} />
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-bold text-ink">
              Skip · {data.counts.skip} roles
            </span>
            <span className="block truncate text-[13px] text-terracotta-text">
              Hard blockers: {data.skipBlockers.join(", ")}
            </span>
          </span>
          <span className="shrink-0 text-[13.5px] font-semibold text-terracotta-text">Review</span>
        </Link>
      </div>
    </>
  );
}

/* ── Tier 3 — one evidence card ─────────────────────────────────────────── */

/**
 * Evidence and profile completeness were two cards listing the same five
 * sources. They are one card: the reading, the five sources once, the engine,
 * and the distinction between the two deferred to a disclosure.
 */
function EvidenceCard({ data }: { data: FocusSummary }) {
  const { completeness } = data;

  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="font-display text-[21px] leading-tight font-bold text-ink sm:text-[23px]">
          Your evidence <span className="text-violet-text">{completeness.percent}%</span> complete
        </h2>
        <ButtonLink href="/profile" variant="secondary">
          {completeness.action}
        </ButtonLink>
      </div>

      <Meter
        fill={completeness.percent / 100}
        label={`${completeness.percent} per cent complete`}
        height={8}
      />
      <p className="-mt-1 text-[13.5px] leading-relaxed text-ink-body">{completeness.note}</p>

      <div className="grid gap-2 sm:grid-cols-3">
        {data.sources.map((source) => (
          <IntegrationRow key={source.id} source={source} compact />
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-[12px] border border-line bg-surface px-3.5 py-3">
        <PixelIcon name="g-engine" size={26} />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-ink">{data.engine.name}</p>
          <p className="truncate text-[12.5px] text-ink-muted">{data.engine.detail}</p>
        </div>
        <Link
          href="/profile/settings"
          className="min-h-[44px] shrink-0 content-center text-[13.5px] font-semibold text-violet-text hover:underline"
        >
          Settings
        </Link>
      </div>

      <Disclosure label="Sources and engines are different things" className="-mb-2">
        <p className="max-w-[70ch] pt-1 text-[13.5px] leading-relaxed text-ink-body">
          Evidence sources decide <span className="font-semibold">what</span> we can prove about
          you — every verdict cites one. The analysis engine only decides{" "}
          <span className="font-semibold">who</span> runs the reasoning; it never becomes evidence,
          and swapping it never changes an eligibility verdict.
        </p>
      </Disclosure>
    </Card>
  );
}

/* ── States ─────────────────────────────────────────────────────────────── */

function NoTarget() {
  const [editing, setEditing] = useState(false);
  return (
    <div className="mx-auto w-full max-w-[760px] px-5 pt-10 pb-16">
      <EmptyState
        glyph="g-empty-notarget"
        title="Tell us what you are aiming for"
        body="Pick a role and a city and REACH will sort today's live postings into Apply Now, One Fix Away and Skip."
      >
        <Button size="lg" onClick={() => setEditing(true)}>
          Choose your target <Arrow />
        </Button>
        <p className="text-[13px] text-ink-muted">Or connect your CV and we will suggest one.</p>
      </EmptyState>
      <TargetSheet open={editing} onClose={() => setEditing(false)} target={null} />
    </div>
  );
}

function FocusSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pt-10 sm:px-8 md:px-10 xl:px-16">
      <Skeleton className="mx-auto h-[56px] w-[280px] sm:h-[74px] sm:w-[420px]" />
      <Skeleton className="mx-auto mt-4 h-[20px] w-[70%] max-w-[460px]" />
      <Skeleton className="mx-auto mt-5 h-[52px] w-full max-w-[660px]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-[22px]">
        <Skeleton className="h-[210px] sm:col-span-2" />
        <Skeleton className="h-[210px]" />
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3 sm:gap-[22px]">
        <SkeletonRows rows={4} height={44} />
        <SkeletonRows rows={4} height={44} />
        <SkeletonRows rows={4} height={44} />
      </div>
    </div>
  );
}
