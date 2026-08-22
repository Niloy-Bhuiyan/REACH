/**
 * The REACH service contract.
 *
 * These shapes are shared by the typed service functions in `src/lib/api/*` and by the MSW
 * handlers in `src/mocks/*`, so a drift between the mock and the contract is a type error.
 * When the production backend lands, this file is the only place its shapes need to meet ours.
 */

/* ── Vocabulary ─────────────────────────────────────────────────────────── */

export type Verdict = "apply-now" | "one-fix-away" | "skip";

/** Knowledge = cannot do it yet. Proof = can, nothing shows it. Signal = shown, wrong words. */
export type GapType = "knowledge" | "proof" | "signal";

/** ≤24 h · 24–72 h · >72 h. Expired postings are shown but excluded from every count. */
export type Freshness = "fresh" | "stale" | "expired";

export type SourceKind = "careers-page" | "job-board" | "referral";

export type WorkMode = "Remote" | "Hybrid" | "On-site";

export type Employment = "Full-time" | "Internship" | "Part-time" | "Contract";

/* ── Target ─────────────────────────────────────────────────────────────── */

export interface Target {
  role: string;
  location: string;
  employment: Employment[];
  modes: WorkMode[];
}

/* ── Jobs ───────────────────────────────────────────────────────────────── */

export interface Provenance {
  kind: SourceKind;
  label: string;
  /** ISO UTC. Rendered relative, never as a bare date. */
  verifiedAt: string;
  firstSeenAt: string;
  closesAt?: string;
  /** Retained 48 h labelled "no longer listed at source", and stops counting immediately. */
  delisted?: boolean;
  dedupeNote?: string;
}

export interface JobSummary {
  id: string;
  role: string;
  company: string;
  companyInitial: string;
  location: string;
  mode: WorkMode;
  employment: Employment;
  verdict: Verdict;
  /** "3 of 3 met" — the evidence verdict shown on every row. */
  evidence: { met: number; total: number };
  /** Present on One Fix Away rows; the single unmet item. */
  blocker?: { label: string; gapType: GapType; fixId: string };
  /** Present on Skip rows; the hard blocker that produced the verdict. */
  hardBlocker?: string;
  provenance: Provenance;
  saved: boolean;
  hidden?: boolean;
  postedDaysAgo: number;
  /** Where "Apply on company site" goes. Applying always leaves REACH. */
  applyUrl: string;
  salary?: string;
  experience?: string;
}

export interface RequirementRow {
  id: string;
  label: string;
  detail: string;
  state: "met" | "missing" | "partial";
  /** Present when met — the artefact the tick came from. Nothing is inferred. */
  evidence?: { text: string; source: string; href?: string };
  /** Present when missing — why, and what it costs elsewhere. */
  missingNote?: string;
  gapType?: GapType;
  effortHours?: number;
  /** For preferred rows: how many other roles this same item blocks. */
  unlocksElsewhere?: number;
  fixId?: string;
}

export interface EligibilityRow {
  label: string;
  value: string;
  state: "clear" | "attention" | "blocked";
}

export interface JobDetail extends JobSummary {
  companyFull: string;
  team?: string;
  /** The verdict as a sentence. There are no percentages on this screen. */
  verdictHeadline: string;
  verdictBody: string;
  hardRequirements: RequirementRow[];
  preferredRequirements: RequirementRow[];
  eligibility: EligibilityRow[];
  eligibilitySummary: string;
  evidenceUsed: { icon: string; label: string; detail: string }[];
  /** Apply Now only: a preferred item that is nonetheless blocking other roles. */
  optionalGain?: { label: string; note: string; fixId: string };
  /** One Fix Away only. */
  whyNotSkip?: string;
  /** Skip only. */
  skipBlocker?: { title: string; body: string };
  alsoUnmet?: { label: string; note: string; met: boolean }[];
}

export interface JobListResponse {
  jobs: JobSummary[];
  counts: Record<Verdict, number>;
  total: number;
  /** Every posting the filters removed, so 12A can quantify the remedy. */
  removedByFilter: { filter: string; removed: number }[];
  /** The single loosening most likely to help, with the count it would return. */
  loosenings: { id: string; label: string; gain: number }[];
}

