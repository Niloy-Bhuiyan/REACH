# REACH — Frontend Scope & Architecture

Student / job-seeker frontend only. No production backend in this run.

## Stack

| Concern | Choice | Note |
| --- | --- | --- |
| Framework | Next.js 16 App Router | `params` is a `Promise`; read `frontend/node_modules/next/dist/docs/` before touching routing |
| Language | TypeScript, `strict` | |
| Styling | Tailwind v4 (`@theme` in `globals.css`) | Tokens are CSS variables; no hard-coded hexes in components |
| Server state | TanStack Query v5 | One `QueryClient`, keys centralised in `src/lib/api/keys.ts` |
| Mock API | MSW v2 browser worker | Intercepts `fetch` at the network layer, so the swap to a real backend is a base-URL change |
| Motion | Framer Motion 13 | Only the moments listed in `DESIGN_SYSTEM.md` §6 |
| Persistence | `localStorage` behind `usePersistentState` | Saved jobs, accepted/rejected edits, roadmap progress, engine settings, filters, assistant threads |
| Fonts | `next/font/google` — Baloo 2, Instrument Sans, IBM Plex Mono | |

---

## Routes

Five permanent destinations. Everything else is a child or an overlay.

| Route | Nav item | Desktop | Mobile |
| --- | --- | --- | --- |
| `/` | Focus | Full page, scenery hero, Summary Mode | Full page, cropped scenery, count strip |
| `/discover` | Discover | List + console; filters inline, progressive | List; filters in a sheet, console in a 46% sheet |
| `/jobs/[id]` | Discover (child) | Discovery rail (452px, dimmed, selected row) + 460px drawer | Full-height sheet over dimmed results |
| `/one-fix/[id]` | Discover / Focus (child) | Full page, two columns, audit table | Decision screen + audit sheet |
| `/roadmap` | Roadmap | Timeline + delta sidebar; one plan active | Progression list + milestone sheet |
| `/resume` | Resume | Three panes: editor · analysis · preview | Three tabs: Analysis · Edits · Preview |
| `/profile` | Profile | Section rail + grouped inline sections | Stacked sections, edit sheets |
| `/profile/settings` | Profile (child) | Settings rail + content, two columns | Grouped list; engine choice in a sheet |
| `?ask=<scope>` | none — overlay | 460px assistant drawer over the current page | 78% assistant sheet over the current page |

### Deviation from the handoff route map — recorded deliberately

The Handoff Index §03 names `/discover/:jobId` and `/fix/:blockerId`. The build brief names
`/jobs/[id]` and `/one-fix/[id]`. **The brief wins on the URL string**; the handoff wins on
behaviour. Both handoff paths are preserved as permanent redirects in `next.config.ts`, so nothing
that was specified against the old paths breaks:

```
/discover/:jobId  →  /jobs/:jobId
/fix/:blockerId   →  /one-fix/:blockerId
```

**"The run is never lost" is satisfied without intercepting routes.** Run state lives in the
TanStack Query cache plus `localStorage`, not in Discovery's component state, so navigating to
`/jobs/[id]` cannot discard it. Desktop `/jobs/[id]` renders the Discovery rail behind the drawer
exactly as design frame 5A draws it (list at 68% opacity, open row selected, Previous / Next walking
the group without returning to the list). Scroll position is restored from the same store.

Non-routes, on purpose: Resources (folded into Roadmap milestones — a catalogue would reintroduce
the course-marketplace failure mode), Jobs and Internships (Discover filter values), the assistant
(a URL parameter so a scoped conversation is shareable and restorable without becoming a
destination).

---

## Directory layout

