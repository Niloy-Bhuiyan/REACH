"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useAssistantSubject } from "@/components/assistant/AssistantProvider";
import { AssistantEntry } from "@/components/assistant/AssistantSurface";
import { OpportunityDelta } from "@/components/delta/OpportunityDelta";
import { ActiveFilterChips, FilterBar, FilterSheet } from "@/components/filters/FilterBar";
import { JobCard, JobRow } from "@/components/job/JobRow";
import { RunConsole, RunStats, RunSummaryLine } from "@/components/run/RunConsole";
import { useSetStatusLine } from "@/components/shell/AppShell";
import { SearchField } from "@/components/shell/SearchField";
import { Button } from "@/components/ui/Button";
import { Meta, Mono } from "@/components/ui/Chip";
import { Tabs } from "@/components/ui/Controls";
import { Disclosure } from "@/components/ui/Disclosure";
import { Sheet, SheetGrip } from "@/components/ui/Overlay";
import { Eyebrow, Hairline, Page, Stack } from "@/components/ui/Surface";
import { EmptyState, ErrorNotice, Skeleton, SkeletonRows } from "@/components/ui/States";
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
import type { DiscoveryRun, JobQuery, JobSummary, Verdict } from "@/lib/api/types";
import { useIsMobile } from "@/lib/hooks";
import { ago } from "@/lib/utils/time";
import { VERDICT_LABEL, VERDICT_ORDER, VERDICT_SHORT } from "@/lib/utils/verdict";

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverSkeleton />}>
      <Discover />
    </Suspense>
  );
}