export interface JobQuery {
  q?: string;
  verdict?: Verdict | "all";
  location?: string;
  mode?: WorkMode;
  employment?: Employment;
  postedWithinDays?: number;
  savedOnly?: boolean;
  sort?: "best-fit" | "newest" | "closing-soon";
}

/* ── Runs ───────────────────────────────────────────────────────────────── */

export interface RunEvent {
  id: string;
  /** Local wall-clock at emit, rendered in mono. */
  at: string;
  label: string;
  detail?: string;
  status: "done" | "active" | "queued" | "failed";
}

export interface RunCounts {
  found: number;
  deduped: number;
  eligible: number;
  kept: number;
  applyNow: number;
  oneFixAway: number;
  skip: number;
}

export type RunStatus = "idle" | "running" | "complete" | "failed" | "cancelled";

export interface DiscoveryRun {
  id: string;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  step: number;
  totalSteps: number;
  /** 0–100. */
  progress: number;
  events: RunEvent[];
  counts: RunCounts;
  /** Where the kept postings came from. */
  sources: { careersPages: number; jobBoards: number; referrals: number };
  /** How wide the scan was — distinct from where the kept postings came from. */
  scan: { careersPages: number; trustedSources: number; referralNetworks: number };
  /** Present on `failed`. Names the engine and the stage — never a bare error. */
  failure?: {
    stage: string;
    engine: string;
    reason: string;
    checked: number;
    of: number;
  };
  /**
   * False while running, and for any cancelled or failed run. A partial run writes no Delta
   * and updates no count — the last completed run stays authoritative.
   */
  authoritative: boolean;
}

/* ── Opportunity Delta ──────────────────────────────────────────────────── */

export interface DeltaAffectedJob {
  jobId: string;
  role: string;
  company: string;
  location: string;
  otherRequirements: string;
  source: SourceKind;
  verifiedAt: string;
  closesAt: string;
  verdictAfter: Verdict;
}

/**
 * Computed server-side at the end of a completed run and cached against that run id.
 * The client renders a stored figure and never derives one, so the same number cannot
 * differ between two screens.
 */
export interface OpportunityDelta {
  runId: string;
  fixId: string;
  now: number;
  after: number;
  gain: number;
  /** Plain-language basis, always rendered next to the number. */
  basis: string;
  audit: {
    verified: number;
    alreadyApplyNow: number;
    blockedByThisOnly: number;
    blockedByThisPlusOther: number;
  };
  /** Stored posting ids with closing dates. The drill-down is a lookup, not a guess. */
  affected: DeltaAffectedJob[];
  /** Frozen at plan creation. */
  predicted?: number;
  /** Computed from the first completed run after the last milestone closes. */
  realised?: number;
  realisedReason?: string;
}

/* ── Fixes ──────────────────────────────────────────────────────────────── */

export interface FixStep {
  n: number;
  title: string;
  detail: string;
  produces: string;
  hours: number;
}

export interface FixSummary {
  id: string;
  label: string;
  gapType: GapType;
  rolesAffected: number;
  fixable: boolean;
}

export interface FixDetail {
  id: string;
  jobId: string;
  jobRole: string;
  jobCompany: string;
  indexInRun: number;
  runFixCount: number;
  gapType: GapType;
  eyebrow: string;
  /** The 52px Baloo headline. */
  headline: string;
  body: string;
  /** All three types are shown; the other two are explicitly ruled out. */
  gapTypeVerdicts: Record<GapType, { verdict: string; ruled: "yours" | "out" | "partly" }>;
  steps: FixStep[];
  totalHours: number;
  noCourseNote: string;
  deltaFixId: string;
  /** The repos, files and CV lines that make the classification checkable. */
  classificationEvidence: { icon: string; title: string; detail: string }[];
  nextBlocker: { label: string; gapType: GapType; roles: number; weeks: number };
}

/* ── Roadmap ────────────────────────────────────────────────────────────── */

