/**
 * The seeded, mutable REACH store.
 *
 * Deterministic ids and timestamps offset from one session anchor, so Playwright assertions
 * are stable and every freshness band, verdict and error state is reachable without editing
 * a fixture. Nothing outside `src/mocks` may import this.
 */

import type {
  DiscoveryRun,
  Employment,
  Engine,
  EngineSettings,
  EvidenceSource,
  FixDetail,
  GapType,
  JobDetail,
  JobSummary,
  Milestone,
  OpportunityDelta,
  Plan,
  PrivacySettings,
  Profile,
  ResumeAnalysis,
  ResumeDocument,
  ResumeVersion,
  SourceKind,
  SuggestedEdit,
  Target,
  Verdict,
  WorkMode,
} from "@/lib/api/types";

/** One anchor for the whole session, so relative ages never drift mid-test. */
export const ANCHOR = Date.now();

const hoursAgo = (h: number) => new Date(ANCHOR - h * 3_600_000).toISOString();
const daysAhead = (d: number) => new Date(ANCHOR + d * 86_400_000).toISOString();

/* ── Target ─────────────────────────────────────────────────────────────── */

export const target: Target = {
  role: "Data Analyst",
  location: "Dhaka",
  employment: ["Full-time"],
  modes: ["Hybrid"],
};

/* ── Jobs ───────────────────────────────────────────────────────────────── */

interface Seed {
  id: string;
  role: string;
  company: string;
  location: string;
  mode: WorkMode;
  employment: Employment;
  verdict: Verdict;
  met: number;
  total: number;
  hours: number;
  kind: SourceKind;
  blocker?: string;
  gapType?: GapType;
  hardBlocker?: string;
  closesInDays?: number;
  salary?: string;
  experience?: string;
  /** Part of the +8: this fix is the only unmet requirement. */
  sqlOnly?: boolean;
  /** Blocked by SQL and something else — excluded from the Delta, and the exclusion is stated. */
  sqlPlus?: boolean;
  /** Vanished from source: shown for 48 h, labelled, and not counted. */
  delisted?: boolean;
}

const SOURCE_LABEL: Record<SourceKind, string> = {
  "careers-page": "Company careers page",
  "job-board": "Trusted job board",
  referral: "Referral network",
};

