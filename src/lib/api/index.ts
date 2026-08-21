/**
 * The typed service boundary. Every screen imports from here (or from `@/lib/hooks`),
 * never from `@/mocks` and never from `fetch`.
 */

import { http, qs } from "./client";
import type {
  AssistantAnswer,
  AssistantScope,
  DiscoveryRun,
  EngineSettings,
  EvidenceSource,
  FixDetail,
  FixSummary,
  FocusSummary,
  JobDetail,
  JobListResponse,
  JobQuery,
  JobSummary,
  OpportunityDelta,
  Plan,
  PrivacySettings,
  Profile,
  ResumeAnalysis,
  ResumeDocument,
  ResumeVersion,
  SuggestedEdit,
  Target,
} from "./types";

export * from "./types";
export { ApiError, API_BASE } from "./client";

/* ── Focus ──────────────────────────────────────────────────────────────── */

export const getFocus = () => http.get<FocusSummary>("/focus");

export const setTarget = (target: Target) =>
  http.patch<FocusSummary>("/focus/target", { ...target });

/* ── Runs ───────────────────────────────────────────────────────────────── */

/** The last *completed* run. A partial run never replaces it. */
export const getLatestRun = () => http.get<DiscoveryRun>("/runs/latest");

export const getRun = (id: string) => http.get<DiscoveryRun>(`/runs/${id}`);

export const startRun = () => http.post<DiscoveryRun>("/runs");

export const stopRun = (id: string) => http.post<DiscoveryRun>(`/runs/${id}/stop`);

/** Seeded failure path, so 12B is reachable without breaking anything. */
export const failRun = (id: string) => http.post<DiscoveryRun>(`/runs/${id}/fail`);

/* ── Jobs ───────────────────────────────────────────────────────────────── */

export const listJobs = (query: JobQuery = {}) =>
  http.get<JobListResponse>(`/jobs${qs(query as Record<string, unknown>)}`);

export const getJob = (id: string) => http.get<JobDetail>(`/jobs/${id}`);

export const saveJob = (id: string, saved: boolean) =>
  saved
    ? http.post<{ saved: boolean }>(`/jobs/${id}/save`)
    : http.del<{ saved: boolean }>(`/jobs/${id}/save`);

export const hideJob = (id: string) => http.post<{ hidden: boolean }>(`/jobs/${id}/hide`);

export const getSimilarJobs = (id: string) => http.get<JobSummary[]>(`/jobs/${id}/similar`);

export const reverifyJob = (id: string) => http.post<JobSummary>(`/jobs/${id}/reverify`);

/* ── Fixes & Delta ──────────────────────────────────────────────────────── */

export const listFixes = () => http.get<FixSummary[]>("/fixes");

export const getFix = (id: string) => http.get<FixDetail>(`/fixes/${id}`);

/** Stored against a run id. The client renders it; it never derives one. */
export const getDelta = (fixId: string) => http.get<OpportunityDelta>(`/delta/${fixId}`);

/* ── Roadmap ────────────────────────────────────────────────────────────── */

export const getPlan = () => http.get<Plan>("/roadmap");

export const startMilestone = (id: string) =>
  http.post<Plan>(`/roadmap/milestones/${id}/start`);

export const completeMilestone = (id: string) =>
  http.post<Plan>(`/roadmap/milestones/${id}/complete`);

export const skipMilestone = (id: string) =>
  http.post<Plan>(`/roadmap/milestones/${id}/skip`);

/* ── Resume ─────────────────────────────────────────────────────────────── */

export const listResumeVersions = () => http.get<ResumeVersion[]>("/resume/versions");

export const getResume = (versionId: string) =>
  http.get<ResumeDocument>(`/resume/versions/${versionId}`);

/** Accepting edits creates a version. It never overwrites. */
export const saveResumeVersion = (versionId: string, label?: string) =>
  http.post<ResumeVersion>("/resume/versions", { from: versionId, label });

export const getResumeAnalysis = (versionId: string, jobId: string | null) =>
  http.get<ResumeAnalysis>(`/resume/analysis${qs({ versionId, jobId })}`);

export const analyseJdText = (versionId: string, text: string) =>
  http.post<ResumeAnalysis>("/resume/analysis/jd", { versionId, text });

export const acceptEdit = (id: string) =>
  http.post<SuggestedEdit>(`/resume/edits/${id}/accept`);

export const rejectEdit = (id: string) =>
  http.post<SuggestedEdit>(`/resume/edits/${id}/reject`);

export const reorderResumeSections = (versionId: string, order: string[]) =>
  http.patch<ResumeDocument>(`/resume/versions/${versionId}/order`, { order });

/* ── Profile ────────────────────────────────────────────────────────────── */

export const getProfile = () => http.get<Profile>("/profile");

export const listSources = () => http.get<EvidenceSource[]>("/sources");

export const connectSource = (id: string) =>
  http.post<EvidenceSource>(`/sources/${id}/connect`);

export const reconnectSource = (id: string) =>
  http.post<EvidenceSource>(`/sources/${id}/reconnect`);

/* ── Engines & privacy ──────────────────────────────────────────────────── */

export const getEngines = () => http.get<EngineSettings>("/engines");

export const selectEngine = (id: string) =>
  http.post<EngineSettings>(`/engines/${id}/select`);

export const testEngine = (id: string) => http.post<EngineSettings>(`/engines/${id}/test`);

export const setEngineKey = (id: string, key: string) =>
  http.post<EngineSettings>(`/engines/${id}/key`, { key });

export const removeEngineKey = (id: string) =>
  http.del<EngineSettings>(`/engines/${id}/key`);

export const getPrivacy = () => http.get<PrivacySettings>("/settings/privacy");

export const setPrivacy = (patch: Partial<PrivacySettings>) =>
  http.patch<PrivacySettings>("/settings/privacy", patch);

/* ── Assistant ──────────────────────────────────────────────────────────── */

export const askAssistant = (scope: AssistantScope, subjectId: string | null, question: string) =>
  http.post<AssistantAnswer>("/assistant/ask", { scope, subjectId, question });

export const getAssistantSuggestions = (scope: AssistantScope) =>
  http.get<string[]>(`/assistant/suggestions${qs({ scope })}`);