export type MilestoneState = "done" | "current" | "locked" | "skipped";

export type CertificateVerdictValue =
  | "recommended"
  | "optional"
  | "unnecessary"
  | "low-roi";

export interface Resource {
  title: string;
  detail: string;
  cost: "free" | "paid";
  costLabel: string;
  minutes: number;
  href: string;
  /** Required on the paid alternative — "only if" needs a reason. */
  onlyIf?: string;
}

export interface Milestone {
  id: string;
  n: number;
  week: string;
  title: string;
  detail: string;
  state: MilestoneState;
  hours: number;
  hoursRemaining?: number;
  artefact: string;
  artefactIcon: string;
  artefactVerified?: string;
  blocksOpportunities?: number;
  resources: Resource[];
  certificate?: {
    verdict: CertificateVerdictValue;
    reason: string;
  };
  closesPlan?: boolean;
}

export interface Plan {
  id: string;
  fixId: string;
  gapType: GapType;
  title: string;
  summary: string;
  target: Target;
  createdAt: string;
  updatedNote: string;
  status: "active" | "complete";
  step: number;
  totalSteps: number;
  progress: number;
  totalHours: number;
  hoursSpent: number;
  artefactsProduced: number;
  artefactsTotal: number;
  milestones: Milestone[];
  evidenceAdded: { icon: string; label: string; state: string }[];
  queuedNext: { label: string; gapType: GapType; roles: number; weeks: number };
  /** Present when status is complete — realised against predicted, with the reason. */
  completion?: {
    headline: string;
    predicted: number;
    realised: number;
    before: number;
    after: number;
    reason: string;
  };
}

/* ── Resume ─────────────────────────────────────────────────────────────── */

export type MeterValue =
  | "good"
  | "fair"
  | "poor"
  | "strong"
  | "partial"
  | "weak";

/**
 * Leads with a word, never a 0–100 number. `value: null` means unavailable — rendered as
 * "Not yet measured" on a dashed surface with an empty track, never as 0%.
 */
export interface MeterReading {
  value: MeterValue | null;
  /** 0–1, for the track only. Ignored when `value` is null. */
  fill: number;
  caption: string;
  derivation: { label: string; value: string }[];
  footnote: string;
}

export interface Keyword {
  text: string;
  state: "matched" | "missing" | "missing-high";
}

export interface SuggestedEdit {
  id: string;
  kind: string;
  section: string;
  locator: string;
  before: string;
  after: string;
  why: string;
  /** null ⇒ blocked. Accept is disabled and the reason is stated. */
  evidence: { icon: string; text: string } | null;
  blockedReason?: string;
  state: "pending" | "accepted" | "rejected" | "blocked";
}

export interface ResumeSection {
  id: string;
  title: string;
  detail: string;
  /** Evidence health, stated where the section is edited. */
  health: { label: string; tone: "ok" | "attention" | "muted" };
  body?: ResumeBlock[];
}

export interface ResumeBlock {
  id: string;
  heading?: string;
  meta?: string;
  lines: { id: string; text: string; pending?: boolean; emphasis?: string[] }[];
}

export interface ResumeVersion {
  id: string;
  label: string;
  savedAt: string;
  isCurrent: boolean;
}

export interface ResumeDocument {
  versionId: string;
  name: string;
  contact: string;
  sections: ResumeSection[];
}

export interface ResumeAnalysis {
  versionId: string;
  jobId: string | null;
  jobLabel: string | null;
  jdParsedNote: string | null;
  requirementsFound: number | null;
  /** Always present — a property of the document. No job involved. */
  atsReadiness: MeterReading;
  /** null when no JD is selected. Never rendered as 0%. */
  jdMatch: MeterReading | null;
  keywords: Keyword[];
  keywordsPresent: number | null;
  keywordsTotal: number | null;
  edits: SuggestedEdit[];
  /** What can still be done with no job selected. */
  withoutJob: { id: string; label: string; detail: string; icon: string }[];
}

/* ── Profile ────────────────────────────────────────────────────────────── */

export type SourceState =
  | "connected"
  | "syncing"
  | "attention"
  | "not-connected"
  | "missing-costly";