// The named postings the design draws, in the order it draws them.
const seeds: Seed[] = [
  // ── Apply Now · 12 ──
  { id: "walton-jda", role: "Junior Data Analyst", company: "Walton Hi-Tech", location: "Dhaka", mode: "Hybrid", employment: "Full-time", verdict: "apply-now", met: 3, total: 3, hours: 4, kind: "careers-page", closesInDays: 14, salary: "BDT 45–60k / month", experience: "0–2 years" },
  { id: "bracnet-ba", role: "Business Analyst", company: "BRACNet", location: "Dhaka", mode: "On-site", employment: "Full-time", verdict: "apply-now", met: 3, total: 3, hours: 24, kind: "job-board", closesInDays: 11 },
  { id: "pathao-ra", role: "Reporting Analyst", company: "Pathao", location: "Remote · BD", mode: "Remote", employment: "Full-time", verdict: "apply-now", met: 3, total: 3, hours: 6, kind: "careers-page", closesInDays: 18 },
  { id: "gp-dqa", role: "Data Quality Associate", company: "Grameenphone", location: "Dhaka", mode: "Hybrid", employment: "Full-time", verdict: "apply-now", met: 4, total: 4, hours: 2, kind: "referral", closesInDays: 9 },
  { id: "optimizely-fe", role: "Frontend Developer", company: "Optimizely", location: "Remote · BD", mode: "Remote", employment: "Full-time", verdict: "apply-now", met: 3, total: 3, hours: 24, kind: "job-board", closesInDays: 21 },
  { id: "sslcommerz-mis", role: "MIS Executive", company: "SSLCOMMERZ", location: "Dhaka", mode: "On-site", employment: "Full-time", verdict: "apply-now", met: 3, total: 3, hours: 8, kind: "careers-page", closesInDays: 12 },
  { id: "adn-da", role: "Data Associate", company: "ADN Telecom", location: "Dhaka", mode: "Hybrid", employment: "Full-time", verdict: "apply-now", met: 3, total: 3, hours: 11, kind: "careers-page", closesInDays: 16 },
  { id: "shohoz-ra", role: "Reporting Associate", company: "Shohoz", location: "Dhaka", mode: "Hybrid", employment: "Full-time", verdict: "apply-now", met: 4, total: 4, hours: 5, kind: "job-board", closesInDays: 7 },
  { id: "robi-anl", role: "Analytics Executive", company: "Robi Axiata", location: "Dhaka", mode: "On-site", employment: "Full-time", verdict: "apply-now", met: 3, total: 3, hours: 19, kind: "careers-page", closesInDays: 24 },
  { id: "ipdc-da", role: "Junior Data Analyst", company: "IPDC Finance", location: "Dhaka", mode: "On-site", employment: "Full-time", verdict: "apply-now", met: 3, total: 3, hours: 30, kind: "job-board", closesInDays: 10 },
  { id: "brain-da", role: "Data Analyst Intern", company: "Brain Station 23", location: "Dhaka", mode: "Hybrid", employment: "Internship", verdict: "apply-now", met: 3, total: 3, hours: 3, kind: "careers-page", closesInDays: 6 },
  { id: "augmedix-ops", role: "Operations Analyst", company: "Augmedix", location: "Dhaka", mode: "Hybrid", employment: "Full-time", verdict: "apply-now", met: 4, total: 4, hours: 13, kind: "referral", closesInDays: 15 },

  // ── One Fix Away · 18 (8 of them blocked by SQL alone) ──
  { id: "bkash-da", role: "Data Analyst", company: "bKash", location: "Dhaka", mode: "On-site", employment: "Full-time", verdict: "one-fix-away", met: 3, total: 4, hours: 6, kind: "careers-page", blocker: "Add SQL", gapType: "signal", closesInDays: 9, sqlOnly: true, salary: "BDT 50–70k / month", experience: "0–2 years" },
  { id: "gp-aa", role: "Analytics Associate", company: "Grameenphone", location: "Dhaka", mode: "Hybrid", employment: "Full-time", verdict: "one-fix-away", met: 4, total: 5, hours: 2, kind: "careers-page", blocker: "Add SQL", gapType: "signal", closesInDays: 17, sqlOnly: true },
  { id: "chaldal-bi", role: "Business Intelligence Intern", company: "Chaldal", location: "Dhaka", mode: "On-site", employment: "Internship", verdict: "one-fix-away", met: 2, total: 3, hours: 24, kind: "job-board", blocker: "Add SQL", gapType: "signal", closesInDays: 7, sqlOnly: true },
  { id: "shopup-ra", role: "Reporting Analyst", company: "ShopUp", location: "Remote · BD", mode: "Remote", employment: "Full-time", verdict: "one-fix-away", met: 3, total: 4, hours: 9, kind: "careers-page", blocker: "Add SQL", gapType: "signal", closesInDays: 20, sqlOnly: true },
  { id: "bracbank-mis", role: "MIS Officer", company: "BRAC Bank", location: "Dhaka", mode: "On-site", employment: "Full-time", verdict: "one-fix-away", met: 3, total: 4, hours: 4, kind: "careers-page", blocker: "Add SQL", gapType: "signal", closesInDays: 13, sqlOnly: true },
  { id: "nagad-da", role: "Data Analyst", company: "Nagad", location: "Dhaka", mode: "Hybrid", employment: "Full-time", verdict: "one-fix-away", met: 3, total: 4, hours: 7, kind: "careers-page", blocker: "Add SQL", gapType: "signal", closesInDays: 22, sqlOnly: true },
  { id: "sheba-anl", role: "Analytics Officer", company: "Sheba.xyz", location: "Dhaka", mode: "Hybrid", employment: "Full-time", verdict: "one-fix-away", met: 3, total: 4, hours: 15, kind: "job-board", blocker: "Add SQL", gapType: "signal", closesInDays: 26, sqlOnly: true },
  { id: "walton-bi", role: "BI Associate", company: "Walton Hi-Tech", location: "Dhaka", mode: "On-site", employment: "Full-time", verdict: "one-fix-away", met: 3, total: 4, hours: 21, kind: "referral", blocker: "Add SQL", gapType: "signal", closesInDays: 19, sqlOnly: true },

  // SQL + a second gap — visible, but excluded from the +8, and the exclusion is stated.
  { id: "bjit-be", role: "Backend Developer", company: "BJIT Group", location: "Dhaka", mode: "Hybrid", employment: "Full-time", verdict: "one-fix-away", met: 3, total: 4, hours: 48, kind: "job-board", blocker: "Add Django", gapType: "knowledge", closesInDays: 12, sqlPlus: true },
  { id: "pathao-pa", role: "Product Associate", company: "Pathao", location: "Dhaka", mode: "Hybrid", employment: "Full-time", verdict: "one-fix-away", met: 3, total: 4, hours: 9, kind: "careers-page", blocker: "Add Excel", gapType: "proof", closesInDays: 8, sqlPlus: true },
  { id: "tenms-de", role: "Data Engineer Intern", company: "10 Minute School", location: "Dhaka", mode: "Hybrid", employment: "Internship", verdict: "one-fix-away", met: 2, total: 3, hours: 30, kind: "job-board", blocker: "Add Django", gapType: "knowledge", closesInDays: 14, sqlPlus: true },
  { id: "dhakabank-da", role: "Data Analyst", company: "Dhaka Bank", location: "Dhaka", mode: "On-site", employment: "Full-time", verdict: "one-fix-away", met: 3, total: 4, hours: 26, kind: "careers-page", blocker: "Add Tableau", gapType: "proof", closesInDays: 23, sqlPlus: true },

  { id: "ollyo-ma", role: "Marketing Analyst", company: "Ollyo", location: "Dhaka", mode: "Hybrid", employment: "Full-time", verdict: "one-fix-away", met: 3, total: 4, hours: 33, kind: "job-board", blocker: "Add Google Analytics", gapType: "proof", closesInDays: 18 },
  { id: "therap-qa", role: "Quality Analyst", company: "Therap BD", location: "Dhaka", mode: "On-site", employment: "Full-time", verdict: "one-fix-away", met: 3, total: 4, hours: 41, kind: "careers-page", blocker: "Add test automation", gapType: "knowledge", closesInDays: 25 },
  { id: "cefalo-da", role: "Data Analyst", company: "Cefalo", location: "Dhaka", mode: "Hybrid", employment: "Full-time", verdict: "one-fix-away", met: 3, total: 4, hours: 52, kind: "job-board", blocker: "Add Power BI proof", gapType: "proof", closesInDays: 16 },
  { id: "kona-ba", role: "Business Analyst", company: "Kona Software Lab", location: "Dhaka", mode: "On-site", employment: "Full-time", verdict: "one-fix-away", met: 3, total: 4, hours: 60, kind: "careers-page", blocker: "Add BRD writing", gapType: "signal", closesInDays: 21 },
  { id: "divine-mis", role: "MIS Analyst", company: "Divine Group", location: "Dhaka", mode: "On-site", employment: "Full-time", verdict: "one-fix-away", met: 2, total: 3, hours: 68, kind: "job-board", blocker: "Add ERP exposure", gapType: "knowledge", closesInDays: 27 },
  { id: "gigatech-da", role: "Data Annotator Lead", company: "Giga Tech", location: "Dhaka", mode: "Hybrid", employment: "Full-time", verdict: "one-fix-away", met: 3, total: 4, hours: 68, kind: "job-board", blocker: "Add NLP basics", gapType: "knowledge", closesInDays: 30 },

  // ── Skip · 24 ──
  { id: "gp-sds", role: "Senior Data Scientist", company: "Grameenphone", location: "Dhaka", mode: "On-site", employment: "Full-time", verdict: "skip", met: 2, total: 4, hours: 2, kind: "careers-page", hardBlocker: "Need 5+ years", closesInDays: 20 },
  { id: "synesis-ios", role: "iOS Developer", company: "Synesis IT", location: "Dhaka", mode: "On-site", employment: "Full-time", verdict: "skip", met: 1, total: 4, hours: 12, kind: "job-board", hardBlocker: "Need Swift", closesInDays: 15 },
  { id: "bjit-devops", role: "DevOps Engineer", company: "BJIT Group", location: "Dhaka", mode: "Hybrid", employment: "Full-time", verdict: "skip", met: 1, total: 4, hours: 30, kind: "careers-page", hardBlocker: "Need AWS", closesInDays: 12 },
  { id: "dream71-ux", role: "UI/UX Designer", company: "Dream71", location: "Dhaka", mode: "On-site", employment: "Full-time", verdict: "skip", met: 1, total: 3, hours: 40, kind: "job-board", hardBlocker: "Need Figma", closesInDays: 9 },
];

