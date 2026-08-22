import { HttpResponse, http, delay } from "msw";
import {
  FRESHNESS_EXPIRED_HOURS,
} from "@/lib/api/contract";
import type {
  AssistantAnswer,
  AssistantScope,
  DiscoveryRun,
  EngineSettings,
  FocusSummary,
  JobListResponse,
  JobQuery,
  JobSummary,
  Milestone,
  Plan,
  PrivacySettings,
  ResumeVersion,
  SuggestedEdit,
  Verdict,
} from "@/lib/api/types";
import { hoursSince } from "@/lib/utils/time";
import * as db from "./db";
import { readState, writeState } from "./persist";

const API = "/api";

/** Deliberate latency, so skeletons at real row geometry are exercised rather than flashing. */
const lag = () => delay(180 + Math.round(Math.random() * 240));

/* ── Mutable session state ──────────────────────────────────────────────── */

const state = readState({
  savedJobs: db.jobs.filter((j) => j.saved).map((j) => j.id),
  hiddenJobs: [] as string[],
  editStates: {} as Record<string, SuggestedEdit["state"]>,
  milestoneStates: {} as Record<string, Milestone["state"]>,
  versions: db.resumeVersions,
  activeEngine: db.engineSettings.activeId,
  fallbackActive: undefined as string | undefined,
  engineKeyInvalid: false,
  privacy: db.privacy,
  target: db.target,
});

const persist = () => writeState(state);

/* ── Jobs ───────────────────────────────────────────────────────────────── */

function withSessionState(job: JobSummary): JobSummary {
  return {
    ...job,
    saved: state.savedJobs.includes(job.id),
    hidden: state.hiddenJobs.includes(job.id),
  };
}

/** Postings past the expired band are shown but excluded from every count. */
const countable = (job: JobSummary) =>
  hoursSince(job.provenance.verifiedAt) <= FRESHNESS_EXPIRED_HOURS && !job.provenance.delisted;

