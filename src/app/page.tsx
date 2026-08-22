"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useAssistantSubject } from "@/components/assistant/AssistantProvider";
import { OpportunityDelta } from "@/components/delta/OpportunityDelta";
import { JobPreviewRow } from "@/components/job/JobRow";
import { SearchField } from "@/components/shell/SearchField";
import { TargetSheet } from "@/components/shell/TargetPill";
import { useSetStatusLine } from "@/components/shell/AppShell";
import { Arrow, Button, ButtonLink } from "@/components/ui/Button";
import { Meta, Mono } from "@/components/ui/Chip";
import { PixelIcon, Scenery } from "@/components/ui/PixelIcon";
import { Card, Page, Stack } from "@/components/ui/Surface";
import { Skeleton, SkeletonRows } from "@/components/ui/States";
import { getDelta, getFocus } from "@/lib/api";
import { qk } from "@/lib/api/keys";
import type { Verdict } from "@/lib/api/types";
import { ago } from "@/lib/utils/time";
import { VERDICT_LABEL, VERDICT_TONE } from "@/lib/utils/verdict";

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
    <Page className="pt-10 pb-20 sm:pt-16">
      <Stack>
        {/* The promise, the target, the way in. Nothing else above the fold. */}
        <header className="max-w-[42rem]">
          <h1 className="text-display text-ink">Find what fits. Fix what blocks.</h1>
          <p className="mt-3 text-body text-ink-body">
            REACH checked {data.lastRun.scanned.toLocaleString()} live postings against your
            evidence this morning.
          </p>

          <div className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <Meta>Targeting</Meta>
            <span className="text-body font-medium text-ink">
              {target.role} · {target.location} · {target.modes.join(" · ")}
            </span>
            <Button variant="link" onClick={() => setEditTarget(true)}>
              Change
            </Button>
          </div>

          <SearchField className="mt-4 w-full" size="md" />
        </header>

        {/* Triage: three numbers, three words, no boxes. */}
        <nav aria-label="Today's verdicts" className="-mx-2 flex flex-wrap gap-x-8 gap-y-4">
          {(["apply-now", "one-fix-away", "skip"] as Verdict[]).map((verdict) => (
            <Link
              key={verdict}
              href={`/discover?verdict=${verdict}`}
              className="group flex items-baseline gap-2 rounded-lg px-2 py-1 transition-colors duration-100 hover:bg-surface-sunken"
            >
              <span
                className={`tnum text-[34px] leading-none font-semibold tracking-[-0.03em] ${VERDICT_TONE[verdict].text}`}
              >
                {data.counts[verdict]}
              </span>
              <span className="text-body text-ink-body group-hover:text-ink">
                {VERDICT_LABEL[verdict]}
              </span>
            </Link>
          ))}
        </nav>

        {/* The single most useful next action — the only raised surface on the page. */}
        <Card variant="raised" className="overflow-hidden">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-7">
            <div className="min-w-0 flex-1">
              <p className="text-meta font-medium text-apricot-text">Your biggest blocker</p>
              <h2 className="mt-1.5 text-title text-ink">{data.biggestBlocker.mobileTitle}</h2>
              <p className="mt-2 max-w-[46ch] text-body text-ink-body">
                {data.fastestFix.mobileBody} That opens {delta.data?.gain ?? 8} more roles.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
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
              <div className="shrink-0 sm:w-[196px]">
                <OpportunityDelta delta={delta.data} variant="inline" />
              </div>
            )}
          </div>
        </Card>

        {/* The two lists that matter, three rows each. */}
        <div className="grid gap-10 sm:grid-cols-2 sm:gap-8">
          {(["apply-now", "one-fix-away"] as Verdict[]).map((verdict) => (
            <section key={verdict}>
              <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2.5">
                <h2 className="text-section text-ink">{VERDICT_LABEL[verdict]}</h2>
                <Link
                  href={`/discover?verdict=${verdict}`}
                  className="inline-flex min-h-[36px] items-center text-sm font-medium text-violet-text hover:underline"
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

        {/* Everything below is a single line until you ask for more. */}
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
            href="/profile"
            label={`Evidence ${data.completeness.percent}% complete`}
            detail={data.completeness.note}
            action="Manage"
          />
          <QuietRow
            href="/profile/settings"
            label="Analysis engine"
            detail={`${data.engine.name} · ${data.engine.detail}`}
            action="Settings"
          />
        </div>

        <p className="flex items-center gap-2">
          <PixelIcon name="px-logo" size={13} height={12} className="opacity-40" />
          <Mono>
            Verified {ago(data.lastRun.verifiedAt)} · {data.lastRun.scanned.toLocaleString()} postings
            scanned
          </Mono>
        </p>
      </Stack>

      <TargetSheet open={editTarget} onClose={() => setEditTarget(false)} target={target} />
    </Page>
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
      className="group flex items-center gap-4 border-b border-line py-4 transition-colors duration-100 hover:bg-surface-sunken"
    >
      <span className="w-[220px] shrink-0 text-body font-medium text-ink">{label}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-ink-muted">{detail}</span>
      <span className="shrink-0 text-sm font-medium text-violet-text group-hover:underline">
        {action}
      </span>
    </Link>
  );
}

/* ── States ─────────────────────────────────────────────────────────────── */

/** First run: art leads, one sentence, one action. */
function NoTarget() {
  const [editing, setEditing] = useState(false);
  return (
    <Page width="reading" className="pt-14 pb-20 text-center">
      <div className="relative mx-auto h-[168px] w-full overflow-hidden rounded-2xl">
        <Scenery
          name="horizon"
          width={760}
          height={220}
          className="scenery-mask-b inset-x-0 top-0 opacity-60"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <h1 className="mt-8 text-display text-ink">Find what fits. Fix what blocks.</h1>
      <p className="mx-auto mt-3 max-w-[46ch] text-body text-ink-body">
        Tell us the role and city you are aiming for. We will sort live postings into Apply Now,
        One Fix Away and Skip.
      </p>
      <Button size="lg" className="mt-7" onClick={() => setEditing(true)}>
        Choose your target
        <Arrow />
      </Button>
      <p className="mt-3 text-sm text-ink-muted">Or connect your CV and we will suggest one.</p>
      <TargetSheet open={editing} onClose={() => setEditing(false)} target={null} />
    </Page>
  );
}

function FocusSkeleton() {
  return (
    <Page className="pt-10 sm:pt-16">
      <Skeleton className="h-[42px] w-[70%] max-w-[36rem]" />
      <Skeleton className="mt-4 h-[18px] w-[46%]" />
      <Skeleton className="mt-8 h-[44px] w-full max-w-[42rem]" />
      <Skeleton className="mt-10 h-[36px] w-[60%] max-w-[26rem]" />
      <Skeleton className="mt-10 h-[180px]" />
      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <SkeletonRows rows={4} height={40} />
        <SkeletonRows rows={4} height={40} />
      </div>
    </Page>
  );
}

/** Kept for the "nothing to apply for today" case. */
export function NothingToday() {
  return (
    <div className="py-10 text-center">
      <PixelIcon name="g-empty-nothingtoday" size={64} />
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