const SKIP_FILLERS: [string, string, string][] = [
  ["iOS Engineer", "Enosis Solutions", "Need Swift"],
  ["Mobile Developer", "Selise", "Need Swift"],
  ["Swift Developer", "Riseup Labs", "Need Swift"],
  ["iOS Developer", "Astha IT", "Need Swift"],
  ["Mobile Engineer", "Vivasoft", "Need Swift"],
  ["iOS Developer", "Kaz Software", "Need Swift"],
  ["iOS Engineer", "Nascenia", "Need Swift"],
  ["Mobile Developer", "Reve Systems", "Need Swift"],
  ["Cloud Engineer", "Datasoft", "Need AWS"],
  ["Platform Engineer", "Orbund", "Need AWS"],
  ["SRE", "Pathao", "Need AWS"],
  ["Cloud Architect", "Beximco IT", "Need AWS"],
  ["Infrastructure Engineer", "Bikroy", "Need AWS"],
  ["DevOps Associate", "Shohoz", "Need AWS"],
  ["Product Designer", "Shikho", "Need Figma"],
  ["UX Researcher", "Bongo", "Need Figma"],
  ["Visual Designer", "Priyo", "Need Figma"],
  ["UI Designer", "Doer Services", "Need Figma"],
  ["Data Scientist", "Truck Lagbe", "Need UK work permit"],
  ["Analytics Manager", "Unilever BD", "Need UK work permit"],
];

SKIP_FILLERS.forEach(([role, company, hardBlocker], i) => {
  seeds.push({
    id: `skip-${i + 1}`,
    role,
    company,
    location: hardBlocker.includes("permit") ? "London · UK" : "Dhaka",
    mode: i % 3 === 0 ? "Hybrid" : "On-site",
    employment: "Full-time",
    verdict: "skip",
    met: 1,
    total: 4,
    // One posting past 72 h so the expired band — shown, but excluded from every count — is real.
    hours: 14 + (i % 18) * 3,
    kind: i % 2 === 0 ? "job-board" : "careers-page",
    hardBlocker,
    closesInDays: 10 + i,
  });
});

// Rule 03 — retained 48 h, labelled "no longer listed at source", and it stops counting the
// moment it is flagged. It is a 55th row, so the run's stored 12 / 18 / 24 does not move.
seeds.push({
  id: "delisted-1",
  role: "Insights Analyst",
  company: "Bikroy",
  location: "Dhaka",
  mode: "Hybrid",
  employment: "Full-time",
  verdict: "apply-now",
  met: 3,
  total: 3,
  hours: 8,
  kind: "job-board",
  closesInDays: 5,
  delisted: true,
});

function toSummary(seed: Seed): JobSummary {
  return {
    id: seed.id,
    role: seed.role,
    company: seed.company,
    companyInitial: seed.company.charAt(0),
    location: seed.location,
    mode: seed.mode,
    employment: seed.employment,
    verdict: seed.verdict,
    evidence: { met: seed.met, total: seed.total },
    blocker: seed.blocker
      ? { label: seed.blocker, gapType: seed.gapType ?? "signal", fixId: fixIdFor(seed) }
      : undefined,
    hardBlocker: seed.hardBlocker,
    provenance: {
      kind: seed.kind,
      label: SOURCE_LABEL[seed.kind],
      verifiedAt: hoursAgo(seed.hours),
      firstSeenAt: hoursAgo(seed.hours + 24 * (3 + (seed.id.length % 7))),
      closesAt: seed.closesInDays ? daysAhead(seed.closesInDays) : undefined,
      delisted: seed.delisted,
      dedupeNote:
        seed.kind === "careers-page"
          ? "Found once on the company site and once on a job board — deduplicated to the original source."
          : undefined,
    },
    saved: seed.id === "bracnet-ba",
    applyUrl: `https://example.com/careers/${seed.id}`,
    postedDaysAgo: Math.max(1, Math.round(seed.hours / 24) + 2),
    salary: seed.salary,
    experience: seed.experience,
  };
}

function fixIdFor(seed: Seed): string {
  if (seed.blocker?.includes("SQL")) return "sql";
  if (seed.blocker?.includes("Django")) return "django";
  if (seed.blocker?.includes("Excel")) return "excel";
  return "sql";
}

export const jobs: JobSummary[] = seeds.map(toSummary);
export const seedById = new Map(seeds.map((s) => [s.id, s]));

/* ── Job detail ─────────────────────────────────────────────────────────── */

const APPLY_NOW_HARD = [
  {
    id: "degree",
    label: "Bachelor's in a quantitative field",
    detail: "Statistics, CS, engineering or economics",
    state: "met" as const,
    evidence: { text: "BSc Statistics, Dhaka University — expected Dec 2026", source: "CV" },
  },
  {
    id: "excel",
    label: "Excel and spreadsheet modelling",
    detail: "Pivots, lookups, basic forecasting",
    state: "met" as const,
    evidence: { text: "Sales-forecast workbook, 3 modules", source: "Portfolio", href: "#" },
  },
  {
    id: "python",
    label: "Python for data analysis",
    detail: "pandas or equivalent",
    state: "met" as const,
    evidence: { text: "4 repos using pandas, 118 commits", source: "GitHub", href: "#" },
  },
  {
    id: "language",
    label: "Written Bangla and English",
    detail: "Reporting to non-technical stakeholders",
    state: "met" as const,
    evidence: { text: "Stated on profile, two report samples", source: "CV" },
  },
];

const APPLY_NOW_PREFERRED = [
  {
    id: "dashboard",
    label: "Dashboarding tool",
    detail: "Power BI, Tableau or Looker",
    state: "met" as const,
    evidence: { text: "Power BI coursework dashboard", source: "Portfolio", href: "#" },
  },
  {
    id: "industry",
    label: "Manufacturing or FMCG exposure",
    detail: "Industry context",
    state: "met" as const,
    evidence: { text: "Summer internship, Pran-RFL", source: "CV" },
  },
  {
    id: "sql-pref",
    label: "Advanced SQL",
    detail: "Window functions and query optimisation",
    state: "missing" as const,
    missingNote: "No evidence in your sources yet",
    unlocksElsewhere: 8,
    fixId: "sql",
  },
];

const ELIGIBILITY = [
  { label: "Work authorisation", value: "Bangladesh citizen — clear", state: "clear" as const },
  { label: "Graduation window", value: "Dec 2026 — accepted", state: "clear" as const },
  { label: "Location & mode", value: "Dhaka hybrid — matches target", state: "clear" as const },
  { label: "Experience floor", value: "0–2 years — within range", state: "clear" as const },
];

const EVIDENCE_USED = [
  { icon: "px-cv", label: "CV", detail: "3 rows" },
  { icon: "px-github", label: "GitHub", detail: "4 repos" },
  { icon: "px-pportfolio", label: "Portfolio", detail: "2 items" },
];