```
frontend/src/
├─ app/
│  ├─ layout.tsx              root: fonts, Providers, AppShell
│  ├─ globals.css             @theme tokens, base, focus ring, reduced-motion
│  ├─ page.tsx                Focus / Home
│  ├─ discover/page.tsx
│  ├─ jobs/[id]/page.tsx
│  ├─ one-fix/[id]/page.tsx
│  ├─ roadmap/page.tsx
│  ├─ resume/page.tsx
│  ├─ profile/page.tsx
│  └─ profile/settings/page.tsx
├─ components/
│  ├─ ui/          Button Input Select Toggle Tabs Chip Badge Meter Card Drawer Sheet
│  │               DataTable Skeleton EmptyState PixelIcon Scenery SectionHead
│  ├─ shell/       AppShell AppNav MobileNav StatusLine SearchField TargetPill PageHeader
│  ├─ verdict/     VerdictBadge VerdictCountStrip VerdictTabs
│  ├─ job/         JobRow JobCard JobGroup JobDrawer RequirementRow EligibilityList ProvenanceRail
│  ├─ run/         RunConsole RunSummaryLine RunConsoleSheet RunStats
│  ├─ filters/     FilterBar FilterSheet ActiveFilterChips
│  ├─ evidence/    EvidenceRow EvidenceChip IntegrationRow SourceGrid
│  ├─ delta/       OpportunityDelta DeltaStrip DeltaAudit DeltaDrilldown
│  ├─ gap/         GapTypeBadge GapTypeRow
│  ├─ roadmap/     MilestoneNode MilestoneCard ResourceCard CertificateVerdict PlanProgress
│  ├─ resume/      MeterPair Meter ATSPanel JDMatchPanel KeywordGroups DiffCard EditQueue
│  │               ResumeEditor ResumePreview VersionMenu JDPicker
│  ├─ profile/     CompletenessCard SkillRow ProjectRow EligibilityGroup TargetsGroup
│  ├─ settings/    SettingsRail EngineRow EngineSheet EngineGuarantees PrivacyToggles
│  └─ assistant/   AssistantProvider AssistantEntry AssistantSurface AssistantMessage
│                  CitationRow ScopeRow SuggestedQuestions
├─ lib/
│  ├─ api/         client.ts types.ts keys.ts contract.ts
│  │               jobs.ts runs.ts delta.ts roadmap.ts resume.ts profile.ts settings.ts assistant.ts
│  ├─ hooks/       useMediaQuery useReducedMotion usePersistentState useFocusTrap useCountUp
│  │               useKeyboardShortcut useAssistant
│  └─ utils/       cn.ts time.ts (freshness bands + relative age) format.ts verdict.ts
└─ mocks/          browser.ts handlers.ts db.ts seed.ts MswReady.tsx
```

**Boundary rule.** `src/components/**` and `src/app/**` may import from `src/lib/**` only.
Nothing outside `src/mocks/**` may import from `src/mocks/**` except `Providers`. No component
calls `fetch` directly.

---

## Per-screen scope

### `/` — Focus (Summary Mode)

Desktop, in order: AppNav → scenery hero (316px, `hero-left`/`hero-right` masked bookends, 74px
"Your Focus", subtitle, TARGET pill with Change, 660px search) → 3 status cards (Biggest blocker
violet-tint / Fastest fix brand-secondary / View My Roadmap apricot-tint) → 3 verdict list cards
(Apply Now sage + count badge, One Fix Away apricot, Skip terracotta — **exactly 3 rows + see-all**
each) → "Connect your world. Unlock more." (2/3: Evidence sources 3-up + Analysis engine single
status row pointing at Settings) + Profile completion card (1/3, 82%, four source dots, Add
Portfolio).

Mobile 3A canonical order: hero 178px / display 34px → TARGET pill → search → **3-up verdict count
strip** → Biggest Blocker → Fastest Fix **with the Delta strip inside it** → Apply Now preview
(2 rows + see all) → One Fix Away preview (2 rows + see all) → Skip collapsed to one review row →
Roadmap card (step 3 of 9, 33%) → Connect your world → Profile completion → verified footer line →
bottom nav.
States: **3B** scrolled (hero collapses to a sticky target bar), **3C** no target yet (art leads,
one sentence, one action, plus the CV suggestion line).

**No provider logos on Home** — one engine status row only. This was an explicit audit fix.

### `/discover` — Live Discovery (Working Mode)

120px page header (title, live count, target line, search) → toolbar (4 filter controls +
"More filters · n" + Sort + Saved count) → **Activity Console** while running → verdict tabs with
counts → collapsible groups (Apply Now expanded first) → 372px rail (run stats, Opportunity Delta,
blocker tally, source provenance, evidence-in-use).

Console: 13 observable events with real counts and timestamps, progress bar, one Stop control, then
collapse to a single mono summary line with Open log / Re-run. Never shows reasoning.

States: 4A running · 4B complete · 4C mobile (console as a 46% bottom sheet with Hide, then a
10.5px strip) · **12A no results** (names the filter that emptied it and offers the single most
useful loosening with its count) · **12B run failed** (last good results stay, stamped stale,
excluded from the Delta, engine and failure stage named, Keep these results / Retry / View log).

### `/jobs/[id]` — Job Detail

One anatomy, three verdict skins: header → verdict block (a **sentence**, no percentages) → hard
requirements with per-row evidence and source → preferred + missing (optional gain with cross-role
impact) → eligibility (authorisation, graduation window, location/mode, experience floor) →
provenance rail (source, first seen, last verified, posting age, deadline, dedupe note) →
evidence-used panel.

States: 5A Apply Now · 5B One Fix Away (apricot header, "See the One Fix" primary, "Why this is not
a Skip" panel) · **12C Skip** (hard blocker stated as fact, "also unmet" list, primary becomes
"Show the 6 similar roles", **"Apply anyway" demoted to a text link**, Hide this role) ·
5C mobile sheet with a sticky action bar at 50px.

### `/one-fix/[id]` — One Fix Away (Narrative density)

