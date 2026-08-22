"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useAssistantSubject } from "@/components/assistant/AssistantProvider";
import { AssistantEntry } from "@/components/assistant/AssistantSurface";
import { OpportunityDelta } from "@/components/delta/OpportunityDelta";
import { IntegrationRow } from "@/components/evidence/EvidenceRow";
import { ActiveFilterChips, FilterBar, FilterSheet } from "@/components/filters/FilterBar";
import { JobCard, JobRow } from "@/components/job/JobRow";
import { RunConsole, RunStats, RunSummaryLine } from "@/components/run/RunConsole";
import { useSetStatusLine } from "@/components/shell/AppShell";
import { SearchField } from "@/components/shell/SearchField";
import { TargetPill } from "@/components/shell/TargetPill";
import { Button } from "@/components/ui/Button";
import { Chip, Mono } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Controls";
import { Sheet, SheetGrip } from "@/components/ui/Overlay";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { Disclosure } from "@/components/ui/Disclosure";
import { Card, Eyebrow, Hairline } from "@/components/ui/Surface";
import { EmptyState, ErrorNotice, Skeleton, SkeletonRows, StaleNotice } from "@/components/ui/States";
import {
  failRun,
  getDelta,
  getFocus,
  getLatestRun,
  getRun,
  listFixes,
  listJobs,
  reverifyJob,
  startRun,
  stopRun,
} from "@/lib/api";
import { qk } from "@/lib/api/keys";
import type { DiscoveryRun, JobQuery, Verdict } from "@/lib/api/types";
import { useIsMobile } from "@/lib/hooks";
import { ago } from "@/lib/utils/time";
import { VERDICT_LABEL, VERDICT_ORDER, VERDICT_SHORT, VERDICT_TONE } from "@/lib/utils/verdict";

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverSkeleton />}>
      <Discover />
    </Suspense>
  );
}

/* ── Screen ─────────────────────────────────────────────────────────────── */