export /** Display names for requirement labels. An acronym is never lowercased. */
const REQUIREMENT_NAME: Record<string, string> = {
  SQL: "advanced SQL",
  Django: "Django",
  Excel: "Excel modelling",
  Tableau: "Tableau",
  "Power BI proof": "published Power BI work",
  "Google Analytics": "Google Analytics",
  "test automation": "test automation",
  "BRD writing": "BRD writing",
  "ERP exposure": "ERP exposure",
  "NLP basics": "NLP basics",
};

export function buildJobDetail(id: string): JobDetail | null {
  const summary = jobs.find((j) => j.id === id);
  const seed = seedById.get(id);
  if (!summary || !seed) return null;

  const base: JobDetail = {
    ...summary,
    companyFull: summary.company,
    team: summary.verdict === "apply-now" ? "Analytics team" : undefined,
    verdictHeadline: "",
    verdictBody: "",
    hardRequirements: [],
    preferredRequirements: [],
    eligibility: ELIGIBILITY,
    eligibilitySummary: "No blockers",
    evidenceUsed: EVIDENCE_USED,
  };

  if (summary.verdict === "apply-now") {
    return {
      ...base,
      companyFull: `${summary.company}${summary.company === "Walton Hi-Tech" ? " Industries" : ""}`,
      verdictHeadline: "You meet every hard requirement for this role.",
      verdictBody:
        "Four of four essentials are backed by evidence we can point to, you are eligible on graduation date and work authorisation, and the listing was verified four hours ago. Nothing is blocking an application today.",
      hardRequirements: APPLY_NOW_HARD,
      preferredRequirements: APPLY_NOW_PREFERRED,
      optionalGain: {
        label: "One optional gain",
        note: "Advanced SQL is only preferred here — but it is the single item blocking 8 other roles in today's run.",
        fixId: "sql",
      },
    };
  }

  if (summary.verdict === "one-fix-away") {
    const raw = summary.blocker!.label.replace("Add ", "");
    const item = REQUIREMENT_NAME[raw] ?? raw;
    return {
      ...base,
      verdictHeadline: `One requirement stands between you and this role: ${item}.`,
      verdictBody:
        summary.blocker!.gapType === "signal"
          ? `Three of four essentials are met and you are fully eligible. This is a signal gap — you have written queries in two projects, but nothing on your CV or GitHub states ${item} in the language this posting uses.`
          : `Three of four essentials are met and you are fully eligible. This is a ${summary.blocker!.gapType} gap — the work does not exist in your sources yet, so it has to be built before this reads as a strong fit.`,
      hardRequirements: [
        {
          id: "python",
          label: "Python for analysis",
          detail: "pandas or equivalent",
          state: "met",
          evidence: { text: "4 repos, 118 commits", source: "GitHub", href: "#" },
        },
        {
          id: "degree",
          label: "Statistics or quantitative degree",
          detail: "Or a closely related field",
          state: "met",
          evidence: { text: "BSc Statistics, DU", source: "CV" },
        },
        {
          id: "dashboard",
          label: "Dashboard reporting",
          detail: "Power BI, Tableau or Looker",
          state: "met",
          evidence: { text: "Power BI dashboard", source: "Portfolio", href: "#" },
        },
        {
          id: "gap",
          label: `${item.charAt(0).toUpperCase()}${item.slice(1)} — the only gap`,
          detail: "Joins, window functions, and query work described in CV language.",
          state: "missing",
          missingNote: "Two projects use queries, neither is described",
          gapType: summary.blocker!.gapType,
          effortHours: 6,
          fixId: summary.blocker!.fixId,
        },
      ],
      preferredRequirements: [],
      eligibility: ELIGIBILITY.slice(0, 2),
      whyNotSkip:
        "Skip is reserved for hard blockers — a missing licence, a visa you cannot get, an experience floor you are years from. SQL is learnable in a week and you already have the underlying work.",
    };
  }

  // Skip — 12C. The blocker is a fact, applying is demoted, the primary action moves you on.
  return {
    ...base,
    verdictHeadline: seed.hardBlocker ?? "A hard blocker makes this not worth your time now.",
    verdictBody: "",
    skipBlocker: {
      title: seed.id === "gp-sds" ? "Requires 5+ years of professional experience" : (seed.hardBlocker ?? "Hard blocker"),
      body: seed.id === "gp-sds"
        ? "You have 4 months of internship experience. This is stated as a minimum in the posting, not a preference — it is not something a project or a CV rewrite can close."
        : `${seed.hardBlocker} is stated as a requirement in the posting, not a preference. Closing it is a change of direction, not a fix.`,
    },
    alsoUnmet: [
      { label: "Team leadership", note: "Preferred", met: false },
      { label: "Python, SQL", note: "Met", met: true },
    ],
    hardRequirements: [],
    preferredRequirements: [],
    eligibility: [
      {
        label: "Experience floor",
        value: "4 months — below the stated minimum",
        state: "blocked" as const,
      },
      { label: "Work authorisation", value: "Bangladesh citizen — clear", state: "clear" as const },
    ],
    eligibilitySummary: "1 hard blocker",
  };
}

/* ── Run ────────────────────────────────────────────────────────────────── */

export const RUN_STEPS: { label: string; detail: string }[] = [
  { label: "Loading your evidence record", detail: "done" },
  { label: "Searching opportunity index", detail: "3,142 found" },
  { label: "Checking company career pages", detail: "12 / 12" },
  { label: "Querying trusted sources", detail: "6 sources" },
  { label: "Deduplicating", detail: "3,142 → 1,682" },
  { label: "Verifying listings", detail: "1,682 live" },
  { label: "Applying eligibility filters", detail: "→ 214" },
  { label: "Matching candidate evidence", detail: "4 sources used" },
  { label: "Ranking opportunities", detail: "54 / 54" },
  { label: "Identifying blockers", detail: "3 identified" },
  { label: "Calculating Opportunity Delta", detail: "12 → 20" },
  { label: "Preparing results", detail: "54 kept" },
  { label: "Run complete", detail: "verified just now" },
];

const COUNTS = {
  found: 3142,
  deduped: 1682,
  eligible: 214,
  kept: 54,
  applyNow: 12,
  oneFixAway: 18,
  skip: 24,
};

export const completedRun: DiscoveryRun = {
  id: "run-2026-08-22-a",
  status: "complete",
  startedAt: hoursAgo(0.05),
  completedAt: hoursAgo(0.03),
  step: RUN_STEPS.length,
  totalSteps: RUN_STEPS.length,
  progress: 100,
  events: RUN_STEPS.map((step, i) => ({
    id: `e${i}`,
    at: new Date(ANCHOR - (RUN_STEPS.length - i) * 3_000).toISOString(),
    label: step.label,
    detail: step.detail,
    status: "done" as const,
  })),
  counts: COUNTS,
  sources: { careersPages: 31, jobBoards: 17, referrals: 6 },
  scan: { careersPages: 12, trustedSources: 6, referralNetworks: 1 },
  authoritative: true,
};

