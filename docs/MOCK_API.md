# REACH — Mock API & Service Boundary

The goal is a boundary the production backend can slot into without a single UI component changing.

## The three layers

```
components / pages
        │  (hooks only — useDiscoveryRun(), useJob(id), useAcceptEdit() …)
        ▼
src/lib/api/*          typed service boundary   ← THE CONTRACT
        │  http() → fetch(`${API_BASE}${path}`)
        ▼
src/mocks/*            MSW worker (dev only)    ← REPLACEABLE
```

**Rules**

1. Components import from `@/lib/api` and `@/lib/hooks` only. Never `fetch`, never `@/mocks`.
2. Every request/response shape lives in `src/lib/api/types.ts` and is shared by the service
   functions **and** the MSW handlers, so a drift in the mock is a TypeScript error.
3. `src/lib/api/client.ts` owns the base URL, JSON parsing, error normalisation and the artificial
   latency used to exercise loading states.
4. Deleting `src/mocks/` and pointing `NEXT_PUBLIC_API_BASE` at a real server must be the whole
   migration.

```ts
// src/lib/api/client.ts
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

export class ApiError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) { super(message); }
}

export async function http<T>(path: string, init?: RequestInit): Promise<T> { … }
```

## Endpoints

All under `/api`. Verbs are the real ones the backend will implement.

### Runs & discovery

| Method | Path | Returns |
| --- | --- | --- |
| `GET` | `/runs/latest` | `DiscoveryRun` — the last **completed** run, which stays authoritative |
| `POST` | `/runs` | `DiscoveryRun` (status `running`) — starts a run |
| `GET` | `/runs/:id` | `DiscoveryRun` — polled while running; events accumulate |
| `POST` | `/runs/:id/stop` | `DiscoveryRun` (status `cancelled`) — **writes no Delta, moves no count** |
| `GET` | `/jobs` | `JobListResponse` — `?q&role&location&mode&type&posted&verdict&sort&page` |
| `GET` | `/jobs/:id` | `JobDetail` |
| `POST` | `/jobs/:id/save` · `DELETE` same | `{ saved: boolean }` |
| `POST` | `/jobs/:id/hide` | `{ hidden: true }` |
| `GET` | `/jobs/:id/similar` | `JobSummary[]` — powers the Skip verdict's "Show the 6" |

### Fixes & delta

| Method | Path | Returns |
| --- | --- | --- |
| `GET` | `/fixes` | `FixSummary[]` — the blockers identified in the latest run |
| `GET` | `/fixes/:id` | `FixDetail` — gap type, steps, evidence, affected jobs |
| `GET` | `/delta/:runId/:fixId` | `OpportunityDelta` — **stored**, never derived client-side |

### Roadmap

| Method | Path | Returns |
| --- | --- | --- |
| `GET` | `/roadmap` | `Plan` — the one active plan, plus the queued next |
| `POST` | `/roadmap/milestones/:id/start` | `Plan` |
| `POST` | `/roadmap/milestones/:id/complete` | `Plan` — may flip the plan to `complete` and produce the realised delta |
| `POST` | `/roadmap/milestones/:id/skip` | `Plan` |

### Resume

| Method | Path | Returns |
| --- | --- | --- |
| `GET` | `/resume/versions` | `ResumeVersion[]` |
| `GET` | `/resume/versions/:id` | `ResumeDocument` |
| `POST` | `/resume/versions` | `ResumeVersion` — accepting edits **creates a version, never overwrites** |
| `GET` | `/resume/analysis?versionId&jobId` | `ResumeAnalysis` — `jdMatch` is `null` when no job is selected |
| `POST` | `/resume/analysis/jd` | `ResumeAnalysis` — analyse a pasted JD (produces JD Match only) |
| `POST` | `/resume/edits/:id/accept` · `/reject` | `SuggestedEdit` |

### Profile & settings

| Method | Path | Returns |
| --- | --- | --- |
| `GET` | `/profile` | `Profile` |
| `PATCH` | `/profile/targets` · `/profile/eligibility` | `Profile` |
| `GET` | `/sources` | `EvidenceSource[]` |
| `POST` | `/sources/:id/connect` · `/reconnect` · `DELETE` | `EvidenceSource` |
| `GET` | `/engines` | `EngineState` — options, active, fallback order, health, quota |
| `POST` | `/engines/:id/select` · `/test` · `/key` | `EngineState` |
| `GET`/`PATCH` | `/settings/privacy` | `PrivacySettings` |

### Assistant

| Method | Path | Returns |
| --- | --- | --- |
| `POST` | `/assistant/ask` | `AssistantAnswer` — `{ text, citations[], actions[] }` |
| `GET` | `/assistant/suggestions?scope=…` | `string[]` — page-specific questions |

## Core types (abridged)