function Discover() {
  const params = useSearchParams();
  const router = useRouter();
  const client = useQueryClient();
  const isMobile = useIsMobile();

  const query = useMemo<JobQuery>(
    () => ({
      q: params.get("q") ?? undefined,
      verdict: (params.get("verdict") as Verdict | null) ?? "all",
      location: params.get("location") ?? undefined,
      mode: (params.get("mode") as JobQuery["mode"]) ?? undefined,
      employment: (params.get("employment") as JobQuery["employment"]) ?? undefined,
      postedWithinDays: params.get("posted") ? Number(params.get("posted")) : undefined,
      savedOnly: params.get("saved") === "true" || undefined,
      sort: (params.get("sort") as JobQuery["sort"]) ?? "best-fit",
    }),
    [params],
  );

  const patchQuery = useCallback(
    (patch: Partial<JobQuery>) => {
      const next = new URLSearchParams(params.toString());
      const map: Record<string, string> = {
        q: "q",
        verdict: "verdict",
        location: "location",
        mode: "mode",
        employment: "employment",
        postedWithinDays: "posted",
        savedOnly: "saved",
        sort: "sort",
      };
      for (const [key, value] of Object.entries(patch)) {
        const param = map[key] ?? key;
        if (value === undefined || value === null || value === "" || value === "all")
          next.delete(param);
        else next.set(param, String(value));
      }
      router.replace(`/discover?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  /* Run state lives in the query cache, so navigating to a job never loses it. */
  const latest = useQuery({ queryKey: qk.latestRun, queryFn: getLatestRun });
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [failed, setFailed] = useState<DiscoveryRun | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [logOpen, setLogOpen] = useState(false);
  const [filterSheet, setFilterSheet] = useState(false);

  const active = useQuery({
    queryKey: qk.run(activeRunId ?? ""),
    queryFn: () => getRun(activeRunId!),
    enabled: !!activeRunId,
    refetchInterval: (q) => {
      const data = q.state.data as DiscoveryRun | undefined;
      // Events land at least 300 ms apart, per the console motion spec.
      return data && data.status === "running" ? 700 : false;
    },
  });

  // A completed run becomes authoritative: refresh what reads from it.
  const completedRunId = active.data?.status === "complete" ? active.data.id : null;
  useEffect(() => {
    if (!completedRunId) return;
    void client.invalidateQueries({ queryKey: qk.latestRun });
    void client.invalidateQueries({ queryKey: ["jobs"] });
  }, [completedRunId, client]);

  const start = useMutation({
    mutationFn: startRun,
    onSuccess: (run) => {
      setFailed(null);
      setConsoleOpen(true);
      setActiveRunId(run.id);
    },
  });

  const stop = useMutation({
    mutationFn: () => stopRun(activeRunId!),
    // A cancelled run writes no Delta and updates no count.
    onSuccess: () => setActiveRunId(null),
  });

  const fail = useMutation({
    mutationFn: () => failRun(activeRunId ?? latest.data?.id ?? "x"),
    onSuccess: (run) => {
      setActiveRunId(null);
      setFailed(run);
    },
  });

  // 12B is reachable at /discover?state=failed — a URL, not a control the design never drew.
  const wantFailed = params.get("state") === "failed";
  useEffect(() => {
    if (wantFailed) fail.mutate();
    // The mutation identity is stable for this screen; re-running on it would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wantFailed]);

  const jobs = useQuery({ queryKey: qk.jobs(query), queryFn: () => listJobs(query) });
  const delta = useQuery({ queryKey: qk.delta("sql"), queryFn: () => getDelta("sql") });
  const fixes = useQuery({ queryKey: qk.fixes, queryFn: listFixes });
  const focus = useQuery({ queryKey: qk.focus, queryFn: getFocus });

  const reverify = useMutation({
    mutationFn: reverifyJob,
    onSuccess: () => void client.invalidateQueries({ queryKey: ["jobs"] }),
  });

  const run = active.data ?? latest.data;
  const running = !!activeRunId && active.data?.status === "running";

  useSetStatusLine(
    running
      ? "Run in progress"
      : run?.completedAt
        ? `Verified ${ago(run.completedAt)}`
        : null,
  );
  useAssistantSubject({
    scope: "discover",
    id: null,
    label: "Ask about this run",
    subject: `Today's run · ${jobs.data?.total ?? 0} opportunities`,
  });

  const savedCount = focus.data ? 4 : 0;
  const total = jobs.data?.total ?? 0;
  const counts = jobs.data?.counts;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-14 sm:px-8 md:px-10 xl:px-16">
      {/* Working Mode: a compact page header, not a hero. */}
      <header className="flex flex-col gap-3 pt-5 pb-4 sm:pt-7">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <PixelIcon name="px-apply" size={30} height={30} />
          <h1 className="font-display text-[26px] leading-tight font-extrabold text-ink sm:text-[32px]">
            Live Discovery
          </h1>
          {!running && counts && (
            <span className="tnum rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-[13px] text-ink-body">
              {total} opportunities
            </span>
          )}
          <div className="ml-auto hidden sm:block">
            <AssistantEntry />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {focus.data?.target && <TargetPill target={focus.data.target} compact />}
        </div>

        <SearchField
          defaultValue={query.q ?? ""}
          size="md"
          className="w-full max-w-[720px]"
        />
      </header>

      {/* Toolbar: 4 controls + "More filters · n" + sort + saved. */}
      <div className="sticky top-0 z-20 -mx-5 border-b border-line bg-canvas/95 px-5 py-2.5 backdrop-blur sm:top-[72px] sm:-mx-8 sm:px-8 md:-mx-10 md:px-10 xl:-mx-16 xl:px-16">
        <FilterBar query={query} onChange={patchQuery} savedCount={savedCount} />
        <ActiveFilterChips query={query} onChange={patchQuery} className="mt-2" />
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_372px]">
        <div className="min-w-0">
          {/* 12B — a failed run keeps the last good results visible and labelled. */}
          {failed && (
            <ErrorNotice
              title="Run stopped part-way"
              className="mb-4"
              actions={
                <>
                  <Button variant="secondary" size="sm" onClick={() => setFailed(null)}>
                    Keep these results
                  </Button>
                  <Button size="sm" onClick={() => start.mutate()}>
                    Retry the run
                  </Button>
                  <Button variant="tertiary" size="sm" onClick={() => setLogOpen(true)}>
                    View log
                  </Button>
                </>
              }
            >
              Failed while {failed.failure?.stage}. {failed.failure?.checked} of{" "}
              {failed.failure?.of} roles were checked. Nothing you had was lost.
              <Mono className="mt-2 block">
                Engine: {failed.failure?.engine} · {failed.failure?.reason}
              </Mono>
            </ErrorNotice>
          )}

          {failed && (
            <StaleNotice className="mb-3">Showing the last completed run</StaleNotice>
          )}

          {/* The console is the signature while running, and only while running. */}
          {running && run && !isMobile && (
            <RunConsole run={run} onStop={() => stop.mutate()} className="mb-4" />
          )}

          {!running && run?.status === "complete" && !failed && (
            <RunSummaryLine
              run={run}
              onRerun={() => start.mutate()}
              onOpenLog={() => setLogOpen(true)}
              className="mb-4"
            />
          )}

          {counts && (
            <Tabs
              ariaLabel="Filter by verdict"
              className="mb-3"
              value={(query.verdict ?? "all") as string}
              onChange={(value) => patchQuery({ verdict: value as Verdict | "all" })}
              items={[
                { value: "all", label: "All" },
                ...VERDICT_ORDER.map((verdict) => ({
                  value: verdict as string,
                  label: VERDICT_SHORT[verdict],
                  count: counts[verdict],
                  tone: (verdict === "apply-now"
                    ? "sage"
                    : verdict === "one-fix-away"
                      ? "apricot"
                      : "terracotta") as "sage" | "apricot" | "terracotta",
                })),
              ]}
            />
          )}

          {jobs.isLoading && <SkeletonRows rows={6} height={72} />}

          {jobs.data && jobs.data.jobs.length === 0 && (
            <NoResults data={jobs.data} onLoosen={patchQuery} />
          )}

          {jobs.data && jobs.data.jobs.length > 0 && (
            <ResultGroups
              query={query}
              jobs={jobs.data.jobs}
              counts={jobs.data.counts}
              onReverify={(id) => reverify.mutate(id)}
              isMobile={isMobile}
              running={running}
              blockers={focus.data?.skipBlockers ?? []}
            />
          )}
        </div>

        {/*
          Rail — the Delta leads because it is the only figure here the user came
          for. The run's own statistics, its provenance and the evidence behind it
          are all true and all secondary, so each waits behind a disclosure.
        */}
        <aside className="flex min-w-0 flex-col gap-4">
          {delta.data && (
            <OpportunityDelta
              delta={delta.data}
              afterLabel="after adding SQL"
              className="lg:sticky lg:top-[140px]"
            />
          )}

          {fixes.data && (
            <Card className="p-4">
              <Eyebrow>What is blocking the rest</Eyebrow>
              <ul className="mt-2.5 flex flex-col">
                {fixes.data.map((fix, i) => (
                  <li key={fix.id}>
                    {i > 0 && <Hairline />}
                    <div className="flex items-center justify-between gap-3 py-2.5">
                      <span className="text-[14px] font-semibold text-ink">{fix.label}</span>
                      <span className="flex items-center gap-2">
                        <span className="tnum font-mono text-[12.5px] text-ink-muted">
                          {fix.rolesAffected} roles
                        </span>
                        {fix.fixable ? (
                          <Link
                            href={`/one-fix/${fix.id}`}
                            className="text-[12.5px] font-semibold text-apricot-text hover:underline"
                          >
                            fixable
                          </Link>
                        ) : (
                          <Chip tone="terracotta">hard</Chip>
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {run && (
            <Card className="px-4">
              <Disclosure label="About this run" detail={`${run.counts.kept} kept`}>
                <RunStats run={run} bare className="pt-1" />
                <ul className="mt-3 flex flex-col gap-2 border-t border-hairline pt-3">
                  {[
                    { label: "Company career pages", value: run.sources.careersPages },
                    { label: "Trusted job boards", value: run.sources.jobBoards },
                    { label: "Referral network", value: run.sources.referrals },
                  ].map((row) => (
                    <li key={row.label} className="flex items-baseline justify-between gap-3">
                      <span className="text-[13.5px] text-ink-body">{row.label}</span>
                      <span className="tnum font-mono text-[13px] text-ink">{row.value}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[12.5px] leading-snug text-ink-muted">
                  Every row keeps its source and last-verified time. Stale rows are re-checked
                  before you open them.
                </p>
              </Disclosure>
            </Card>
          )}

          {focus.data && (
            <Card className="px-4">
              <Disclosure
                label="Evidence in use"
                detail={`${focus.data.sources.filter((s) => s.state !== "not-connected").length} of ${focus.data.sources.length} connected`}
              >
                <div className="flex flex-col gap-2 pt-1">
                  {focus.data.sources.map((source) => (
                    <IntegrationRow key={source.id} source={source} compact />
                  ))}
                </div>
              </Disclosure>
            </Card>
          )}

        </aside>
      </div>

      {/* Mobile: the console is a sheet at 46%, so the results it describes stay visible. */}
      {isMobile && running && run && (
        <Sheet
          open={consoleOpen}
          onClose={() => setConsoleOpen(false)}
          label="Activity Console"
          height="46%"
          className="bg-console"
        >
          <div className="flex h-full flex-col">
            <RunConsole
              run={run}
              onStop={() => stop.mutate()}
              compact
              className="min-h-0 flex-1 rounded-none border-0"
            />
            <button
              type="button"
              onClick={() => setConsoleOpen(false)}
              className="min-h-[48px] shrink-0 border-t border-white/10 font-mono text-[12.5px] text-console-text uppercase"
            >
              Hide console
            </button>
          </div>
        </Sheet>
      )}

      {isMobile && running && !consoleOpen && (
        <button
          type="button"
          onClick={() => setConsoleOpen(true)}
          className="tnum fixed inset-x-4 bottom-[70px] z-20 min-h-[44px] rounded-[10px] bg-console px-3 font-mono text-[12px] text-console-text"
        >
          Run in progress · step {run?.step} of {run?.totalSteps} · show console
        </button>
      )}

      <RunLogSheet run={run} open={logOpen} onClose={() => setLogOpen(false)} />
      <FilterSheet
        open={filterSheet}
        onClose={() => setFilterSheet(false)}
        query={query}
        onChange={patchQuery}
        resultCount={total}
      />
    </div>
  );
}

/* ── Results ────────────────────────────────────────────────────────────── */

function ResultGroups({
  query,
  jobs,
  counts,
  onReverify,
  isMobile,
  blockers,
  running,
}: {
  query: JobQuery;
  jobs: import("@/lib/api/types").JobSummary[];
  counts: Record<Verdict, number>;
  onReverify: (id: string) => void;
  isMobile: boolean;
  blockers: string[];
  running: boolean;
}) {
  const shown: Verdict[] =
    query.verdict && query.verdict !== "all" ? [query.verdict] : VERDICT_ORDER;

  return (
    <div className="flex flex-col gap-4">
      {shown.map((verdict, i) => {
        const group = jobs.filter((job) => job.verdict === verdict);
        if (group.length === 0) return null;
        return (
          <Group
            key={verdict}
            verdict={verdict}
            jobs={group}
            count={counts[verdict]}
            defaultOpen={verdict !== "skip" || shown.length === 1}
            first={i === 0}
            onReverify={onReverify}
            isMobile={isMobile}
            blockers={blockers}
            running={running}
          />
        );
      })}
    </div>
  );
}

const GROUP_NOTE: Record<Verdict, string> = {
  "apply-now": "",
  "one-fix-away": "One unmet item each · SQL closes 8 of them",
  skip: "Hard blockers",
};

function Group({
  verdict,
  jobs,
  count,
  defaultOpen,
  first,
  onReverify,
  isMobile,
  blockers,
  running,
}: {
  verdict: Verdict;
  jobs: import("@/lib/api/types").JobSummary[];
  count: number;
  defaultOpen: boolean;
  /** Only the first group paints its column heads; the rest keep them for screen readers. */
  first: boolean;
  onReverify: (id: string) => void;
  isMobile: boolean;
  blockers: string[];
  running: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? jobs : jobs.slice(0, isMobile ? 3 : 4);
  const tone = VERDICT_TONE[verdict];

  return (
    <section className="overflow-hidden rounded-[14px] border border-line bg-surface">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
        <PixelIcon
          name={verdict === "apply-now" ? "px-apply" : verdict === "one-fix-away" ? "px-onefix" : "px-skip"}
          size={26}
        />
        <h2 className="font-display text-[19px] font-bold text-ink">{VERDICT_LABEL[verdict]}</h2>
        <span
          className={`tnum rounded-md border px-2 py-0.5 text-[13px] font-bold ${tone.tint} ${tone.line} ${tone.text}`}
        >
          {count}
        </span>
        {running && <Mono className="text-apricot-text">Still ranking</Mono>}
        <span className="hidden text-[13px] text-ink-muted sm:inline">
          {verdict === "skip" ? `${GROUP_NOTE[verdict]}: ${blockers.join(" · ")}` : GROUP_NOTE[verdict]}
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="ml-auto min-h-[44px] px-1 text-[13.5px] font-semibold text-violet-text hover:underline"
        >
          {open ? "Collapse" : "Expand group"}
        </button>
      </header>

      {open && (
        <>
          {/* Desktop: a real table. Quiet head, hairline rows, mono counts, no zebra. */}
          <div className="hidden sm:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className={first ? "bg-table-head" : "sr-only"}>
                  <th scope="col" className="px-4 py-2 text-[11.5px] font-bold tracking-[.1em] text-ink-muted uppercase">
                    Role
                  </th>
                  <th scope="col" className="px-4 py-2 text-[11.5px] font-bold tracking-[.1em] text-ink-muted uppercase">
                    Evidence
                  </th>
                  <th scope="col" className="hidden px-4 py-2 text-[11.5px] font-bold tracking-[.1em] text-ink-muted uppercase lg:table-cell">
                    Source · freshness
                  </th>
                  <th scope="col" className="px-4 py-2 text-right text-[11.5px] font-bold tracking-[.1em] text-ink-muted uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((job) => (
                  <JobRow key={job.id} job={job} onReverify={() => onReverify(job.id)} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: tables become stacked cards. No horizontal scroll, ever. */}
          <div className="flex flex-col gap-2 px-3 pb-3 sm:hidden">
            {visible.map((job) => (
              <JobCard key={job.id} job={job} onReverify={() => onReverify(job.id)} />
            ))}
          </div>

          {jobs.length > visible.length && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="min-h-[48px] w-full border-t border-hairline text-[14px] font-semibold text-violet-text hover:bg-row-hover"
            >
              Show the other {jobs.length - visible.length} {VERDICT_LABEL[verdict]} roles
            </button>
          )}
        </>
      )}
    </section>
  );
}

/* ── States ─────────────────────────────────────────────────────────────── */

/** 12A — an empty set names its cause and quantifies the remedy. Never a shrug. */
function NoResults({
  data,
  onLoosen,
}: {
  data: import("@/lib/api/types").JobListResponse;
  onLoosen: (patch: Partial<JobQuery>) => void;
}) {
  const cause = data.removedByFilter[0];

  return (
    <EmptyState
      glyph="g-empty-noresults"
      title={
        data.removedByFilter.length > 1
          ? `Nothing matches all ${data.removedByFilter.length + 2} filters`
          : "Nothing matches these filters"
      }
      body={
        cause ? (
          <>
            Today&apos;s run verified 54 live Data Analyst roles in Dhaka.{" "}
            <span className="font-semibold text-ink">{cause.filter}</span> removes{" "}
            {cause.removed} of them.
          </>
        ) : (
          "Today's run verified 54 live roles, and none of them match every filter you have set."
        )
      }
    >
      {data.loosenings.length > 0 && (
        <>
          <Eyebrow>Loosen one</Eyebrow>
          <div className="flex flex-wrap justify-center gap-2">
            {data.loosenings.map((loosening) => (
              <Button
                key={loosening.id}
                variant="secondary"
                size="md"
                onClick={() =>
                  onLoosen(
                    loosening.id === "posted-14"
                      ? { postedWithinDays: 14 }
                      : loosening.id === "include-hybrid"
                        ? { mode: "Hybrid" }
                        : { mode: undefined },
                  )
                }
              >
                {loosening.label}
                <span className="tnum ml-1 font-semibold text-sage-text">+{loosening.gain}</span>
              </Button>
            ))}
          </div>
        </>
      )}
      <Button
        variant="tertiary"
        onClick={() =>
          onLoosen({
            q: undefined,
            location: undefined,
            mode: undefined,
            employment: undefined,
            postedWithinDays: undefined,
            savedOnly: undefined,
            verdict: "all",
          })
        }
      >
        Clear all filters
      </Button>
    </EmptyState>
  );
}

function RunLogSheet({
  run,
  open,
  onClose,
}: {
  run?: DiscoveryRun;
  open: boolean;
  onClose: () => void;
}) {
  if (!run) return null;
  return (
    <Sheet open={open} onClose={onClose} label="Run log" height="min(680px, 88%)">
      <SheetGrip />
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-5">
        <h2 className="font-display text-[21px] font-bold text-ink">Run log</h2>
        <Mono className="mt-1 block">
          {run.id} · {run.events.length} events · {run.authoritative ? "authoritative" : "not counted"}
        </Mono>
        <ol className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-[12px] bg-console px-4 py-3">
          {run.events.map((event) => (
            <li
              key={event.id}
              className="tnum grid grid-cols-[68px_1fr_auto] gap-3 py-[5px] font-mono text-[12.5px]"
            >
              <span className="text-console-meta">
                {new Date(event.at).toLocaleTimeString(undefined, { hour12: false })}
              </span>
              <span className="text-console-text">{event.label}</span>
              <span className="text-console-ok">{event.detail}</span>
            </li>
          ))}
        </ol>
        <Button size="lg" full className="mt-4" onClick={onClose}>
          Close
        </Button>
      </div>
    </Sheet>
  );
}

function DiscoverSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pt-6 sm:px-8 md:px-10 xl:px-16">
      <Skeleton className="h-[34px] w-[280px]" />
      <Skeleton className="mt-3 h-[44px] w-full max-w-[720px]" />
      <Skeleton className="mt-4 h-[44px] w-full" />
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_372px]">
        <SkeletonRows rows={6} height={72} />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-[180px]" />
          <Skeleton className="h-[200px]" />
        </div>
      </div>
    </div>
  );
}