/** The run currently on screen. A partial run never replaces `completedRun`. */
export const store = {
  latest: completedRun,
  active: null as DiscoveryRun | null,
};

/* ── Opportunity Delta ──────────────────────────────────────────────────── */

const sqlOnlyJobs = seeds.filter((s) => s.sqlOnly);

export const deltas: Record<string, OpportunityDelta> = {
  sql: {
    runId: completedRun.id,
    fixId: "sql",
    now: 12,
    after: 20,
    gain: 8,
    basis:
      "Counted from today's run: 8 postings where SQL is the only unmet requirement.",
    audit: {
      verified: 54,
      alreadyApplyNow: 12,
      blockedByThisOnly: 8,
      blockedByThisPlusOther: 4,
    },
    affected: sqlOnlyJobs.map((seed) => ({
      jobId: seed.id,
      role: seed.role,
      company: seed.company,
      location: seed.location.includes(seed.mode) ? seed.location : `${seed.location} · ${seed.mode}`,
      otherRequirements: `${seed.met} of ${seed.met} met`,
      source: seed.kind,
      verifiedAt: hoursAgo(seed.hours),
      closesAt: daysAhead(seed.closesInDays ?? 14),
      verdictAfter: "apply-now" as const,
    })),
    predicted: 8,
  },
  django: {
    runId: completedRun.id,
    fixId: "django",
    now: 12,
    after: 16,
    gain: 4,
    basis: "Counted from today's run: 4 postings where Django is the only unmet requirement.",
    audit: { verified: 54, alreadyApplyNow: 12, blockedByThisOnly: 4, blockedByThisPlusOther: 2 },
    affected: seeds
      .filter((s) => s.blocker?.includes("Django"))
      .map((seed) => ({
        jobId: seed.id,
        role: seed.role,
        company: seed.company,
        location: seed.location.includes(seed.mode) ? seed.location : `${seed.location} · ${seed.mode}`,
        otherRequirements: `${seed.met} of ${seed.met} met`,
        source: seed.kind,
        verifiedAt: hoursAgo(seed.hours),
        closesAt: daysAhead(seed.closesInDays ?? 14),
        verdictAfter: "apply-now" as const,
      })),
  },
};

/* ── Fixes ──────────────────────────────────────────────────────────────── */

export const fixes: FixDetail[] = [
  {
    id: "sql",
    jobId: "bkash-da",
    jobRole: "Data Analyst",
    jobCompany: "bKash",
    indexInRun: 1,
    runFixCount: 3,
    gapType: "signal",
    eyebrow: "You have the work — it is not described where employers can read it",
    headline: "Say SQL out loud.",
    body: "Two of your projects run real queries — a reporting pipeline and a sales dashboard — but neither your CV nor your GitHub READMEs use the words these postings screen for. Nothing needs to be learned from scratch. It needs to be written down and shown once.",
    gapTypeVerdicts: {
      knowledge: { verdict: "Not this one", ruled: "out" },
      proof: { verdict: "Partly true — one repo is private", ruled: "partly" },
      signal: { verdict: "This is your gap", ruled: "yours" },
    },
    steps: [
      {
        n: 1,
        title: "Make the two query projects public and name the SQL",
        detail:
          "Rewrite both READMEs to state joins, window functions and the tables involved",
        produces: "2 public repos",
        hours: 2,
      },
      {
        n: 2,
        title: "Write one query set that proves the advanced part",
        detail:
          "Window functions over your existing reporting data — one notebook, published",
        produces: "1 portfolio entry",
        hours: 3,
      },
      {
        n: 3,
        title: "Add two CV lines in the posting's language",
        detail: "Reviewed edit — we suggest the wording, you accept or reject each line",
        produces: "2 CV lines",
        hours: 1,
      },
    ],
    totalHours: 6,
    noCourseNote:
      "No course or certificate is needed for a signal gap. If you want one anyway, the roadmap says whether it is worth it.",
    deltaFixId: "sql",
    classificationEvidence: [
      {
        icon: "px-github",
        title: "reporting-pipeline",
        detail: "14 files with SQL · README says “data cleaning”",
      },
      {
        icon: "px-github",
        title: "sales-dashboard",
        detail: "Private repo · 9 queries, 3 with joins",
      },
      { icon: "px-cv", title: "CV · Experience", detail: "No line mentions SQL or databases" },
    ],
    nextBlocker: { label: "Django", gapType: "knowledge", roles: 4, weeks: 2 },
  },
  {
    id: "django",
    jobId: "bjit-be",
    jobRole: "Backend Developer",
    jobCompany: "BJIT Group",
    indexInRun: 2,
    runFixCount: 3,
    gapType: "knowledge",
    eyebrow: "You cannot do it yet — this one needs real learning",
    headline: "Learn Django properly.",
    body: "Nothing in your sources shows server-side web work. This is a genuine knowledge gap: about two weeks of learning plus one deployed project before it reads as real to a screener.",
    gapTypeVerdicts: {
      knowledge: { verdict: "This is your gap", ruled: "yours" },
      proof: { verdict: "Not yet — there is nothing to prove", ruled: "out" },
      signal: { verdict: "Not this one", ruled: "out" },
    },
    steps: [
      {
        n: 1,
        title: "Work through the official Django tutorial end to end",
        detail: "Models, views, templates, admin — the whole polls app, not a skim",
        produces: "1 working project",
        hours: 8,
      },
      {
        n: 2,
        title: "Rebuild one of your analysis scripts as a small Django service",
        detail: "Your reporting pipeline behind an endpoint, with tests",
        produces: "1 public repo",
        hours: 10,
      },
      {
        n: 3,
        title: "Deploy it and write the README a reviewer would read",
        detail: "One free host, one screenshot, one paragraph on the data model",
        produces: "1 deployed link",
        hours: 4,
      },
    ],
    totalHours: 22,
    noCourseNote:
      "A knowledge gap is the one case where a structured course can earn its price — the roadmap gives the certificate verdict for this one.",
    deltaFixId: "django",
    classificationEvidence: [
      { icon: "px-github", title: "No web framework in any repo", detail: "0 of 14 repos" },
      { icon: "px-cv", title: "CV · Experience", detail: "No backend or API work described" },
    ],
    nextBlocker: { label: "Tableau", gapType: "proof", roles: 2, weeks: 1 },
  },
];

/* ── Roadmap ────────────────────────────────────────────────────────────── */