export interface EvidenceSource {
  id: string;
  name: string;
  handle: string;
  icon: string;
  contributes: string;
  /** The one-line form used where a row has no space for the full contribution. */
  shortNote: string;
  state: SourceState;
  stateLabel: string;
  stateDetail: string;
  action: string;
  /** Per-source sync age. A different clock from posting freshness — never merged. */
  syncedAt?: string;
}

export interface SkillRow {
  name: string;
  evidence: string;
  strength: "proven" | GapType;
  rolesAffected: number;
}

export interface Profile {
  name: string;
  initials: string;
  headline: string;
  completeness: number;
  /** Completeness stated as capability first; the percentage is supporting. */
  capability: string;
  biggestGap: { title: string; cost: string; action: string };
  target: Target;
  targetDetail: { label: string; value: string }[];
  eligibility: EligibilityRow[];
  skills: SkillRow[];
  projects: { name: string; detail: string; state: "ok" | "attention" }[];
  education: { name: string; detail: string }[];
  certificates: { name: string; detail: string }[];
  publications: { name: string; detail: string }[];
}

/* ── Engines & settings ─────────────────────────────────────────────────── */

export type EngineState =
  | "active"
  | "available"
  | "not-connected"
  | "key-invalid"
  | "unhealthy";

export interface Engine {
  id: string;
  name: string;
  icon: string;
  /** Third-party brand marks are permitted on Settings only. */
  isProviderMark: boolean;
  blurb: string;
  state: EngineState;
  stateLabel: string;
  badge?: string;
  health?: string;
  quota?: { used: number; of: number };
  /** Every engine declares its exposure. */
  exposure: { sees: string; neverSees: string; retention: string };
  keyMasked?: string;
  keyError?: { code: string; at: string; note: string };
  endpoint?: string;
  actions: string[];
}

export interface EngineSettings {
  engines: Engine[];
  activeId: string;
  /** The active engine when a fallback has taken over. */
  fallbackActiveId?: string;
  fallbackNote: string;
  guarantees: string[];
  consequenceNote: string;
}

export interface PrivacySettings {
  shareAnonymisedOutcomes: boolean;
  keepAnalysedJd: boolean;
  enginesSeeContactDetails: boolean;
  discoveryFrequency: "daily" | "weekly" | "manual";
}

/* ── Assistant ──────────────────────────────────────────────────────────── */

export type AssistantScope =
  | "job"
  | "skip"
  | "fix"
  | "roadmap"
  | "resume-bullet"
  | "profile"
  | "discover";

export interface AssistantCitation {
  icon: string;
  title: string;
  detail: string;
}

export interface AssistantAction {
  label: string;
  href: string;
  tone: "primary" | "secondary";
}

export interface AssistantMessage {
  id: string;
  role: "user" | "reach";
  at: string;
  text: string;
  citations?: AssistantCitation[];
  actions?: AssistantAction[];
}

export interface AssistantAnswer {
  message: AssistantMessage;
  /** Named when the engine failed. The answer says nothing changed. */
  error?: { engine: string; detail: string; fallback: string };
}

/* ── Home ───────────────────────────────────────────────────────────────── */

export interface FocusSummary {
  target: Target | null;
  counts: Record<Verdict, number>;
  biggestBlocker: {
    title: string;
    body: string;
    mobileTitle: string;
    action: string;
    href: string;
  };
  fastestFix: {
    title: string;
    body: string;
    mobileTitle: string;
    mobileBody: string;
    action: string;
    href: string;
    fixId: string;
  };
  roadmap: {
    body: string;
    step: number;
    totalSteps: number;
    progress: number;
    next: string;
    href: string;
  };
  previews: Record<Verdict, JobSummary[]>;
  skipBlockers: string[];
  sources: EvidenceSource[];
  engine: { name: string; detail: string };
  completeness: {
    percent: number;
    sources: { icon: string; label: string; state: "connected" | "missing" }[];
    note: string;
    action: string;
  };
  lastRun: { verifiedAt: string; scanned: number };
}
