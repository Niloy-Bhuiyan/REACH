"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useAssistantSubject } from "@/components/assistant/AssistantProvider";
import { OpportunityDelta } from "@/components/delta/OpportunityDelta";
import { ConnectionState, SourceMark } from "@/components/evidence/SourceMark";
import { JobPreviewRow } from "@/components/job/JobRow";
import { SearchField } from "@/components/shell/SearchField";
import { TargetSheet } from "@/components/shell/TargetPill";
import { useSetStatusLine } from "@/components/shell/AppShell";
import { ArchScene, LeafSprig } from "@/components/ui/Brand";
import { Arrow, Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Card, Page, Stack } from "@/components/ui/Surface";
import { Skeleton, SkeletonRows } from "@/components/ui/States";
import { getDelta, getFocus } from "@/lib/api";
import { qk } from "@/lib/api/keys";
import type { Verdict } from "@/lib/api/types";
import { ago } from "@/lib/utils/time";
import { VERDICT_LABEL, VERDICT_TONE } from "@/lib/utils/verdict";

/** One line per verdict, so the three numbers never need a legend. */
const VERDICT_NOTE: Record<Verdict, string> = {
  "apply-now": "Every hard requirement met",
  "one-fix-away": "One requirement short",
  skip: "A blocker you cannot move today",
};

/**
 * Focus answers four questions before anything else earns space: what you are
 * aiming at, what you can apply to now, what you are one fix away from, and the
 * single most useful thing to do next. Everything else waits further down.
 */