const milestones: Milestone[] = [
  {
    id: "m1",
    n: 1,
    week: "Week 1 · Done",
    title: "Name the SQL in your two query projects",
    detail:
      "Rewrote both READMEs to state joins, window functions and the tables involved.",
    state: "done",
    hours: 2,
    artefact: "2 public repos",
    artefactIcon: "g-repo",
    artefactVerified: "Verified on GitHub 2 d ago",
    resources: [],
  },
  {
    id: "m2",
    n: 2,
    week: "Week 1–2 · In progress",
    title: "Publish one query set that proves the advanced part",
    detail:
      "Window functions over your existing reporting data — running totals, rank within category, a month-over-month comparison. One notebook, published with a short readme explaining the business question.",
    state: "current",
    hours: 3,
    hoursRemaining: 3,
    artefact: "1 portfolio entry",
    artefactIcon: "g-portfolio",
    blocksOpportunities: 8,
    resources: [
      {
        title: "PostgreSQL window functions tutorial",
        detail:
          "Official docs walkthrough plus 12 exercises. Covers exactly the three functions this milestone needs — nothing more.",
        cost: "free",
        costLabel: "Free",
        minutes: 90,
        href: "https://www.postgresql.org/docs/current/tutorial-window.html",
      },
      {
        title: "Structured SQL course · BDT 1,200",
        detail:
          "It teaches the same three functions — you would be paying for structure, not content.",
        cost: "paid",
        costLabel: "Paid",
        minutes: 360,
        href: "#",
        onlyIf: "you want guided practice with graded exercises",
      },
    ],
    certificate: {
      verdict: "unnecessary",
      reason:
        "None of the 8 affected postings ask for a SQL certificate. A published query set is stronger evidence and costs nothing — spend the money only if an employer names a specific credential.",
    },
  },
  {
    id: "m3",
    n: 3,
    week: "Week 2 · Locked until step 2",
    title: "Update CV and profile, then apply",
    detail:
      "Two suggested lines in the postings' language, reviewed one by one, then the 8 roles reopen as Apply Now.",
    state: "locked",
    hours: 1,
    artefact: "2 CV lines",
    artefactIcon: "g-cvline",
    resources: [],
    closesPlan: true,
  },
];

export const plan: Plan = {
  id: "plan-sql",
  fixId: "sql",
  gapType: "signal",
  title: "Make your SQL legible",
  summary:
    "Three milestones over two weeks. Each one ends with something an employer — and REACH — can actually read: a public repo, a published query set, two CV lines.",
  target,
  createdAt: hoursAgo(30),
  updatedNote: "Updated after today's run",
  status: "active",
  step: 3,
  totalSteps: 9,
  progress: 33,
  totalHours: 6,
  hoursSpent: 2,
  artefactsProduced: 1,
  artefactsTotal: 5,
  milestones,
  evidenceAdded: [
    { icon: "g-repo", label: "2 public repos", state: "Done" },
    { icon: "g-portfolio", label: "1 published query set", state: "In progress" },
    { icon: "g-cvline", label: "2 CV lines", state: "Queued" },
  ],
  queuedNext: { label: "Django", gapType: "knowledge", roles: 4, weeks: 2 },
};

/* ── Resume ─────────────────────────────────────────────────────────────── */

export const resumeVersions: ResumeVersion[] = [
  { id: "v4", label: "v4 · analyst", savedAt: hoursAgo(1), isCurrent: true },
  { id: "v3", label: "v3 · internship", savedAt: hoursAgo(24 * 10), isCurrent: false },
  { id: "v2", label: "v2 · general", savedAt: hoursAgo(24 * 20), isCurrent: false },
];

export const resumeDoc: ResumeDocument = {
  versionId: "v4",
  name: "Niloy Mahmud",
  contact: "Dhaka, Bangladesh · niloy@example.com · github.com/niloy-m",
  sections: [
    {
      id: "header",
      title: "Header & contact",
      detail: "Name, city, email, GitHub, portfolio",
      health: { label: "Complete", tone: "ok" },
    },
    {
      id: "experience",
      title: "Experience",
      detail: "3 items",
      health: { label: "1 suggested edit", tone: "attention" },
      body: [
        {
          id: "pran",
          heading: "Data Analyst Intern — Pran-RFL",
          meta: "Jun–Aug 2025",
          lines: [
            { id: "l1", text: "Cleaned and consolidated weekly sales data across 40 outlets." },
            {
              id: "l2",
              text: "Worked on monthly reporting for the sales team using spreadsheets and queries.",
            },
            { id: "l3", text: "Presented a monthly summary to the regional sales lead." },
          ],
        },
      ],
    },
    {
      id: "projects",
      title: "Projects",
      detail: "3 items · 2 linked to GitHub",
      health: { label: "1 needs a link", tone: "attention" },
      body: [
        {
          id: "p1",
          heading: "reporting-pipeline",
          meta: "Python, SQL · 14 files",
          lines: [{ id: "pl1", text: "github.com/niloy-m/reporting-pipeline" }],
        },
        {
          id: "p2",
          heading: "churn-analysis",
          meta: "pandas, scikit-learn · 41 commits",
          lines: [{ id: "pl2", text: "Customer churn model with a written error analysis." }],
        },
      ],
    },
    {
      id: "skills",
      title: "Skills",
      detail: "9 listed · 7 evidence-backed",
      health: { label: "2 unproven", tone: "attention" },
      body: [
        {
          id: "s1",
          lines: [
            {
              id: "sl1",
              text: "Python (pandas, NumPy) · SQL · Excel modelling · Power BI · statistics · Bangla & English reporting",
              emphasis: ["SQL"],
            },
          ],
        },
      ],
    },
    {
      id: "education",
      title: "Education",
      detail: "BSc Statistics · HSC",
      health: { label: "Complete", tone: "ok" },
      body: [
        {
          id: "e1",
          heading: "BSc Statistics — Dhaka University",
          meta: "2022–2026",
          lines: [],
        },
      ],
    },
    {
      id: "certificates",
      title: "Certificates",
      detail: "Google Data Analytics",
      health: { label: "Verified", tone: "ok" },
    },
    {
      id: "publications",
      title: "Publications",
      detail: "Empty · hidden from the PDF",
      health: { label: "Optional", tone: "muted" },
    },
  ],
};