```ts
export type Verdict = "apply-now" | "one-fix-away" | "skip";
export type GapType = "knowledge" | "proof" | "signal";
export type Freshness = "fresh" | "stale" | "expired";   // ≤24 h · 24–72 h · >72 h
export type SourceKind = "careers-page" | "job-board" | "referral";

export interface JobSummary {
  id: string; role: string; company: string; location: string;
  mode: "Remote" | "Hybrid" | "On-site"; employment: "Full-time" | "Internship" | "Part-time";
  verdict: Verdict;
  evidence: { met: number; total: number };
  blocker?: { label: string; gapType: GapType; fixId: string };
  source: { kind: SourceKind; label: string };
  verifiedAt: string;        // ISO UTC
  firstSeenAt: string;
  closesAt?: string;
  saved: boolean;
  delisted?: boolean;        // "no longer listed at source", retained 48 h, stops counting
}

export interface RunEvent {
  at: string; label: string; detail?: string;
  status: "done" | "active" | "queued" | "failed";
}

export interface DiscoveryRun {
  id: string;
  status: "idle" | "running" | "complete" | "failed" | "cancelled";
  startedAt: string; completedAt?: string;
  step: number; totalSteps: number; progress: number;
  events: RunEvent[];
  counts: { found: number; deduped: number; eligible: number; kept: number;
            applyNow: number; oneFixAway: number; skip: number };
  sources: { careersPages: number; jobBoards: number; referrals: number };
  failure?: { stage: string; engine: string; reason: string; checked: number; of: number };
  authoritative: boolean;    // false while running — a partial run never moves a number
}

export interface OpportunityDelta {
  runId: string; fixId: string;
  now: number; after: number; gain: number;
  basis: string;                        // plain-language, always rendered
  audit: { verified: number; alreadyApplyNow: number;
           blockedByThisOnly: number; blockedByThisPlusOther: number };
  affected: { jobId: string; role: string; company: string;
              otherRequirements: string; closesAt: string;
              verdictAfter: Verdict }[];             // stored ids, not reconstructed
  predicted?: number; realised?: number; realisedReason?: string;
}

export interface Meter { value: "good" | "fair" | "poor" | "strong" | "partial" | "weak" | null;
                         label: string; derivation: { label: string; value: string }[]; }

export interface ResumeAnalysis {
  atsReadiness: Meter;                  // always present — no job involved
  jdMatch: Meter | null;                // null ⇒ render "Not yet measured", never 0%
  keywords: { text: string; state: "matched" | "missing" | "missing-high" }[];
  edits: SuggestedEdit[];
}

export interface SuggestedEdit {
  id: string; section: string; locator: string;
  before: string; after: string; why: string;
  evidence: { source: string; detail: string } | null;   // null ⇒ blocked, Accept disabled
  state: "pending" | "accepted" | "rejected" | "blocked";
}
```

## Data-contract constants

`src/lib/api/contract.ts` holds the eight thresholds from `PRODUCT.md` as named constants so a
signed-off change is one edit:

```ts
export const FRESHNESS_STALE_HOURS = 24;
export const FRESHNESS_EXPIRED_HOURS = 72;      // shown, but excluded from every count
export const DELIST_RETENTION_HOURS = 48;
export const REVERIFY_ON_OPEN_AFTER_HOURS = 6;
export const SOURCE_STALE_DAYS = 14;            // a different clock from posting freshness
```

`src/lib/utils/time.ts` is the only place that turns a timestamp into a band or a phrase
("4 h ago", "2 d ago"), so rule 02 is enforced in one function.

## The mock layer

`src/mocks/db.ts` is a single seeded, mutable store — the same 54 postings, one run, one plan, one
resume with 6 suggested edits, one profile, four engines. It is deterministic (fixed ids, fixed
timestamps offset from a session-start anchor) so Playwright assertions are stable.

Behaviours the mock actually implements, because the UI depends on them:

- **A run streams.** `POST /runs` then `GET /runs/:id` returns events appearing one at a time with
  real counts, at least 300 ms apart, matching the drawn 13-step sequence.
- **A cancelled or failed run writes no Delta and updates no count.** `authoritative` stays `false`
  and `/runs/latest` keeps returning the previous completed run.
- **Delta is stored per run.** `/delta/:runId/:fixId` is a lookup with explicit posting ids and
  closing dates. The client never computes 12, 20 or +8.
- **Freshness bands are real.** Seed rows carry ages of 2 h, 4 h, 6 h, 9 h, 1 d, 2 d and 4 d so the
  fresh / stale / expired treatments all appear, and the >72 h row is excluded from the counts.
- **Filters actually filter,** and `/jobs` returns the counts that the 12A empty state quotes
  ("Posted under 3 days removes 51 of them", "+31", "+9").
- **A blocked edit stays blocked.** `POST /resume/edits/4/accept` returns `409 no_evidence`; the UI
  never enables that Accept.
- **Engine failure is reachable.** `POST /engines/claude/test` with the seeded bad key returns
  `401 invalid_api_key` and the store flips to the fallback, exactly as frame 12F draws it.
- **Latency is deliberate** — 180–420 ms, so skeletons at real row geometry are exercised rather
  than flashing.

Local persistence (saved jobs, accepted/rejected edits, milestone progress, engine choice, privacy
toggles, filters, assistant threads) is written to `localStorage` under the `reach:` prefix and
rehydrated into the mock store on boot, so a reload keeps the user's decisions.

## Swapping in the real backend

1. Set `NEXT_PUBLIC_API_BASE` to the server origin.
2. Stop starting the worker in `Providers` (or gate it on `NODE_ENV === "development"`).
3. Delete `src/mocks/` and `public/mockServiceWorker.js`.

No component, hook or query key changes. If the server's shapes differ from `types.ts`, the diff
surfaces as TypeScript errors in `src/lib/api/*` — one layer, not one hundred call sites.
