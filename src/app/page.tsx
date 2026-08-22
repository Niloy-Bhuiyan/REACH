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
 * At most 9 top-level surfaces, at most 3 per row, lists show exactly 3 rows plus "see all".
 */
export default function FocusPage() {
  const focus = useQuery({ queryKey: qk.focus, queryFn: getFocus });
  const delta = useQuery({ queryKey: qk.delta("sql"), queryFn: () => getDelta("sql") });

  useSetStatusLine(
    focus.data ? `Verified ${ago(focus.data.lastRun.verifiedAt)}` : null,
  );
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

      <div className="flex flex-col gap-4 px-5 pb-12 sm:gap-[22px] sm:px-8 sm:pt-2 md:px-10 xl:px-16">
        {/* Mobile: three status cards become a tap-through count strip. */}
        <VerdictCountStrip counts={data.counts} className="sm:hidden" />

        <StatusCards data={data} deltaSlot={delta.data} />

        <VerdictCards data={data} />

        {/* Mobile: Roadmap follows the previews — real opportunities sit above the plan. */}
        <RoadmapCard data={data} className="sm:hidden" />

        <div className="grid gap-4 sm:gap-[22px] lg:grid-cols-[2fr_1fr]">
          <ConnectYourWorld data={data} />
          <ProfileCompletion data={data} />
        </div>

        <p className="tnum flex items-center justify-center gap-2 pt-1 font-mono text-[12px] tracking-tight text-ink-muted">
          <PixelIcon name="px-logo" size={16} height={15} />
          Verified {ago(data.lastRun.verifiedAt)} ·{" "}
          {data.lastRun.scanned.toLocaleString()} postings scanned
        </p>
      </div>
    </div>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────────── */

function Hero({ data }: { data: FocusSummary }) {
  return (
    <section className="relative overflow-hidden">
      {/* Scenery is a background layer only, masked to transparent before content begins. */}
      <Scenery
        name="hero-left"
        width={430}
        height={360}
        className="scenery-mask-r bottom-[-22px] left-0 hidden opacity-90 md:block"
      />
      <Scenery
        name="hero-right"
        width={430}
        height={360}
        className="scenery-mask-l right-0 bottom-[-22px] hidden opacity-90 md:block"
      />
      {/* Mobile: one band, masked at the bottom so the navy headline keeps contrast. */}
      <Scenery
        name="horizon-mobile"
        width={390}
        height={178}
        className="scenery-mask-b inset-x-0 top-0 opacity-50 md:hidden"
        style={{ width: "100%", height: 178, objectFit: "cover", objectPosition: "center 30%" }}
      />

      <div className="relative mx-auto flex max-w-[760px] flex-col items-center gap-3.5 px-5 pt-8 pb-6 text-center sm:pt-11 md:h-[316px] md:pt-[46px] md:pb-0">
        <h1 className="font-display text-[34px] leading-none font-extrabold tracking-[-.03em] text-ink sm:text-[52px] md:text-[62px] xl:text-[74px]">
          Your Focus
        </h1>
        <p className="max-w-[60ch] text-[14.5px] leading-relaxed text-ink-body sm:text-[17px]">
          <span className="md:hidden">
            What to apply for now, what is blocking you, what to do next.
          </span>
          <span className="hidden md:inline">
            See what to apply for now, what is blocking you, and what to do next.
          </span>
        </p>
        <TargetPill target={data.target!} compact className="md:[&_span]:whitespace-nowrap" />
        <SearchField className="mt-1 w-full md:w-[660px]" />
      </div>
    </section>
  );
}

/* ── Tier 1 — Biggest blocker · Fastest fix · Roadmap ───────────────────── */

function StatusCards({
  data,
  deltaSlot,
}: {
  data: FocusSummary;
  deltaSlot?: React.ComponentProps<typeof OpportunityDelta>["delta"];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3 sm:gap-[22px]">
      {/* Biggest Blocker — violet is brand and action, never a verdict. */}
      <Card tint="violet" className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <PixelIcon name="px-blocker" size={62} height={72} className="sm:hidden" />
          <PixelIcon name="px-blocker" size={72} height={84} className="hidden sm:block" />
          <div className="min-w-0">
            <Eyebrow tone="violet" className="sm:hidden">
              Biggest blocker
            </Eyebrow>
            <h2 className="font-display text-[21px] leading-tight font-bold text-ink sm:text-[23px]">
              <span className="sm:hidden">{data.biggestBlocker.mobileTitle}</span>
              <span className="hidden sm:inline">{data.biggestBlocker.title}</span>
            </h2>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-body">
              {data.biggestBlocker.body}
            </p>
          </div>
        </div>
        <ButtonLink href={data.biggestBlocker.href} className="mt-auto self-start">
          {data.biggestBlocker.action} <Arrow />
        </ButtonLink>
      </Card>

      {/* Fastest Fix — brand-secondary styling. Sage is Apply Now only. */}
      <Card className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <PixelIcon name="px-wrench" size={62} height={72} className="sm:hidden" />
          <PixelIcon name="px-wrench" size={72} height={84} className="hidden sm:block" />
          <div className="min-w-0">
            <Eyebrow className="sm:hidden">Fastest fix</Eyebrow>
            <h2 className="font-display text-[21px] leading-tight font-bold text-ink sm:text-[23px]">
              <span className="sm:hidden">{data.fastestFix.mobileTitle}</span>
              <span className="hidden sm:inline">{data.fastestFix.title}</span>
            </h2>
            <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-body">
              <span className="sm:hidden">{data.fastestFix.mobileBody}</span>
              <span className="hidden sm:inline">{data.fastestFix.body}</span>
            </p>
          </div>
        </div>

        {/* Mobile: the Delta travels with the fix rather than needing its own card. */}
        {deltaSlot && (
          <OpportunityDelta
            delta={deltaSlot}
            variant="strip"
            afterLabel="after the fix"
            className="sm:hidden"
          />
        )}

        <ButtonLink
          href={data.fastestFix.href}
          variant="secondary"
          className="mt-auto self-start"
        >
          {data.fastestFix.action} <Arrow />
        </ButtonLink>
      </Card>

      {/* Roadmap — apricot is improvement. Desktop keeps it in the status row. */}
      <RoadmapCard data={data} className="hidden sm:flex" />
    </div>
  );
}

function RoadmapCard({ data, className }: { data: FocusSummary; className?: string }) {
  return (
    <Card tint="apricot" className={`flex flex-col gap-3 p-5 sm:p-6 ${className ?? ""}`}>
      <div className="flex items-start gap-4">
        <PixelIcon name="px-map" size={62} height={72} className="sm:hidden" />
        <PixelIcon name="px-map" size={72} height={84} className="hidden sm:block" />
        <div className="min-w-0 flex-1">
          <Eyebrow tone="apricot" className="sm:hidden">
            Your roadmap
          </Eyebrow>
          <h2 className="font-display text-[21px] leading-tight font-bold text-ink sm:text-[23px]">
            <span className="sm:hidden">
              Step {data.roadmap.step} of {data.roadmap.totalSteps}
            </span>
            <span className="hidden sm:inline">View My Roadmap</span>
          </h2>
          <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-body">
            <span className="sm:hidden">{data.roadmap.next}</span>
            <span className="hidden sm:inline">{data.roadmap.body}</span>
          </p>
          <div className="mt-3 flex items-center gap-2.5 sm:hidden">
            <Meter fill={data.roadmap.progress / 100} tone="apricot" label={`${data.roadmap.progress}% complete`} />
            <span className="tnum font-mono text-[12px] text-apricot-text">
              {data.roadmap.progress}%
            </span>
          </div>
        </div>
      </div>
      <ButtonLink href={data.roadmap.href} tone="apricot" className="mt-auto self-start">
        Open Roadmap <Arrow />
      </ButtonLink>
    </Card>
  );
}

/* ── Tier 2 — the three verdict lists ───────────────────────────────────── */

const VERDICT_CARD: Record<
  Verdict,
  { glyph: string; blurb: string; cta: string; href: string }
> = {
  "apply-now": {
    glyph: "px-apply",
    blurb: "Great matches you can apply for today.",
    cta: "Browse More Opportunities",
    href: "/discover?verdict=apply-now",
  },
  "one-fix-away": {
    glyph: "px-onefix",
    blurb: "Unlock more roles with one key improvement.",
    cta: "See More One-Fix Roles",
    href: "/discover?verdict=one-fix-away",
  },
  skip: {
    glyph: "px-skip",
    blurb: "Not a good fit right now.",
    cta: "View More Skipped Roles",
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
              <div className="flex items-start gap-3">
                <PixelIcon name={meta.glyph} size={34} height={34} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-[21px] leading-tight font-bold text-ink">
                    {VERDICT_LABEL[verdict]}
                  </h2>
                  <p className="mt-0.5 text-[13.5px] text-ink-body">{meta.blurb}</p>
                </div>
                {verdict === "apply-now" && (
                  <span className="tnum rounded-md border border-sage-line bg-sage-tint px-2.5 py-1 text-[14px] font-bold text-sage-text">
                    {data.counts[verdict]}
                  </span>
                )}
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
                variant={verdict === "skip" ? "quiet" : "primary"}
                tone={verdict === "apply-now" ? "violet" : verdict === "one-fix-away" ? "apricot" : "terracotta"}
                className="mt-auto pt-0"
              >
                {meta.cta} <Arrow />
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
            <p className="-mt-1.5 text-[13.5px] text-ink-body">
              {verdict === "apply-now"
                ? "All requirements met today."
                : "One item short of a strong fit."}
            </p>
            {data.previews[verdict].slice(0, 2).map((job) => (
              <JobCard key={job.id} job={job} compact />
            ))}
            <Link
              href={VERDICT_CARD[verdict].href}
              className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-control text-[14px] font-semibold text-violet-text"
            >
              See all {data.counts[verdict]} <Arrow />
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

/* ── Tier 3 — connect your world · profile completion ───────────────────── */

function ConnectYourWorld({ data }: { data: FocusSummary }) {
  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">
      <h2 className="font-display text-[21px] leading-tight font-bold text-ink sm:text-[23px]">
        Connect your world. Unlock more.
      </h2>

      <div>
        <div className="flex flex-wrap items-baseline gap-2">
          <Eyebrow tone="sage">Evidence sources</Eyebrow>
          <span className="text-[13px] text-ink-muted">— what we judge your fit from</span>
        </div>
        <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
          {data.sources.map((source) => (
            <IntegrationRow key={source.id} source={source} compact />
          ))}
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-baseline gap-2">
          <Eyebrow tone="violet">Analysis engine</Eyebrow>
          <span className="text-[13px] text-ink-muted">
            — who runs the analysis, never evidence
          </span>
        </div>
        {/* One engine status row. Provider logos live only on Profile → Settings. */}
        <div className="mt-2.5 flex items-center gap-3 rounded-[12px] border border-line bg-surface px-3.5 py-3">
          <PixelIcon name="g-engine" size={26} />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-ink">{data.engine.name}</p>
            <p className="truncate text-[12.5px] text-ink-muted">{data.engine.detail}</p>
          </div>
          <Link
            href="/profile/settings"
            className="min-h-[44px] shrink-0 content-center text-[13.5px] font-semibold text-violet-text hover:underline"
          >
            Change in Settings
          </Link>
        </div>
      </div>

      <p className="text-[13px] leading-relaxed text-ink-muted">
        Evidence sources decide <em className="not-italic font-semibold">what</em> we can prove
        about you. Engines only decide <em className="not-italic font-semibold">who</em> runs the
        analysis — detailed configuration lives in Profile → Settings.
      </p>
    </Card>
  );
}

function ProfileCompletion({ data }: { data: FocusSummary }) {
  const { completeness } = data;
  return (
    <Card className="flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[21px] leading-tight font-bold text-ink sm:text-[23px]">
          Profile <span className="text-violet-text">{completeness.percent}%</span> complete
        </h2>
        <span className="tnum font-mono text-[13px] text-ink-muted">{completeness.percent}%</span>
      </div>

      <Meter
        fill={completeness.percent / 100}
        label={`${completeness.percent} per cent complete`}
        height={8}
      />

      <ul className="grid grid-cols-4 gap-2">
        {completeness.sources.map((source) => (
          <li key={source.label} className="flex flex-col items-center gap-1.5 text-center">
            <span
              className={`flex h-[44px] w-[44px] items-center justify-center rounded-full border ${
                source.state === "connected"
                  ? "border-sage-line bg-sage-tint"
                  : "border-dashed border-apricot-line bg-apricot-tint"
              }`}
            >
              <PixelIcon name={source.icon} size={22} />
            </span>
            <span className="text-[12.5px] font-semibold text-ink">{source.label}</span>
            <span
              className={`text-[12px] ${
                source.state === "connected" ? "text-sage-text" : "text-apricot-text"
              }`}
            >
              {source.state === "connected" ? "Connected" : "Missing"}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
        <p className="min-w-0 flex-1 text-[13px] leading-snug text-ink-body">
          {completeness.note}
        </p>
        <ButtonLink href="/profile">{completeness.action}</ButtonLink>
      </div>
    </Card>
  );
}

/* ── States ─────────────────────────────────────────────────────────────── */

/** 3C — first run. Art leads, one sentence, one action. */
function NoTarget() {
  const [editing, setEditing] = useState(false);
  return (
    <div className="mx-auto w-full max-w-[760px] px-5 pt-6 pb-16">
      <div className="relative h-[178px] overflow-hidden rounded-[16px] md:h-[240px]">
        <Scenery
          name="horizon"
          width={760}
          height={240}
          className="scenery-mask-b bottom-0 left-1/2 -translate-x-1/2 opacity-90"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <div className="mt-6 text-center">
        <h1 className="font-display text-[32px] leading-tight font-extrabold text-ink md:text-[44px]">
          Set a target first
        </h1>
        <p className="mx-auto mt-2 max-w-[52ch] text-[15px] leading-relaxed text-ink-body">
          Tell us the role and city you are aiming for, and we will sort live postings into Apply
          Now, One Fix Away and Skip.
        </p>
        <Button size="lg" className="mt-5" onClick={() => setEditing(true)}>
          Choose your target <Arrow />
        </Button>
        <p className="mt-3 text-[13px] text-ink-muted">
          Or connect your CV and we will suggest one.
        </p>
      </div>
      <TargetSheet open={editing} onClose={() => setEditing(false)} target={null} />
    </div>
  );
}

function FocusSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pt-10 sm:px-8 md:px-10 xl:px-16">
      <div className="mx-auto flex max-w-[760px] flex-col items-center gap-4">
        <Skeleton className="h-[46px] w-[260px] md:h-[70px] md:w-[380px]" />
        <Skeleton className="h-[18px] w-[80%]" />
        <Skeleton className="h-[62px] w-full md:w-[660px]" />
      </div>
      <div className="mt-10 grid gap-[22px] sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[180px]" />
        ))}
      </div>
      <div className="mt-[22px] grid gap-[22px] sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-[14px] border border-line bg-surface p-6">
            <Skeleton className="h-[26px] w-[55%]" />
            <SkeletonRows rows={3} height={44} className="mt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Kept for the "nothing to apply for today" case the DNA names. */
export function NothingToday() {
  return (
    <EmptyState
      glyph="g-empty-nothingtoday"
      title="Nothing to apply for today"
      body="Today's run verified 54 postings and none of them clear your hard requirements yet. The fix below opens 8."
    >
      <ButtonLink href="/one-fix/sql">
        See your top fix <Arrow />
      </ButtonLink>
    </EmptyState>
  );
}