export const suggestedEdits: SuggestedEdit[] = [
  {
    id: "e1",
    kind: "Wording",
    section: "Experience",
    locator: "Bullet 2",
    before:
      "Worked on monthly reporting for the sales team using spreadsheets and queries.",
    after:
      "Built monthly sales reports in SQL and Excel, using joins and window functions over the transactions table.",
    why: "“SQL” and “window functions” are high-priority terms in this JD and appear in 8 of your target postings. The claim itself is unchanged.",
    evidence: {
      icon: "px-github",
      text: "reporting-pipeline repo — 14 files with SQL, 3 using window functions, last commit Jun 2026.",
    },
    state: "pending",
  },
  {
    id: "e2",
    kind: "Wording",
    section: "Projects",
    locator: "reporting-pipeline",
    before: "Data cleaning scripts for weekly sales files.",
    after:
      "SQL and Python pipeline joining 40 outlet feeds into one weekly reporting table.",
    why: "The JD screens for pipeline and join language. Your repo already does this.",
    evidence: { icon: "px-github", text: "reporting-pipeline — 14 files, 3 with joins." },
    state: "pending",
  },
  {
    id: "e3",
    kind: "Structure",
    section: "Skills",
    locator: "Order",
    before: "Python · Excel · Power BI · SQL · statistics",
    after: "SQL · Python (pandas) · Power BI · Excel modelling · statistics",
    why: "This posting names SQL first in its requirements; matching the order helps a keyword parse.",
    evidence: { icon: "px-cv", text: "CV · Skills line, unchanged content, reordered only." },
    state: "pending",
  },
  {
    id: "e4",
    kind: "Metric",
    section: "Experience",
    locator: "Bullet 1",
    before: "Cleaned and consolidated weekly sales data across 40 outlets.",
    after: "Reduced reporting turnaround by 40%.",
    why: "Metrics are the strongest form of a bullet — where they can be supported.",
    evidence: null,
    blockedReason:
      "We cannot support a metric like this from your CV, GitHub or portfolio — REACH will not write a number you have not shown us.",
    state: "blocked",
  },
  {
    id: "e5",
    kind: "Wording",
    section: "Experience",
    locator: "Bullet 3",
    before: "Presented a monthly summary to the regional sales lead.",
    after:
      "Presented monthly performance summaries to the regional sales lead and two category managers.",
    why: "“Stakeholder reporting” is a missing lower-priority term in this JD.",
    evidence: { icon: "px-cv", text: "CV · Experience — two named stakeholders on the same line." },
    state: "pending",
  },
  {
    id: "e6",
    kind: "Formatting",
    section: "Education",
    locator: "Dates",
    before: "2022–2026",
    after: "Sep 2022 – Dec 2026",
    why: "One date format inconsistency across the document; ATS parsers read the long form more reliably.",
    evidence: { icon: "px-cv", text: "CV · three sections use the long form already." },
    state: "pending",
  },
];

export function buildAnalysis(versionId: string, jobId: string | null): ResumeAnalysis {
  const job = jobId ? jobs.find((j) => j.id === jobId) : null;

  const ats: ResumeAnalysis["atsReadiness"] = {
    value: "good",
    fill: 0.82,
    caption: "the document itself",
    derivation: [
      { label: "Parsing & structure", value: "Clean" },
      { label: "Standard headings", value: "All 5 found" },
      { label: "Readability", value: "2 long bullets" },
      { label: "Risky elements", value: "None" },
    ],
    footnote: "No job involved. This is how safely any system can read your file.",
  };

  if (!job) {
    return {
      versionId,
      jobId: null,
      jobLabel: null,
      jdParsedNote: null,
      requirementsFound: null,
      atsReadiness: ats,
      // Unavailable is never zero.
      jdMatch: null,
      keywords: [],
      keywordsPresent: null,
      keywordsTotal: null,
      edits: suggestedEdits.filter((e) => e.kind === "Formatting"),
      withoutJob: [
        {
          id: "dates",
          label: "Fix the date formats",
          detail: "2 edits",
          icon: "g-diff",
        },
        {
          id: "reorder",
          label: "Reorder sections",
          detail: "Manual",
          icon: "g-reorder",
        },
      ],
    };
  }

  return {
    versionId,
    jobId: job.id,
    jobLabel: `${job.role} · ${job.company}`,
    jdParsedNote: "JD parsed · 19 requirements found · 6 h ago",
    requirementsFound: 19,
    atsReadiness: ats,
    jdMatch: {
      value: "partial",
      fill: 0.62,
      caption: "this posting only",
      derivation: [
        { label: "Hard requirements", value: "3 of 4" },
        { label: "Skills coverage", value: "7 of 9" },
        { label: "Evidence quality", value: "Strong" },
        { label: "Experience relevance", value: "Adjacent" },
      ],
      footnote: "Recomputed per job. Never averaged with ATS Readiness.",
    },
    keywords: [
      { text: "SQL", state: "missing-high" },
      { text: "window functions", state: "missing-high" },
      { text: "stakeholder reporting", state: "missing" },
      { text: "data quality", state: "missing" },
      { text: "ETL", state: "missing" },
      { text: "Python", state: "matched" },
      { text: "pandas", state: "matched" },
      { text: "Power BI", state: "matched" },
      { text: "Excel", state: "matched" },
      { text: "statistics", state: "matched" },
      { text: "dashboards", state: "matched" },
      { text: "reporting", state: "matched" },
      { text: "forecasting", state: "matched" },
      { text: "data cleaning", state: "matched" },
      { text: "visualisation", state: "matched" },
      { text: "stakeholders", state: "matched" },
      { text: "spreadsheets", state: "matched" },
      { text: "analysis", state: "matched" },
      { text: "Bangla & English", state: "matched" },
    ],
    keywordsPresent: 14,
    keywordsTotal: 19,
    edits: suggestedEdits,
    withoutJob: [],
  };
}

/* ── Profile ────────────────────────────────────────────────────────────── */

export const sources: EvidenceSource[] = [
  {
    id: "cv",
    name: "CV",
    handle: "niloy-cv-v4.pdf",
    icon: "px-cv",
    contributes: "Education, experience, stated skills — 14 evidence rows",
    shortNote: "14 evidence rows",
    state: "connected",
    stateLabel: "Connected · parsed",
    stateDetail: "Uploaded 12 Aug",
    action: "Replace",
    syncedAt: hoursAgo(24 * 10),
  },
  {
    id: "github",
    name: "GitHub",
    handle: "@niloy-m",
    icon: "px-github",
    contributes: "14 repos, 118 commits — proof for Python, SQL, dashboards",
    shortNote: "14 repos · 2 used as evidence",
    state: "syncing",
    stateLabel: "Connected · syncing",
    stateDetail: "Last sync 2 h ago",
    action: "Manage",
    syncedAt: hoursAgo(2),
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "/in/niloy-mahmud",
    icon: "px-linkedin",
    contributes: "Roles and dates — cross-checks your CV timeline",
    shortNote: "Experience · education",
    state: "attention",
    stateLabel: "Needs attention · token expired",
    stateDetail: "Stale since 6 Aug — 3 roles unverified",
    action: "Reconnect",
    syncedAt: hoursAgo(24 * 16),
  },
  {
    id: "kaggle",
    name: "Kaggle",
    handle: "Not linked",
    icon: "",
    contributes: "Competition results — optional for your current target",
    shortNote: "Optional for Data Analyst",
    state: "not-connected",
    stateLabel: "Not connected",
    stateDetail: "No effect on today's 54 roles",
    action: "Connect",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    handle: "Not linked",
    icon: "px-pportfolio",
    contributes: "Your weakest area. Published work is how proof gaps get closed",
    shortNote: "Not linked · costing you 7 roles",
    state: "missing-costly",
    stateLabel: "Missing · costing you",
    stateDetail: "Weakens 7 One Fix Away roles",
    action: "Add link",
  },
];