/**
 * Discovery shows the target, the search, the essential filters, the verdict
 * counts and the opportunities. Everything else — run statistics, provenance,
 * blocker tallies — is one disclosure away, because none of it is what the user
 * came here for.
 */
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
      return data && data.status === "running" ? 700 : false;
    },
  });

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
    onSuccess: () => setActiveRunId(null),
  });

  const fail = useMutation({
    mutationFn: () => failRun(activeRunId ?? latest.data?.id ?? "x"),
    onSuccess: (run) => {
      setActiveRunId(null);
      setFailed(run);
    },
  });

  const wantFailed = params.get("state") === "failed";
  useEffect(() => {
    if (wantFailed) fail.mutate();
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
  const target = focus.data?.target;

  useSetStatusLine(
    running ? "Run in progress" : run?.completedAt ? `Verified ${ago(run.completedAt)}` : null,
  );
  useAssistantSubject({
    scope: "discover",
    id: null,
    label: "Ask about this run",
    subject: `Today's run · ${jobs.data?.total ?? 0} opportunities`,
  });

  const total = jobs.data?.total ?? 0;
  const counts = jobs.data?.counts;

  return (
    <Page className="pt-8 pb-20 sm:pt-10">
      <Stack gap="md">
        <header>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-title text-ink">Discover</h1>
            {!running && counts && (
              <Meta>
                {total} opportunities for {target?.role} in {target?.location}
              </Meta>
            )}
            <div className="ml-auto hidden sm:block">
              <AssistantEntry />
            </div>
          </div>

          <SearchField defaultValue={query.q ?? ""} size="md" className="mt-4 w-full" />
        </header>

        {/* Toolbar: the essentials, plus one door to the rest. */}
        <div>
          <FilterBar
            query={query}
            onChange={patchQuery}
            onOpenSheet={() => setFilterSheet(true)}
          />
          <ActiveFilterChips query={query} onChange={patchQuery} className="mt-2.5" />
        </div>

        {/* 12B — failure preserves the last good results and says what is still true. */}
        {failed && (
          <ErrorNotice
            title="The run stopped part-way"
            actions={
              <>
                <Button variant="secondary" size="sm" onClick={() => setFailed(null)}>
                  Keep these results
                </Button>
                <Button size="sm" onClick={() => start.mutate()}>
                  Retry
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setLogOpen(true)}>
                  View log
                </Button>
              </>
            }
          >
            Failed while {failed.failure?.stage}. {failed.failure?.checked} of {failed.failure?.of}{" "}
            roles were checked and nothing you had was lost. Showing the last completed run — these
            are not counted toward your Opportunity Delta.
            <Mono className="mt-1.5 block text-terracotta-text">
              Engine: {failed.failure?.engine} · {failed.failure?.reason}
            </Mono>
          </ErrorNotice>
        )}

        {running && run && !isMobile && <RunConsole run={run} onStop={() => stop.mutate()} />}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_264px] lg:gap-12">
          <div className="min-w-0">
            {counts && (
              <Tabs
                ariaLabel="Filter by verdict"
                value={(query.verdict ?? "all") as string}
                onChange={(value) => patchQuery({ verdict: value as Verdict | "all" })}
                items={[
                  { value: "all", label: "All", count: total },
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

            {jobs.isLoading && <SkeletonRows rows={7} height={64} className="mt-5" />}

            {jobs.data && jobs.data.jobs.length === 0 && (
              <NoResults data={jobs.data} onLoosen={patchQuery} />
            )}

            {jobs.data && jobs.data.jobs.length > 0 && (
              <Results
                query={query}
                jobs={jobs.data.jobs}
                counts={jobs.data.counts}
                onReverify={(id) => reverify.mutate(id)}
                isMobile={isMobile}
                running={running}
              />
            )}
          </div>

          {/* The rail keeps one thing: the Delta. Everything else is on demand. */}
          <aside className="min-w-0 lg:pt-2">
            {delta.data && (
              <div className="lg:sticky lg:top-24">
                <OpportunityDelta delta={delta.data} afterLabel="after adding SQL" />

                <div className="mt-8">
                  {run && !running && (
                    <RunSummaryLine
                      run={run}
                      onRerun={() => start.mutate()}
                      onOpenLog={() => setLogOpen(true)}
                    />
                  )}

                  <div className="mt-3">
                    <Disclosure label="What is blocking the rest">
                      <ul className="pt-1">
                        {(fixes.data ?? []).map((fix, i) => (
                          <li key={fix.id}>
                            {i > 0 && <Hairline />}
                            <div className="flex items-baseline justify-between gap-3 py-2">
                              <span className="text-sm text-ink">{fix.label}</span>
                              {fix.fixable ? (
                                <Link
                                  href={`/one-fix/${fix.id}`}
                                  className="inline-flex min-h-[36px] items-center text-meta font-medium text-brand-text hover:underline"
                                >
                                  {fix.rolesAffected} roles · fixable
                                </Link>
                              ) : (
                                <Mono>{fix.rolesAffected} roles · hard</Mono>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </Disclosure>

                    {run && (
                      <Disclosure label="About this run">
                        <div className="pt-2">
                          <RunStats run={run} />
                          <p className="mt-3 text-sm text-ink-muted">
                            Every row keeps its source and last-verified time. Stale rows are
                            re-checked before you open them.
                          </p>
                        </div>
                      </Disclosure>
                    )}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </Stack>

      {/* Mobile: the console is a sheet, so the results it describes stay visible. */}
      {isMobile && running && run && (
        <Sheet
          open={consoleOpen}
          onClose={() => setConsoleOpen(false)}
          label="Finding opportunities"
          height="44%"
          className="bg-console"
        >
          <div className="flex h-full flex-col">
            <RunConsole
              run={run}
              onStop={() => stop.mutate()}
              compact
              className="min-h-0 flex-1 rounded-none"
            />
            <button
              type="button"
              onClick={() => setConsoleOpen(false)}
              className="min-h-[48px] shrink-0 text-sm text-console-meta"
            >
              Hide
            </button>
          </div>
        </Sheet>
      )}

      {isMobile && running && !consoleOpen && (
        <button
          type="button"
          onClick={() => setConsoleOpen(true)}
          className="tnum fixed inset-x-4 bottom-[68px] z-20 min-h-[44px] rounded-xl bg-console px-4 font-mono text-meta text-console-text"
        >
          Finding opportunities · step {run?.step} of {run?.totalSteps}
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
    </Page>
  );
}

/* ── Results ────────────────────────────────────────────────────────────── */

/**
 * One scannable list. Verdict groups are labelled by a heading rather than
 * wrapped in a card, so forty rows read as forty rows.
 */
function Results({
  query,
  jobs,
  counts,
  onReverify,
  isMobile,
  running,
}: {
  query: JobQuery;
  jobs: JobSummary[];
  counts: Record<Verdict, number>;
  onReverify: (id: string) => void;
  isMobile: boolean;
  running: boolean;
}) {
  const single = !!query.verdict && query.verdict !== "all";
  // On the combined view Skip collapses to one line: nothing is hidden, but it
  // never outranks what you can act on.
  const shown: Verdict[] = single ? [query.verdict as Verdict] : ["apply-now", "one-fix-away"];
  const skipped = jobs.filter((job) => job.verdict === "skip");

  return (
    <div className="mt-2">
      {shown.map((verdict) => {
        const group = jobs.filter((job) => job.verdict === verdict);
        if (group.length === 0) return null;
        return (
          <Group
            key={verdict}
            verdict={verdict}
            jobs={group}
            count={counts[verdict]}
            onReverify={onReverify}
            isMobile={isMobile}
            running={running}
            single={single}
          />
        );
      })}

      {!single && skipped.length > 0 && (
        <Link
          href="/discover?verdict=skip"
          className="mt-8 flex items-center gap-3 border-t border-line py-4 transition-colors duration-100 hover:bg-surface-sunken"
        >
          <span className="text-body font-medium text-ink">{counts.skip} skipped</span>
          <span className="min-w-0 flex-1 truncate text-sm text-ink-muted">
            {[...new Set(skipped.map((job) => job.hardBlocker).filter(Boolean))]
              .slice(0, 4)
              .join(", ")}
          </span>
          <span className="shrink-0 text-sm font-medium text-brand-text">Review</span>
        </Link>
      )}
    </div>
  );
}

function Group({
  verdict,
  jobs,
  count,
  onReverify,
  isMobile,
  running,
  single,
}: {
  verdict: Verdict;
  jobs: JobSummary[];
  count: number;
  onReverify: (id: string) => void;
  isMobile: boolean;
  running: boolean;
  single: boolean;
}) {
  const [showAll, setShowAll] = useState(single);
  const limit = isMobile ? 4 : 5;
  const visible = showAll ? jobs : jobs.slice(0, limit);

  return (
    <section className="mt-7 first:mt-5">
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-section text-ink">{VERDICT_LABEL[verdict]}</h2>
        <span className="tnum text-body text-ink-muted">{count}</span>
        {running && <Mono className="text-apricot-text">still ranking</Mono>}
      </div>

      <div className="mt-1.5">
        {visible.map((job) =>
          isMobile ? (
            <JobCard key={job.id} job={job} onReverify={() => onReverify(job.id)} />
          ) : (
            <JobRow key={job.id} job={job} onReverify={() => onReverify(job.id)} />
          ),
        )}
      </div>

      {jobs.length > visible.length && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-1 min-h-[44px] text-sm font-medium text-brand-text hover:underline"
        >
          Show {jobs.length - visible.length} more
        </button>
      )}
    </section>
  );
}

/* ── States ─────────────────────────────────────────────────────────────── */

/** 12A — an empty set names its cause and quantifies the remedy. */
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
      title="Nothing matches these filters"
      body={
        cause ? (
          <>
            Today&apos;s run verified 54 live roles. <span className="text-ink">{cause.filter}</span>{" "}
            removes {cause.removed} of them.
          </>
        ) : (
          "Today's run verified 54 live roles, and none match every filter you have set."
        )
      }
    >
      {data.loosenings.length > 0 && (
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
              <span className="tnum font-semibold text-sage-text">+{loosening.gain}</span>
            </Button>
          ))}
        </div>
      )}
      <Button
        variant="link"
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
      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <h2 className="text-section text-ink">Run log</h2>
        <Mono className="mt-0.5 block">
          {run.id} · {run.events.length} events ·{" "}
          {run.authoritative ? "authoritative" : "not counted"}
        </Mono>
        <ol className="mt-4 min-h-0 flex-1 overflow-y-auto rounded-xl bg-console px-4 py-3">
          {run.events.map((event) => (
            <li
              key={event.id}
              className="tnum grid grid-cols-[58px_1fr_auto] gap-3 py-[5px] font-mono text-meta"
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
    <Page className="pt-8 sm:pt-10">
      <Skeleton className="h-[30px] w-[200px]" />
      <Skeleton className="mt-4 h-[46px] w-full" />
      <Skeleton className="mt-6 h-[40px] w-[70%]" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_264px]">
        <SkeletonRows rows={7} height={64} />
        <Skeleton className="h-[160px]" />
      </div>
    </Page>
  );
}

export { Eyebrow };