function applyFilters(all: JobSummary[], q: JobQuery) {
  return all.filter((job) => {
    if (state.hiddenJobs.includes(job.id)) return false;
    if (q.savedOnly && !state.savedJobs.includes(job.id)) return false;
    if (q.verdict && q.verdict !== "all" && job.verdict !== q.verdict) return false;
    if (q.mode && job.mode !== q.mode) return false;
    if (q.employment && job.employment !== q.employment) return false;
    if (q.location && !job.location.toLowerCase().includes(q.location.toLowerCase())) return false;
    if (q.postedWithinDays && job.postedDaysAgo > q.postedWithinDays) return false;
    if (q.q) {
      const needle = q.q.toLowerCase();
      const hay = `${job.role} ${job.company} ${job.location} ${job.blocker?.label ?? ""}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

function sortJobs(list: JobSummary[], sort: JobQuery["sort"]) {
  const order: Record<Verdict, number> = { "apply-now": 0, "one-fix-away": 1, skip: 2 };
  const copy = [...list];
  if (sort === "newest") {
    copy.sort(
      (a, b) => +new Date(b.provenance.verifiedAt) - +new Date(a.provenance.verifiedAt),
    );
  } else if (sort === "closing-soon") {
    copy.sort(
      (a, b) =>
        +new Date(a.provenance.closesAt ?? 0) - +new Date(b.provenance.closesAt ?? 0),
    );
  } else {
    // Best fit keeps the run's own ranking within each verdict group.
    const rank = new Map(db.jobs.map((job, i) => [job.id, i]));
    copy.sort(
      (a, b) =>
        order[a.verdict] - order[b.verdict] ||
        (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0),
    );
  }
  return copy;
}

/* ── Run streaming ──────────────────────────────────────────────────────── */

function emptyCounts() {
  return { found: 0, deduped: 0, eligible: 0, kept: 0, applyNow: 0, oneFixAway: 0, skip: 0 };
}

function advanceRun(run: DiscoveryRun): DiscoveryRun {
  if (run.status !== "running") return run;

  const next = run.events.length;
  if (next >= db.RUN_STEPS.length) {
    return {
      ...run,
      status: "complete",
      completedAt: new Date().toISOString(),
      progress: 100,
      step: db.RUN_STEPS.length,
      counts: db.completedRun.counts,
      sources: db.completedRun.sources,
      scan: db.completedRun.scan,
      authoritative: true,
    };
  }

  const step = db.RUN_STEPS[next];
  const events = [
    ...run.events,
    {
      id: `e${next}`,
      at: new Date().toISOString(),
      label: step.label,
      detail: step.detail,
      status: "done" as const,
    },
  ];

  // Counts fill in as the events that produce them land — nothing is known before its step.
  const counts = { ...run.counts };
  if (next >= 1) counts.found = 3142;
  if (next >= 4) counts.deduped = 1682;
  if (next >= 6) counts.eligible = 214;
  if (next >= 8) counts.kept = 54;
  if (next >= 11) {
    counts.applyNow = 12;
    counts.oneFixAway = 18;
    counts.skip = 24;
  }

  // Scan breadth fills in as the steps that produce it land.
  const scan = { ...run.scan };
  if (next >= 2) scan.careersPages = db.completedRun.scan.careersPages;
  if (next >= 3) scan.trustedSources = db.completedRun.scan.trustedSources;
  if (next >= 3) scan.referralNetworks = db.completedRun.scan.referralNetworks;

  return {
    ...run,
    events,
    counts,
    scan,
    step: next + 1,
    progress: Math.round(((next + 1) / db.RUN_STEPS.length) * 100),
  };
}

/* ── Handlers ───────────────────────────────────────────────────────────── */

export const handlers = [
  /* Focus */
  http.get(`${API}/focus`, async () => {
    await lag();
    const all = db.jobs.map(withSessionState);
    const pick = (verdict: Verdict, n: number) =>
      all.filter((j) => j.verdict === verdict && countable(j)).slice(0, n);

    const payload: FocusSummary = {
      target: state.target,
      counts: {
        "apply-now": db.completedRun.counts.applyNow,
        "one-fix-away": db.completedRun.counts.oneFixAway,
        skip: db.completedRun.counts.skip,
      },
      biggestBlocker: {
        title: "Biggest blocker",
        body: "Missing one key skill for 12 roles you want.",
        mobileTitle: "Missing SQL",
        action: "See What's Missing",
        href: "/one-fix/sql",
      },
      fastestFix: {
        title: "Fastest fix",
        body: "Add SQL to unlock 8 more roles this week.",
        mobileTitle: "Add SQL basics",
        mobileBody: "About 6 hours of practice plus one query project on GitHub.",
        action: "See Your Top Fix",
        href: "/one-fix/sql",
        fixId: "sql",
      },
      roadmap: {
        body: "Your personalized plan to reach your goals.",
        step: db.plan.step,
        totalSteps: db.plan.totalSteps,
        progress: db.plan.progress,
        next: "Next: publish a small reporting query set. ~2 h, produces GitHub evidence.",
        href: "/roadmap",
      },
      previews: {
        "apply-now": pick("apply-now", 3),
        "one-fix-away": pick("one-fix-away", 3),
        skip: pick("skip", 3),
      },
      skipBlockers: ["Swift", "AWS", "Figma"],
      sources: db.sources.slice(0, 3),
      engine: {
        name:
          db.engineSettings.engines.find((e) => e.id === state.activeEngine)?.name ??
          "REACH-hosted engine",
        detail: state.activeEngine === "reach" ? "Default · nothing to connect" : "Your own key",
      },
      completeness: {
        percent: db.profile.completeness,
        sources: [
          { icon: "px-cv", label: "CV", state: "connected" },
          { icon: "px-pgithub", label: "GitHub", state: "connected" },
          { icon: "px-plinkedin", label: "LinkedIn", state: "connected" },
          { icon: "px-pportfolio", label: "Portfolio", state: "missing" },
        ],
        note: "Adding a portfolio strengthens 7 of your One Fix Away roles.",
        action: "Add Portfolio",
      },
      lastRun: {
        verifiedAt: db.store.latest.completedAt ?? db.store.latest.startedAt,
        scanned: db.store.latest.counts.deduped,
      },
    };
    return HttpResponse.json(payload);
  }),

  http.patch(`${API}/focus/target`, async ({ request }) => {
    await lag();
    state.target = (await request.json()) as typeof state.target;
    persist();
    return HttpResponse.json({ ok: true });
  }),

  /* Runs */
  http.get(`${API}/runs/latest`, async () => {
    await lag();
    return HttpResponse.json(db.store.active ?? db.store.latest);
  }),

  http.post(`${API}/runs`, async () => {
    await delay(120);
    db.store.active = {
      id: `run-${Date.now()}`,
      status: "running",
      startedAt: new Date().toISOString(),
      step: 0,
      totalSteps: db.RUN_STEPS.length,
      progress: 0,
      events: [],
      counts: emptyCounts(),
      sources: { careersPages: 0, jobBoards: 0, referrals: 0 },
      scan: { careersPages: 0, trustedSources: 0, referralNetworks: 0 },
      authoritative: false,
    };
    return HttpResponse.json(db.store.active);
  }),

  http.get(`${API}/runs/:id`, async ({ params }) => {
    const { id } = params as { id: string };
    if (db.store.active?.id === id) {
      db.store.active = advanceRun(db.store.active);
      if (db.store.active.status === "complete") {
        // Only a completed run becomes authoritative.
        db.store.latest = db.store.active;
        db.store.active = null;
        return HttpResponse.json(db.store.latest);
      }
      return HttpResponse.json(db.store.active);
    }
    return HttpResponse.json(db.store.latest);
  }),

  http.post(`${API}/runs/:id/stop`, async () => {
    await delay(100);
    // A cancelled run writes no Delta and updates no count.
    if (db.store.active) {
      db.store.active = { ...db.store.active, status: "cancelled", authoritative: false };
      const cancelled = db.store.active;
      db.store.active = null;
      return HttpResponse.json(cancelled);
    }
    return HttpResponse.json(db.store.latest);
  }),

  http.post(`${API}/runs/:id/fail`, async () => {
    await delay(100);
    const failed: DiscoveryRun = {
      ...(db.store.active ?? db.store.latest),
      status: "failed",
      authoritative: false,
      failure: {
        stage: "verifying live status",
        engine:
          db.engineSettings.engines.find((e) => e.id === state.activeEngine)?.name ??
          "REACH-hosted",
        reason: "timeout",
        checked: 31,
        of: 54,
      },
    };
    db.store.active = null;
    return HttpResponse.json(failed);
  }),

  /* Jobs */
  http.get(`${API}/jobs`, async ({ request }) => {
    await lag();
    const url = new URL(request.url);
    const query: JobQuery = {
      q: url.searchParams.get("q") ?? undefined,
      verdict: (url.searchParams.get("verdict") as Verdict) ?? undefined,
      location: url.searchParams.get("location") ?? undefined,
      mode: (url.searchParams.get("mode") as JobQuery["mode"]) ?? undefined,
      employment: (url.searchParams.get("employment") as JobQuery["employment"]) ?? undefined,
      postedWithinDays: url.searchParams.get("postedWithinDays")
        ? Number(url.searchParams.get("postedWithinDays"))
        : undefined,
      savedOnly: url.searchParams.get("savedOnly") === "true",
      sort: (url.searchParams.get("sort") as JobQuery["sort"]) ?? "best-fit",
    };

    const all = db.jobs.map(withSessionState);
    const filtered = sortJobs(applyFilters(all, query), query.sort);

    // 12A needs to name the filter that emptied the set and quantify the remedy.
    const removedByFilter: JobListResponse["removedByFilter"] = [];
    if (query.postedWithinDays) {
      const removed = applyFilters(all, { ...query, postedWithinDays: undefined }).length -
        filtered.length;
      if (removed > 0)
        removedByFilter.push({
          filter: `Posted < ${query.postedWithinDays} days`,
          removed,
        });
    }
    if (query.mode) {
      const removed = applyFilters(all, { ...query, mode: undefined }).length - filtered.length;
      if (removed > 0) removedByFilter.push({ filter: query.mode, removed });
    }

    const loosenings: JobListResponse["loosenings"] = [];
    if (query.postedWithinDays) {
      const gain =
        applyFilters(all, { ...query, postedWithinDays: 14 }).length - filtered.length;
      if (gain > 0)
        loosenings.push({ id: "posted-14", label: "Posted in the last 2 weeks", gain });
    }
    if (query.mode && query.mode !== "Hybrid") {
      const gain = applyFilters(all, { ...query, mode: "Hybrid" }).length - filtered.length;
      if (gain > 0) loosenings.push({ id: "include-hybrid", label: "Include hybrid", gain });
    }
    if (query.mode === "Hybrid") {
      const gain = applyFilters(all, { ...query, mode: undefined }).length - filtered.length;
      if (gain > 0) loosenings.push({ id: "any-mode", label: "Any work mode", gain });
    }

    const counted = filtered.filter(countable);
    const payload: JobListResponse = {
      jobs: filtered,
      counts: {
        "apply-now": counted.filter((j) => j.verdict === "apply-now").length,
        "one-fix-away": counted.filter((j) => j.verdict === "one-fix-away").length,
        skip: counted.filter((j) => j.verdict === "skip").length,
      },
      total: counted.length,
      removedByFilter,
      loosenings,
    };
    return HttpResponse.json(payload);
  }),

  http.get(`${API}/jobs/:id/similar`, async ({ params }) => {
    await lag();
    const { id } = params as { id: string };
    const job = db.jobs.find((j) => j.id === id);
    const similar = db.jobs
      .filter((j) => j.id !== id && j.verdict !== "skip" && j.company === job?.company)
      .concat(db.jobs.filter((j) => j.verdict === "apply-now"))
      .slice(0, 6)
      .map(withSessionState);
    return HttpResponse.json(similar);
  }),

  http.get(`${API}/jobs/:id`, async ({ params }) => {
    await lag();
    const { id } = params as { id: string };
    const detail = db.buildJobDetail(id);
    if (!detail) {
      return HttpResponse.json({ code: "not_found", message: "No such posting" }, { status: 404 });
    }
    return HttpResponse.json({
      ...detail,
      saved: state.savedJobs.includes(id),
      hidden: state.hiddenJobs.includes(id),
    });
  }),

  http.post(`${API}/jobs/:id/save`, async ({ params }) => {
    await delay(90);
    const { id } = params as { id: string };
    if (!state.savedJobs.includes(id)) state.savedJobs.push(id);
    persist();
    return HttpResponse.json({ saved: true });
  }),

  http.delete(`${API}/jobs/:id/save`, async ({ params }) => {
    await delay(90);
    const { id } = params as { id: string };
    state.savedJobs = state.savedJobs.filter((j) => j !== id);
    persist();
    return HttpResponse.json({ saved: false });
  }),

  http.post(`${API}/jobs/:id/hide`, async ({ params }) => {
    await delay(90);
    const { id } = params as { id: string };
    if (!state.hiddenJobs.includes(id)) state.hiddenJobs.push(id);
    persist();
    return HttpResponse.json({ hidden: true });
  }),

  http.post(`${API}/jobs/:id/reverify`, async ({ params }) => {
    await delay(300);
    const { id } = params as { id: string };
    const job = db.jobs.find((j) => j.id === id);
    if (!job) return HttpResponse.json({ code: "not_found", message: "" }, { status: 404 });
    job.provenance = { ...job.provenance, verifiedAt: new Date().toISOString() };
    return HttpResponse.json(withSessionState(job));
  }),

  /* Fixes & Delta */
  http.get(`${API}/fixes`, async () => {
    await lag();
    return HttpResponse.json([
      { id: "sql", label: "SQL", gapType: "signal", rolesAffected: 8, fixable: true },
      { id: "django", label: "Django", gapType: "knowledge", rolesAffected: 4, fixable: true },
      { id: "swift", label: "Swift", gapType: "knowledge", rolesAffected: 9, fixable: false },
      {
        id: "authorisation",
        label: "Work authorisation",
        gapType: "knowledge",
        rolesAffected: 3,
        fixable: false,
      },
    ]);
  }),

  http.get(`${API}/fixes/:id`, async ({ params }) => {
    await lag();
    const { id } = params as { id: string };
    const fix = db.fixes.find((f) => f.id === id);
    if (!fix) return HttpResponse.json({ code: "not_found", message: "" }, { status: 404 });
    return HttpResponse.json(fix);
  }),

  http.get(`${API}/delta/:fixId`, async ({ params }) => {
    await lag();
    const { fixId } = params as { fixId: string };
    const delta = db.deltas[fixId];
    if (!delta) return HttpResponse.json({ code: "not_found", message: "" }, { status: 404 });
    // Rule 05 — a partial run never moves a number.
    return HttpResponse.json({ ...delta, runId: db.store.latest.id });
  }),

  /* Roadmap */
  http.get(`${API}/roadmap`, async () => {
    await lag();
    return HttpResponse.json(currentPlan());
  }),

  http.post(`${API}/roadmap/milestones/:id/:action`, async ({ params }) => {
    await delay(160);
    const { id, action } = params as { id: string; action: string };
    if (action === "complete") state.milestoneStates[id] = "done";
    if (action === "skip") state.milestoneStates[id] = "skipped";
    if (action === "start") state.milestoneStates[id] = "current";
    persist();
    return HttpResponse.json(currentPlan());
  }),

  /* Resume */
  http.get(`${API}/resume/versions`, async () => {
    await lag();
    return HttpResponse.json(state.versions);
  }),

  http.get(`${API}/resume/versions/:id`, async () => {
    await lag();
    return HttpResponse.json(db.resumeDoc);
  }),

  http.post(`${API}/resume/versions`, async ({ request }) => {
    await delay(200);
    const { label } = (await request.json()) as { label?: string };
    const n = state.versions.length + 2;
    const version: ResumeVersion = {
      id: `v${n}`,
      label: label ?? `v${n} · analyst`,
      savedAt: new Date().toISOString(),
      isCurrent: true,
    };
    state.versions = [version, ...state.versions.map((v) => ({ ...v, isCurrent: false }))];
    persist();
    return HttpResponse.json(version);
  }),

  http.get(`${API}/resume/analysis`, async ({ request }) => {
    await lag();
    const url = new URL(request.url);
    const versionId = url.searchParams.get("versionId") ?? "v4";
    const jobId = url.searchParams.get("jobId");
    const analysis = db.buildAnalysis(versionId, jobId);
    return HttpResponse.json({
      ...analysis,
      edits: analysis.edits.map((e) => ({ ...e, state: state.editStates[e.id] ?? e.state })),
    });
  }),

  http.post(`${API}/resume/analysis/jd`, async ({ request }) => {
    await delay(500);
    const { versionId } = (await request.json()) as { versionId: string; text: string };
    // A pasted JD produces a JD Match only — ATS Readiness is unaffected.
    const analysis = db.buildAnalysis(versionId, "bkash-da");
    return HttpResponse.json({ ...analysis, jobLabel: "Pasted job description" });
  }),

  http.post(`${API}/resume/edits/:id/accept`, async ({ params }) => {
    await delay(140);
    const { id } = params as { id: string };
    const edit = db.suggestedEdits.find((e) => e.id === id);
    if (!edit) return HttpResponse.json({ code: "not_found", message: "" }, { status: 404 });
    if (edit.evidence === null) {
      // The only path to that sentence is proving it first.
      return HttpResponse.json(
        {
          code: "no_evidence",
          message: "No source of yours supports this claim, so it cannot be accepted.",
        },
        { status: 409 },
      );
    }
    state.editStates[id] = "accepted";
    persist();
    return HttpResponse.json({ ...edit, state: "accepted" });
  }),

  http.post(`${API}/resume/edits/:id/reject`, async ({ params }) => {
    await delay(140);
    const { id } = params as { id: string };
    const edit = db.suggestedEdits.find((e) => e.id === id);
    if (!edit) return HttpResponse.json({ code: "not_found", message: "" }, { status: 404 });
    state.editStates[id] = "rejected";
    persist();
    return HttpResponse.json({ ...edit, state: "rejected" });
  }),

  /* Profile */
  http.get(`${API}/profile`, async () => {
    await lag();
    return HttpResponse.json({ ...db.profile, target: state.target });
  }),

  http.get(`${API}/sources`, async () => {
    await lag();
    return HttpResponse.json(db.sources);
  }),

  http.post(`${API}/sources/:id/:action`, async ({ params }) => {
    await delay(320);
    const { id } = params as { id: string };
    const source = db.sources.find((s) => s.id === id);
    if (!source) return HttpResponse.json({ code: "not_found", message: "" }, { status: 404 });
    source.state = "connected";
    source.stateLabel = "Connected · synced";
    source.stateDetail = "Synced just now";
    source.action = "Manage";
    source.syncedAt = new Date().toISOString();
    return HttpResponse.json(source);
  }),

  /* Engines */
  http.get(`${API}/engines`, async () => {
    await lag();
    return HttpResponse.json(engineState());
  }),

  http.post(`${API}/engines/:id/select`, async ({ params }) => {
    await delay(160);
    const { id } = params as { id: string };
    state.activeEngine = id;
    state.fallbackActive = undefined;
    persist();
    return HttpResponse.json(engineState());
  }),

  http.post(`${API}/engines/:id/test`, async ({ params }) => {
    await delay(600);
    const { id } = params as { id: string };
    if (id === "claude") {
      // 12F — the key is rejected and the fallback has already taken over.
      state.engineKeyInvalid = true;
      state.activeEngine = "reach";
      state.fallbackActive = "reach";
      persist();
      return HttpResponse.json(engineState(), { status: 200 });
    }
    return HttpResponse.json(engineState());
  }),

  http.post(`${API}/engines/:id/key`, async ({ params }) => {
    await delay(320);
    const { id } = params as { id: string };
    if (id === "claude") {
      state.engineKeyInvalid = false;
      state.fallbackActive = undefined;
    }
    persist();
    return HttpResponse.json(engineState());
  }),

  http.delete(`${API}/engines/:id/key`, async () => {
    await delay(200);
    state.engineKeyInvalid = false;
    state.fallbackActive = undefined;
    persist();
    return HttpResponse.json(engineState());
  }),

  http.get(`${API}/settings/privacy`, async () => {
    await lag();
    return HttpResponse.json(state.privacy);
  }),

  http.patch(`${API}/settings/privacy`, async ({ request }) => {
    await delay(120);
    const patch = (await request.json()) as Partial<PrivacySettings>;
    state.privacy = { ...state.privacy, ...patch };
    persist();
    return HttpResponse.json(state.privacy);
  }),

  /* Assistant */
  http.get(`${API}/assistant/suggestions`, async ({ request }) => {
    await delay(120);
    const scope = (new URL(request.url).searchParams.get("scope") ?? "job") as AssistantScope;
    return HttpResponse.json(SUGGESTIONS[scope] ?? SUGGESTIONS.job);
  }),

  http.post(`${API}/assistant/ask`, async ({ request }) => {
    await delay(900);
    const { scope, question } = (await request.json()) as {
      scope: AssistantScope;
      question: string;
    };

    // Engines are configuration, not evidence — so a failure names the engine and changes nothing.
    if (question.trim().toLowerCase() === "/fail") {
      const answer: AssistantAnswer = {
        message: {
          id: `m${Date.now()}`,
          role: "reach",
          at: new Date().toISOString(),
          text: "",
        },
        error: {
          engine:
            db.engineSettings.engines.find((e) => e.id === state.activeEngine)?.name ?? "Claude",
          detail: "did not respond in 20 seconds. Nothing was changed.",
          fallback: "ChatGPT",
        },
      };
      return HttpResponse.json(answer);
    }

    return HttpResponse.json(answerFor(scope, question));
  }),
];

/* ── Derived views ──────────────────────────────────────────────────────── */

function currentPlan(): Plan {
  const milestones = db.plan.milestones.map((m) => ({
    ...m,
    state: state.milestoneStates[m.id] ?? m.state,
  }));

  // The first milestone that is neither done nor skipped becomes current; the rest lock.
  const firstOpen = milestones.findIndex((m) => m.state !== "done" && m.state !== "skipped");
  const resolved = milestones.map((m, i) => ({
    ...m,
    state: m.state === "done" || m.state === "skipped" ? m.state : i === firstOpen ? "current" : "locked",
  })) as Milestone[];

  const doneCount = resolved.filter((m) => m.state === "done").length;
  const complete = firstOpen === -1;
  // Milestone 1 produces one countable artefact; each later one adds two.
  const artefacts = Math.min(db.plan.artefactsTotal, Math.max(0, doneCount * 2 - 1));

  return {
    ...db.plan,
    milestones: resolved,
    status: complete ? "complete" : "active",
    step: complete ? db.plan.totalSteps : db.plan.step + (doneCount - 1) * 3,
    progress: complete ? 100 : Math.round((doneCount / resolved.length) * 100) || db.plan.progress,
    artefactsProduced: complete ? db.plan.artefactsTotal : Math.max(1, artefacts),
    hoursSpent: resolved
      .filter((m) => m.state === "done")
      .reduce((sum, m) => sum + m.hours, 0),
    evidenceAdded: db.plan.evidenceAdded.map((e, i) => ({
      ...e,
      state: complete
        ? i === 2
          ? "Accepted"
          : "Verified"
        : e.state,
    })),
    completion: complete
      ? {
          headline: "Your SQL is legible",
          predicted: 8,
          realised: 9,
          before: 12,
          after: 21,
          reason:
            "One more than predicted — a role posted this week also names window functions. Counted from this morning's verified run.",
        }
      : undefined,
  };
}

function engineState(): EngineSettings {
  const engines = db.engineSettings.engines.map((engine) => {
    if (engine.id === state.activeEngine) {
      return {
        ...engine,
        state: "active" as const,
        stateLabel: state.fallbackActive ? "Active via fallback" : engine.stateLabel,
      };
    }
    if (engine.id === "claude" && state.engineKeyInvalid) {
      return {
        ...engine,
        state: "key-invalid" as const,
        stateLabel: "Key invalid",
        keyError: {
          code: "401 invalid_api_key",
          at: new Date(db.ANCHOR - 3 * 3_600_000).toISOString(),
          note: "The key may have been revoked or rotated.",
        },
        actions: ["Replace key", "Remove key"],
      };
    }
    if (engine.state === "active") return { ...engine, state: "available" as const };
    return engine;
  });

  return {
    ...db.engineSettings,
    engines,
    activeId: state.activeEngine,
    fallbackActiveId: state.fallbackActive,
  };
}

/* ── Assistant content ──────────────────────────────────────────────────── */

const SUGGESTIONS: Record<AssistantScope, string[]> = {
  job: [
    "Why am I One Fix Away rather than Apply Now?",
    "Is this posting still open?",
    "What would make me a strong candidate here, not just eligible?",
    "Which of my projects should I mention in the application?",
  ],
  skip: ["Why should I skip this?", "Could this ever become reachable?"],
  fix: [
    "Why is this a signal gap and not a knowledge gap?",
    "Which of the three steps matters most?",
  ],
  roadmap: ["Is this certificate worth it?", "Can I do this in one week instead of two?"],
  "resume-bullet": [
    "Improve this bullet without inventing anything",
    "Is this line readable for an ATS?",
  ],
  profile: ["What is my weakest evidence?", "Which source should I connect next?"],
  discover: ["Why did 51 roles drop out?", "What is blocking the most roles today?"],
};

function answerFor(scope: AssistantScope, question: string): AssistantAnswer {
  const base = {
    id: `m${Date.now()}`,
    role: "reach" as const,
    at: new Date().toISOString(),
  };

  if (scope === "profile") {
    return {
      message: {
        ...base,
        text: "Your weakest evidence is published work. Four sources are connected, but nothing shows finished output — which is why 8 of today's 54 postings cannot be fully assessed. A portfolio link would close that, and it is also what turns your Power BI proof gap into evidence.",
        citations: [
          { icon: "px-pportfolio", title: "Portfolio · not connected", detail: "Weakens 7 One Fix Away roles" },
          { icon: "px-github", title: "sales-dashboard", detail: "Private repo — 9 queries, not visible to a screener" },
        ],
        actions: [{ label: "Add portfolio", href: "/profile", tone: "primary" }],
      },
    };
  }

  if (scope === "roadmap") {
    return {
      message: {
        ...base,
        text: "Not for this milestone. None of the 8 postings this plan targets ask for a SQL certificate, and a published query set is stronger evidence than a completion badge. The paid course teaches the same three functions — you would be paying for structure, not content.",
        citations: [
          { icon: "g-cert-unnec", title: "Certificate verdict · Unnecessary", detail: "0 of 8 postings name a credential" },
          { icon: "g-portfolio", title: "Milestone 2 artefact", detail: "1 published query set — free, ~90 min of reading" },
        ],
        actions: [{ label: "Open the roadmap", href: "/roadmap", tone: "primary" }],
      },
    };
  }

  if (scope === "resume-bullet") {
    return {
      message: {
        ...base,
        text: "Yes — and without adding a claim. The bullet already describes query work; naming SQL and window functions makes it readable to a screener. What cannot be added is a percentage: no source of yours supports a turnaround figure, so that edit stays blocked.",
        citations: [
          { icon: "px-github", title: "reporting-pipeline", detail: "14 files with SQL, 3 using window functions" },
          { icon: "g-noevidence", title: "No metric evidence", detail: "Turnaround is not recorded in any source" },
        ],
        actions: [{ label: "Review the suggested edits", href: "/resume", tone: "primary" }],
      },
    };
  }

  if (scope === "skip") {
    return {
      message: {
        ...base,
        text: "The posting states five years of professional experience as a minimum, not a preference. You have four months. That is not something a project or a CV rewrite closes, which is what separates Skip from One Fix Away. Six roles in the same family at 0–2 years are open today, three of them Apply Now.",
        citations: [
          { icon: "g-req-missing", title: "Experience floor", detail: "5+ years stated as a minimum" },
          { icon: "g-nav-discover", title: "6 similar roles", detail: "Same company family, 0–2 years" },
        ],
        actions: [{ label: "Show the 6", href: "/discover", tone: "primary" }],
      },
    };
  }

  if (scope === "fix" || question.toLowerCase().includes("signal")) {
    return {
      message: {
        ...base,
        text: "Because the work already exists in your own sources. Two repositories contain real query work — one with joins and window functions — but neither README, and no line of your CV, uses the words these postings screen for. A knowledge gap would mean you could not do it; here you can, and it just is not readable.",
        citations: [
          { icon: "px-github", title: "reporting-pipeline", detail: "14 SQL files, README says “data cleaning”" },
          { icon: "px-cv", title: "CV · Experience", detail: "No line mentions SQL or databases" },
        ],
        actions: [
          { label: "Open the fix", href: "/one-fix/sql", tone: "primary" },
          { label: "Fix my CV wording", href: "/resume", tone: "secondary" },
        ],
      },
    };
  }

  return {
    message: {
      ...base,
      text: "Three of the four hard requirements are backed by your evidence. The fourth — advanced SQL — has no readable source, so the verdict cannot be Apply Now. It is not a knowledge gap: two of your repos contain query work, but neither describes it.",
      citations: [
        { icon: "px-github", title: "reporting-pipeline", detail: "14 SQL files, README says “data cleaning”" },
        { icon: "px-cv", title: "CV", detail: "No line mentions SQL or databases" },
        { icon: "g-citation", title: "bKash posting", detail: "Requirement 4 of 4, verified 6 h ago" },
      ],
      actions: [
        { label: "Open the fix", href: "/one-fix/sql", tone: "primary" },
        { label: "Fix my CV wording", href: "/resume", tone: "secondary" },
      ],
    },
  };
}