export default function FocusPage() {
  const focus = useQuery({ queryKey: qk.focus, queryFn: getFocus });
  const delta = useQuery({ queryKey: qk.delta("sql"), queryFn: () => getDelta("sql") });
  const [editTarget, setEditTarget] = useState(false);

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
  const target = data.target!;

  return (
    <>
      {/* The promise, the target, the way in. Nothing else above the fold. */}
      <section className="relative overflow-hidden">
        <Page className="relative pt-7 pb-2 sm:pt-14">
          <div className="relative grid items-center gap-8 sm:grid-cols-[minmax(0,1fr)_280px] md:grid-cols-[minmax(0,1fr)_340px] lg:grid-cols-[minmax(0,1fr)_400px]">
            <div className="relative z-10 max-w-[34rem]">
              <p className="flex items-center gap-2 text-sm text-brand-text">
                <Icon name="spark" size={16} />
                {data.lastRun.scanned.toLocaleString()} live postings checked{" "}
                {ago(data.lastRun.verifiedAt)}
              </p>

              <h1 className="font-display mt-4 text-[2.5rem] leading-[1.05] text-ink sm:text-[2.625rem] md:text-[3rem] lg:text-hero">
                Find what <span className="text-sage-text">fits.</span>
                <br />
                Fix what <span className="text-terracotta-text">blocks.</span>
              </h1>

              <p className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-body text-ink-body">
                <span className="text-ink-muted">Targeting</span>
                <span className="font-medium text-ink">
                  {target.role} · {target.location} · {target.modes.join(" · ")}
                </span>
                <Button variant="link" onClick={() => setEditTarget(true)}>
                  Change
                </Button>
              </p>
            </div>

            {/* On a phone the valley sits behind the promise, at the right edge,
                exactly as it frames the headline on a wide screen. */}
            <div className="pointer-events-none absolute -top-6 -right-9 z-0 w-[205px] sm:relative sm:inset-auto sm:mx-auto sm:w-full sm:max-w-[380px]">
              <LeafSprig
                side="left"
                className="absolute -left-4 bottom-0 hidden h-[190px] w-[64px] md:block md:-left-6 md:h-[210px] md:w-[74px] lg:-left-10 lg:h-[240px] lg:w-[86px]"
              />
              <LeafSprig
                side="right"
                className="absolute -right-4 bottom-0 hidden h-[190px] w-[64px] md:block md:-right-6 md:h-[210px] md:w-[74px] lg:-right-10 lg:h-[240px] lg:w-[86px]"
              />
              <ArchScene className="relative mx-auto h-[240px] w-full sm:h-[230px] sm:max-w-[240px] md:h-[260px] md:max-w-[290px] lg:h-[300px]" />
            </div>
          </div>

          <SearchField className="mt-8 w-full sm:mt-10" size="lg" />
        </Page>
      </section>

      <Page className="pb-24 sm:pb-20">
        <Stack>
          {/* Triage: three numbers, three words, no boxes. */}
          <nav
            aria-label="Today's verdicts"
            className="grid gap-6 border-y border-line py-7 sm:grid-cols-3 sm:gap-0"
          >
            {(["apply-now", "one-fix-away", "skip"] as Verdict[]).map((verdict, i) => (
              <Link
                key={verdict}
                href={`/discover?verdict=${verdict}`}
                className={`group flex items-baseline gap-4 transition-opacity duration-150 hover:opacity-70 sm:flex-col sm:items-start sm:gap-1 sm:px-7 ${
                  i > 0 ? "sm:border-l sm:border-line" : ""
                } ${i === 0 ? "sm:pl-0" : ""}`}
              >
                <span
                  className={`font-display tnum text-[2.75rem] leading-none ${VERDICT_TONE[verdict].text}`}
                >
                  {data.counts[verdict]}
                </span>
                <span className="min-w-0">
                  <span className="block text-subhead text-ink group-hover:underline">
                    {VERDICT_LABEL[verdict]}
                  </span>
                  <span className="block text-sm text-ink-muted">{VERDICT_NOTE[verdict]}</span>
                </span>
              </Link>
            ))}
          </nav>

          {/* The single most useful next action — the only raised surface on the page. */}
          <Card variant="raised" className="overflow-hidden">
            <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-10 sm:p-8">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-meta font-medium text-apricot-text">
                  <Icon name="wrench" size={14} />
                  Your biggest blocker
                </p>
                <h2 className="font-display mt-2 text-[1.75rem] leading-tight text-ink">
                  {data.biggestBlocker.mobileTitle}
                </h2>
                <p className="mt-2.5 max-w-[46ch] text-body text-ink-body">
                  {data.fastestFix.mobileBody} That opens {delta.data?.gain ?? 8} more roles.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-2.5">
                  <ButtonLink href={data.fastestFix.href} size="lg">
                    See the fix
                    <Arrow />
                  </ButtonLink>
                  <ButtonLink href="/roadmap" variant="ghost" size="lg">
                    Or open the roadmap
                  </ButtonLink>
                </div>
              </div>

              {delta.data && (
                <div className="shrink-0 sm:w-[200px]">
                  <OpportunityDelta delta={delta.data} variant="inline" />
                </div>
              )}
            </div>
          </Card>

          {/* The two lists that matter, three rows each. */}
          <div className="grid gap-10 sm:grid-cols-2 sm:gap-10">
            {(["apply-now", "one-fix-away"] as Verdict[]).map((verdict) => (
              <section key={verdict}>
                <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
                  <h2 className="text-section text-ink">{VERDICT_LABEL[verdict]}</h2>
                  <Link
                    href={`/discover?verdict=${verdict}`}
                    className="inline-flex min-h-[36px] items-center text-sm font-medium text-brand-text hover:underline"
                  >
                    See all {data.counts[verdict]}
                  </Link>
                </div>
                <div className="mt-1.5">
                  {data.previews[verdict].slice(0, 3).map((job) => (
                    <JobPreviewRow key={job.id} job={job} />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Evidence: five marks, five states. Where the verdicts come from. */}
          <section>
            <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
              <h2 className="text-section text-ink">
                Your evidence{" "}
                <span className="tnum ml-1 text-body font-normal text-ink-muted">
                  {data.completeness.percent}% complete
                </span>
              </h2>
              <Link
                href="/profile"
                className="inline-flex min-h-[36px] items-center text-sm font-medium text-brand-text hover:underline"
              >
                Manage
              </Link>
            </div>
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {data.sources.map((source) => (
                <li key={source.id}>
                  <Link
                    href="/profile"
                    className="flex min-h-[44px] items-center gap-2.5 rounded-full border border-line bg-surface py-1.5 pr-2 pl-4 transition-colors duration-150 hover:bg-surface-sunken"
                  >
                    <SourceMark id={source.id} size={17} className="text-ink-body" />
                    <span className="text-sm font-medium text-ink">{source.name}</span>
                    <ConnectionState state={source.state} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {/* Everything else is one line until you ask for more. */}
          <div className="border-t border-line">
            <QuietRow
              href="/discover?verdict=skip"
              label={`${data.counts.skip} skipped`}
              detail={`Hard blockers: ${data.skipBlockers.join(", ")}`}
              action="Review"
            />
            <QuietRow
              href="/roadmap"
              label={`Roadmap · step ${data.roadmap.step} of ${data.roadmap.totalSteps}`}
              detail={data.roadmap.next}
              action="Open"
            />
            <QuietRow
              href="/profile/settings"
              label="Analysis engine"
              detail={`${data.engine.name} · ${data.engine.detail}`}
              action="Settings"
            />
          </div>
        </Stack>

        <TargetSheet open={editTarget} onClose={() => setEditTarget(false)} target={target} />
      </Page>
    </>
  );
}

/** One line, one action. This is what most of the old cards became. */
function QuietRow({
  href,
  label,
  detail,
  action,
}: {
  href: string;
  label: string;
  detail: string;
  action: string;
}) {
  return (
    <Link
      href={href}
      className="group grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 border-b border-line py-4 transition-colors duration-150 hover:bg-row-hover sm:grid-cols-[240px_minmax(0,1fr)_auto]"
    >
      <span className="text-body font-medium text-ink">{label}</span>
      <span className="col-span-2 min-w-0 text-sm text-ink-muted sm:col-span-1 sm:truncate">
        {detail}
      </span>
      <span className="col-start-2 row-start-1 shrink-0 text-sm font-medium text-brand-text group-hover:underline sm:col-start-3">
        {action}
      </span>
    </Link>
  );
}

/* ── States ─────────────────────────────────────────────────────────────── */

/** First run: the illustration leads, one sentence, one action. */
function NoTarget() {
  const [editing, setEditing] = useState(false);
  return (
    <Page width="reading" className="pt-10 pb-24 text-center">
      <ArchScene className="mx-auto h-[220px] w-[190px]" />
      <h1 className="font-display mt-8 text-display text-ink">
        Find what <span className="text-sage-text">fits.</span> Fix what{" "}
        <span className="text-terracotta-text">blocks.</span>
      </h1>
      <p className="mx-auto mt-4 max-w-[46ch] text-body text-ink-body">
        Tell us the role and city you are aiming for. We will sort live postings into Apply Now,
        One Fix Away and Skip.
      </p>
      <Button size="lg" className="mt-7" onClick={() => setEditing(true)}>
        Choose your target
        <Arrow />
      </Button>
      <p className="mt-4 text-sm text-ink-muted">Or connect your CV and we will suggest one.</p>
      <TargetSheet open={editing} onClose={() => setEditing(false)} target={null} />
    </Page>
  );
}

function FocusSkeleton() {
  return (
    <Page className="pt-8 sm:pt-14">
      <Skeleton className="h-[18px] w-[42%] max-w-[22rem]" />
      <Skeleton className="mt-5 h-[104px] w-full max-w-[30rem]" />
      <Skeleton className="mt-6 h-[20px] w-[52%] max-w-[26rem]" />
      <Skeleton className="mt-9 h-[64px] w-full rounded-full" />
      <Skeleton className="mt-12 h-[76px] w-full" />
      <Skeleton className="mt-12 h-[190px]" />
      <div className="mt-12 grid gap-10 sm:grid-cols-2">
        <SkeletonRows rows={4} height={40} />
        <SkeletonRows rows={4} height={40} />
      </div>
    </Page>
  );
}

/** Kept for the "nothing to apply for today" case. */
export function NothingToday() {
  return (
    <div className="py-12 text-center">
      <Icon name="target" size={30} className="mx-auto text-ink-muted" />
      <h3 className="mt-3 text-section text-ink">Nothing to apply for today</h3>
      <p className="mx-auto mt-2 max-w-[42ch] text-body text-ink-body">
        Today&apos;s run verified 54 postings and none clear your hard requirements yet. One fix
        opens 8.
      </p>
      <ButtonLink href="/one-fix/sql" className="mt-5">
        See your top fix
        <Arrow />
      </ButtonLink>
    </div>
  );
}