export const profile: Profile = {
  name: "Niloy Mahmud",
  initials: "NM",
  headline: "BSc Statistics, Dhaka University · Graduating Dec 2026 · Dhaka",
  completeness: 82,
  capability:
    "Enough to judge 46 of today's 54 postings. The 8 we cannot fully assess are all missing the same thing: a portfolio.",
  biggestGap: {
    title: "No portfolio connected",
    cost: "Weakens 7 One Fix Away roles.",
    action: "Add portfolio",
  },
  target,
  targetDetail: [
    { label: "Desired roles", value: "Data Analyst · Business Analyst · BI Analyst" },
    { label: "Location", value: "Dhaka, Bangladesh" },
    { label: "Work mode", value: "Hybrid · Remote · On-site" },
    { label: "Employment type", value: "Full-time · internships considered" },
    { label: "Relocation", value: "Open within Bangladesh · not abroad" },
    { label: "Earliest start", value: "Jan 2027" },
  ],
  eligibility: [
    { label: "Work authorisation", value: "Bangladesh citizen", state: "clear" },
    { label: "Visa sponsorship", value: "Not required domestically", state: "clear" },
    { label: "Graduation date", value: "Dec 2026 · final year", state: "clear" },
    { label: "Experience", value: "1 internship — blocks 6 senior roles", state: "attention" },
    { label: "Notice period", value: "Not set", state: "attention" },
  ],
  skills: [
    { name: "Python · pandas", evidence: "4 repos, 118 commits · CV line", strength: "proven", rolesAffected: 31 },
    { name: "Excel modelling", evidence: "Forecast workbook · CV line", strength: "proven", rolesAffected: 22 },
    { name: "SQL", evidence: "Queries in 2 repos — not described anywhere", strength: "signal", rolesAffected: 8 },
    { name: "Power BI", evidence: "Coursework dashboard · no public link", strength: "proof", rolesAffected: 14 },
    { name: "Django", evidence: "No evidence in any source", strength: "knowledge", rolesAffected: 4 },
  ],
  projects: [
    { name: "reporting-pipeline", detail: "Public · Python, SQL · 14 files", state: "ok" },
    { name: "sales-dashboard", detail: "Private — make public to count", state: "attention" },
    { name: "churn-analysis", detail: "Public · pandas · 41 commits", state: "ok" },
  ],
  education: [
    { name: "BSc Statistics", detail: "Dhaka University · 2022–2026" },
    { name: "HSC Science", detail: "Notre Dame College · 2020" },
  ],
  certificates: [{ name: "Google Data Analytics", detail: "2025 · verified link" }],
  publications: [{ name: "No publications yet", detail: "Optional for analyst roles" }],
};

/* ── Engines ────────────────────────────────────────────────────────────── */

const engines: Engine[] = [
  {
    id: "reach",
    name: "REACH-hosted engine",
    icon: "g-engine",
    isProviderMark: false,
    blurb: "Nothing to connect. Included, rate-limited to 40 analyses a day.",
    state: "active",
    stateLabel: "Healthy",
    badge: "Default",
    health: "Healthy · 41 ms",
    quota: { used: 12, of: 40 },
    exposure: {
      sees: "Your CV text, JD text, skills list",
      neverSees: "Contact details, documents you have not analysed",
      retention: "Not retained for training",
    },
    actions: [],
  },
  {
    id: "claude",
    name: "Claude API",
    icon: "px-claude",
    isProviderMark: true,
    blurb: "Your own key. Higher limits, billed to you by Anthropic.",
    state: "available",
    stateLabel: "Key valid",
    keyMasked: "sk-ant-•••••••••••••••••••••4f2c",
    exposure: {
      sees: "CV text, JD text, your evidence rows",
      neverSees: "Contact details, files you have not analysed",
      retention: "Per Anthropic's API terms — not used for training",
    },
    actions: ["Use this engine", "Replace", "Test connection"],
  },
  {
    id: "openai",
    name: "ChatGPT / Codex-supported mode",
    icon: "px-chatgpt",
    isProviderMark: true,
    blurb: "Sign in with an OpenAI account instead of pasting a key.",
    state: "not-connected",
    stateLabel: "Not connected",
    exposure: {
      sees: "CV text, JD text",
      neverSees: "Contact details, your repositories",
      retention: "Per OpenAI's API terms",
    },
    actions: ["Connect"],
  },
  {
    id: "local",
    name: "Local model",
    icon: "g-local",
    isProviderMark: false,
    blurb:
      "Nothing leaves your machine. Slower, and JD parsing quality drops on long postings.",
    state: "not-connected",
    stateLabel: "Not detected",
    badge: "Advanced",
    endpoint: "localhost:11434",
    exposure: {
      sees: "Everything you analyse, on your own machine",
      neverSees: "Anything over the network",
      retention: "Local only",
    },
    actions: ["Detect"],
  },
];

export const engineSettings: EngineSettings = {
  engines,
  activeId: "reach",
  fallbackNote:
    "If the active engine fails mid-run, REACH retries once, then falls back to REACH-hosted and says so in the run summary. It never silently switches.",
  guarantees: [
    "Write to your CV or profile. Every suggestion goes through accept / reject.",
    "Invent employers, metrics, skills or projects. Missing evidence is shown as missing.",
    "Decide eligibility. Hard filters are rules, not model output.",
    "Change your Opportunity Delta. Counts come from the verified run.",
  ],
  consequenceNote:
    "Changing the engine re-runs analysis on next discovery — your Opportunity Delta may move by a point or two. Eligibility verdicts will not change.",
};

export const privacy: PrivacySettings = {
  shareAnonymisedOutcomes: true,
  keepAnalysedJd: true,
  enginesSeeContactDetails: false,
  discoveryFrequency: "daily",
};