Scenery bookend (`horizon-right`, 50% opacity) → back link + "FIX 1 OF 3" → gap-type badge → 52px
Baloo blocker sentence → two actions → **all three gap types shown** with yours highlighted and the
others explicitly ruled out → "The smallest useful fix" (3 steps, each naming its artefact and
hours) → "The 8 roles this unlocks" table (other-req status, source, verified age, after-verdict) →
Opportunity Delta with the full audit (54 / 12 / 8 / 4 excluded) → evidence-for-the-classification →
"Next after this" handoff to Roadmap.

Mobile: screen one is the decision, screen two is the audit sheet listing the 8.

### `/roadmap` — Personalized Roadmap (Narrative density)

Header (blocker, gap type, progress 3 of 9 / 33%, total effort, spent, artefacts 1 of 5) → vertical
timeline with three node states, **only the current milestone expanded** → per-milestone: what you
build, artefact produced, roles blocked, **free resource first (sage, full weight)**, paid
alternative (dashed, "only if", reason required), certificate verdict (word + reason + how we
decide) → delta sidebar with affected roles and closing dates → evidence-this-plan-will-add →
queued next plan, previewed but explicitly not started.

States: 7A desktop · 7B mobile (progression list + milestone sheet) · **12E plan complete**
(realised +9 against predicted +8 with the reason named, evidence added, next blocker queued, no
trophy).

### `/resume` — Resume Builder + JD Analysis (Working Mode)

Desktop three panes: editor 480px (drag-to-reorder sections with per-section evidence health) ·
analysis fluid (tabs: Analysis / Suggested edits / Keywords) · ivory preview 494px.
**MeterPair** — ATS Readiness ("no job involved") and JD Match (names the posting, "recomputed per
job, never averaged"), both leading with a word, neither showing 0–100.
Keywords grouped by consequence: high-priority missing (terracotta) / lower-priority missing
(apricot) / matched (sage), each group labelled.
Diff queue: before / after / why / evidence / accept / reject, plus the **blocked no-evidence** card
with a disabled Accept, a reason, and a route to add evidence.
Pending accepted edits mark the preview with a violet rule and the word "pending"; accepting creates
a **new version**, never overwrites.

States: 9A desktop · 9B mobile three tabs · 9C entry/state specimens (empty, parsing skeletons,
version list, manual JD paste) · **12D no JD selected** (JD Match reads **"Not yet measured"** on a
dashed surface with an empty track — never 0%; ATS Readiness stays live; the available-without-a-job
actions are listed).

### `/profile` — Career Profile (Working Mode)

Evidence completeness stated as capability ("enough to judge 46 of today's 54 postings") with 82% as
a supporting figure → biggest evidence gap named with its cost and one action → sticky section rail
→ Evidence sources table (five rows, contribution + four real connection states) → AI engine
connections (default card + quiet rows) → Targets & preferences → Eligibility (drives every Skip) →
Skills with evidence and gap type per row and the role count each affects → Projects → Education →
Certificates & publications.

Nothing social: no headline, no connections, no endorsements, no recruiter view, plus a standing
"nothing here is public" note.

### `/profile/settings` — AI / Engine Settings

Settings rail (7 groups) → **Analysis engine**: four options as rows with radios, each declaring
sees / never sees / retention, health and quota; explicit fallback ladder ("one retry, then
REACH-hosted, and the run summary says it happened") → **Evidence sources** kept visually separate
below → "What the engine cannot do" standing panel (4 guarantees) → Data & privacy toggles →
apricot consequence notice (the Delta may move a point or two; eligibility verdicts will not).

The **only** screen with provider logos, at 24–30px inside rows.

States: 11A desktop · 11B mobile grouped list + engine sheet · **12F key invalid** (terracotta
notice naming the provider error and time, **fallback already in effect**, evidence explicitly
unaffected).

### Global — Contextual Assistant

Closed by default, never on load, never a floating bubble. Entry is a labelled bordered control in
the page action row naming the current object, with Cmd-K. Desktop 460px drawer; mobile 78% sheet.
Scope row (violet) names and can change the object. Answers cite the same sage evidence rows the
rest of the product uses and end in **product actions**, not more conversation. Loading is a
skeleton plus a mono status naming what is being read. Errors name the engine, confirm nothing
changed, and offer the configured fallback. Standing footer: suggested CV changes go through
accept / reject.

Scope variants specimened: this job · Skip verdict · roadmap milestone · resume bullet · profile.

---

## Motion budget actually implemented

Framer Motion is used for exactly eight moments — console append, console collapse, drawer, sheet,
delta count-up, milestone completion, accepted-diff collapse, progress width. Everything else is a
CSS transition of at most 120 ms. `useReducedMotion` gates all of them.

## Explicitly out of scope this run

Production backend, real OAuth, real engine calls, PDF export binary, file upload parsing, account
creation/auth screens, notifications centre, recruiter or employer surfaces.
