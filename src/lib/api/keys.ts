import type { AssistantScope, JobQuery } from "./types";

/** Query keys in one place, so cache invalidation is never guesswork. */
export const qk = {
  focus: ["focus"] as const,
  latestRun: ["runs", "latest"] as const,
  run: (id: string) => ["runs", id] as const,
  jobs: (query: JobQuery) => ["jobs", query] as const,
  job: (id: string) => ["jobs", id] as const,
  similar: (id: string) => ["jobs", id, "similar"] as const,
  fixes: ["fixes"] as const,
  fix: (id: string) => ["fixes", id] as const,
  delta: (fixId: string) => ["delta", fixId] as const,
  plan: ["roadmap"] as const,
  resumeVersions: ["resume", "versions"] as const,
  resume: (id: string) => ["resume", id] as const,
  resumeAnalysis: (versionId: string, jobId: string | null) =>
    ["resume", "analysis", versionId, jobId] as const,
  profile: ["profile"] as const,
  sources: ["sources"] as const,
  engines: ["engines"] as const,
  privacy: ["settings", "privacy"] as const,
  assistantSuggestions: (scope: AssistantScope) =>
    ["assistant", "suggestions", scope] as const,
};
