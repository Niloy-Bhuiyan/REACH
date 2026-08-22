# REACH — Acceptance Tests

What "done" means. Every item is observable in a browser. Playwright specs live in
`frontend/tests/`; the manual/visual items are checked with Chrome DevTools against
`design-refs/*.png`.

## A. Global — applies to every route

| # | Check |
| --- | --- |
| A1 | Page background is `#F5F3FB`. No element paints a white or grey **page**. |
| A2 | Nav reads Focus · Discover · Roadmap · Resume · Profile, same order both platforms. Active item is violet with a 3px rule. |
| A3 | No horizontal scroll of primary content at 1440, 1280, 1024, 768, 430, 390, **360**. |
| A4 | Every interactive element is at least 44×44; primary actions at least 48; the three raised controls are at least 46. |
| A5 | Keyboard tab reaches every control; focus ring is a visible 2px `#574FC0` at 2px offset. |
| A6 | Zero console errors and zero unhandled promise rejections on load and on the primary interaction. |
| A7 | Every colour-coded status also carries its word. Disabling colour never removes meaning. |
| A8 | No banned terminology anywhere in rendered text (`ATS score`, `match %`, `Career Twin`, `quick win`, `impact score`, `almost there`, `not a fit`, …). |
| A9 | With `prefers-reduced-motion: reduce`, count-ups resolve instantly, slides become fades, the console is a static list, nothing loops. |
| A10 | Every screen shows the pixel wordmark and at least one pixel glyph; all art is `image-rendering: pixelated` with true alpha (no plate on a tinted surface). |
| A11 | **No dead visible controls** — every rendered button, link, tab, toggle and chip either changes state, navigates, or opens a surface. |
| A12 | Esc closes any open overlay and returns focus to the trigger. Cmd-K / Ctrl-K opens the assistant scoped to the current object. |
| A13 | Provider logos appear **only** on `/profile/settings`. |

## B. `/` Focus

| # | Check |
| --- | --- |
| B1 | Desktop: hero 316px with both masked scenery bookends; 74px Baloo "Your Focus"; TARGET pill with a working Change; 660px search. |
| B2 | At most 9 top-level surfaces, at most 3 per row, equal heights, CTAs pinned to the bottom edge. |
| B3 | Each verdict list card shows **exactly 3 rows** plus a working see-all that lands on `/discover` pre-filtered to that verdict. |
| B4 | Apply Now card is sage with its count badge; One Fix Away CTA and its three evidence chips are apricot; Skip CTA is a quiet bordered terracotta control with terracotta chips. Sage appears on **nothing else**. |
| B5 | "Connect your world" has two labelled groups; the analysis engine is **one status row** linking to Settings — no provider grid, no Login actions. |
| B6 | Profile completion shows 82%, four source dots with words, and Add Portfolio navigates. |
| B7 | Mobile 390: verdict count strip is 3-up with colour + number + word and a 3px rule; lists show 2 rows + see-all; Skip is one collapsed review row; Delta lives inside Fastest Fix as a one-row strip. |
| B8 | Mobile scrolled (3B): hero collapses to a sticky target bar carrying role, city, type, mode and Change. |
| B9 | No-target state (3C): scenery leads, exactly one sentence, exactly one primary action, plus the CV suggestion line. |
| B10 | Search submits and lands on `/discover` with the query applied. |

## C. `/discover` Live Discovery

| # | Check |
| --- | --- |
| C1 | Starting a run opens the Activity Console — the only dark surface — with timestamped events appended one at a time, at least 300 ms apart, real counts, a progress bar and one Stop control. |
| C2 | The console shows **no reasoning**, no chain-of-thought and no fake code. |
| C3 | Console is `aria-live="polite"` on the region, not per event. |
| C4 | On completion the console collapses to a single mono summary line (found / deduped / eligible / kept / verified) with working Open log and Re-run. |
| C5 | Stopping a run leaves counts and the Delta **unchanged**, and the previous completed run stays labelled authoritative. |
| C6 | Toolbar shows at most 5 controls plus "More filters · n"; the count chip matches the number of active filters; filters actually change the result set and the visible count. |
| C7 | Verdict tabs carry counts; groups are collapsible; Apply Now is expanded first. |
| C8 | Every row carries source, last-verified in mono, evidence verdict or the single blocker with its gap type, plus Save and one verdict-coloured action. Save persists across reload. |
| C9 | Rows older than 24 h render apricot with the word `stale` and a Re-verify action; rows older than 72 h are visible but excluded from the counts. |
| C10 | Rail shows run stats, the Opportunity Delta (12 → 20, +8) with its basis and a working "Inspect the 8", the blocker tally and source provenance. |
| C11 | Mobile: console is a bottom sheet at 46% with a working Hide, results stay visible behind it; after completion it is a one-line strip; filters open in a full-width sheet with 48px controls and a live result count on the primary button. |
| C12 | **12A** — filtering to zero shows an empty state naming the filter that emptied it, quantifying it, and offering loosenings with their counts. Each loosening applies. |
| C13 | **12B** — a failed run keeps the last good results on screen, stamps them stale, names the engine and the failure stage, states they are not counted toward the Delta, and offers Keep these results / Retry / View log. |

## D. `/jobs/[id]` Job Detail

| # | Check |
| --- | --- |
| D1 | Desktop shows the Discovery rail behind the drawer with the open row selected; Previous / Next walk the group without returning to the list; scroll position is preserved on Back. |
| D2 | The verdict is a sentence. **No percentage appears anywhere on this screen.** |
| D3 | Every hard-requirement row shows its evidence and the source it came from; missing hard items are terracotta, missing preferred items are stone and labelled as optional gains with their cross-role impact. |
| D4 | Eligibility lists authorisation, graduation window, location/mode and experience floor. |
| D5 | Provenance rail shows source, first seen, last verified, posting age, deadline and the dedupe note. |
| D6 | Apply Now variant: primary is "Apply on company site", plus Save and Tailor CV. |
| D7 | One Fix Away variant: apricot header, primary is "See the One Fix" and it navigates to `/one-fix/…`; the "Why this is not a Skip" panel is present. |
| D8 | **12C** Skip variant: hard blocker stated as a fact, "also unmet" list, primary is "Show the 6", Hide this role works, and **"Apply anyway" is a demoted text link**, not a button. |
| D9 | Mobile: sheet over dimmed results, sticky action bar at 50px, swipe/Esc dismiss restores focus. |

## E. `/one-fix/[id]` One Fix Away

| # | Check |
| --- | --- |
| E1 | Blocker sentence is a 52px Baloo headline with the gap-type badge above it. |
| E2 | All three gap types render; the user's is apricot-highlighted and the other two are explicitly ruled out with their own diagnosis line. |
| E3 | Each of the three steps names its artefact and its hours in mono. |
| E4 | The affected-roles table lists other-requirement status, source, verified age and the after-verdict; each row navigates back into Job Detail. |
| E5 | The Delta audit shows 54 verified, 12 already Apply Now, 8 blocked by this only, and **4 excluded because they need a second fix**, with the exclusion stated in words. |
| E6 | The projected number counts up **once** on first reveal and does not re-run on scroll; tabular numerals keep the width fixed. |
| E7 | "Fix my CV wording now" lands on `/resume`; "Open the roadmap" lands on `/roadmap`. |
| E8 | Mobile: decision screen plus a separate audit sheet listing the 8 with closing dates; sticky bar carries the CV shortcut and the roadmap primary. |

## F. `/roadmap`

| # | Check |
| --- | --- |
| F1 | Three node states render distinctly: done (sage check), current (apricot ring, **expanded**), locked (stone, collapsed, one row tall). |
| F2 | Only the current milestone is expanded; completed and locked steps stay one row tall. |
| F3 | Every milestone names its artefact; the rail tracks "1 of 5 produced". |
| F4 | The free resource renders first at full weight in sage; the paid alternative is a dashed, quieter card headed "only if" **with a reason**. No catalogue, no provider logos, no browsing. |
| F5 | Certificate verdict is a word plus a reason with a working "how we decide". |
| F6 | Start / Mark done / Skip this step all mutate the plan and persist across reload; completing a milestone animates the node fill and rail once. |
| F7 | Delta sidebar lists affected roles with real closing dates and flags the two closing within 10 days. |
| F8 | The queued next plan is previewed but cannot be started while one is active. |
| F9 | **12E** — completing the plan reports realised +9 against predicted +8 **with the reason for the difference**, lists the evidence added, queues the next blocker, and shows no trophy, confetti, streak or XP. |
| F10 | Mobile: progression list with one step open, sticky footer carrying the delta and one action, milestone sheet holding resources and the verdict. |

## G. `/resume`

| # | Check |
| --- | --- |
| G1 | ATS Readiness and JD Match render side by side, each leading with a **word**, each with its own derivation, **never summed or averaged**, and neither shows a 0–100 number. |
| G2 | ATS Readiness carries "no job involved"; JD Match names the posting and says it is recomputed per job. |
| G3 | **12D** — with no JD selected, JD Match reads "Not yet measured" on a dashed surface with an **empty** track, ATS Readiness stays live, and the available-without-a-job actions are listed and work. |
| G4 | Keywords are grouped as high-priority missing / lower-priority missing / matched, each group **labelled**, colour never the only cue. |
| G5 | Every suggested edit shows before, after, why and evidence, with working Accept and Reject. |
| G6 | The no-evidence edit renders terracotta with **Accept disabled**, a stated reason, and a working route to add evidence. Accept cannot be forced by keyboard. |
| G7 | Accepting marks the preview with a violet rule and the word "pending"; nothing is written until saved; saving creates a **new version** and the previous version still exists. |
| G8 | Section reorder works by drag **and** by keyboard. |
| G9 | Editor states evidence health per section (7 of 9 skills backed, 1 project without a link, publications empty and hidden). |
| G10 | Mobile is three tabs (Analysis / Edits / Preview), never three panes; each has one sticky primary at 48–50px; the Edits tab shows one card at a time including the blocked state. |
| G11 | The preview never renders below 320px wide; the reading surface is `#FFFDF8`. |

## H. `/profile`

| # | Check |
| --- | --- |
| H1 | Completeness is stated as capability first ("enough to judge 46 of today's 54 postings"), with 82% as a supporting figure. |
| H2 | The costly gap is named at the top with what it costs and exactly one action. |
| H3 | Evidence sources and AI engines are separate sections with different visual weight. |
| H4 | Four connection states render correctly: connected/syncing (sage), needs attention (apricot + reason + Reconnect), not connected (stone, effect stated), missing-and-costing (violet). Reconnect and Connect both work. |
| H5 | Every skill row carries its evidence, its gap type and the role count it affects. |
| H6 | Eligibility is its own group and includes the apricot row that blocks 6 senior roles. |
| H7 | Nothing social: no headline, no connections, no endorsements, no recruiter view; the "nothing here is public" note is present. |
| H8 | Mobile: sources as status rows; engine configuration opens in a sheet. |

## I. `/profile/settings`

| # | Check |
| --- | --- |
| I1 | Engines are **rows with radios**, not cards; selecting one persists and is reflected on Home's engine status row. |
| I2 | Every engine declares sees / never sees / retention; the local option states its real cost. |
| I3 | The fallback ladder is stated explicitly ("one retry, then REACH-hosted, and the run summary says it happened"). |
| I4 | "What the engine cannot do" lists all four guarantees. |
| I5 | Test connection works; the seeded bad key returns 401 and the UI flips to **12F** — terracotta notice naming the provider error and time, the fallback shown as already in effect, and evidence explicitly unaffected. |
| I6 | Privacy toggles persist; "Let engines see contact details" is off by default. |
| I7 | Changing the engine shows the apricot consequence notice (the Delta may move, eligibility verdicts will not) — apricot, not terracotta. |
| I8 | Mobile: grouped list at 48px rows with the active engine summarised in place; the choice is made in a sheet; nothing is more than one tap from Profile. |

## J. Contextual Assistant

| # | Check |
| --- | --- |
| J1 | Closed on load on every route. Never a floating bubble. The entry control is labelled with the current object. |
| J2 | Cmd-K opens it scoped to the current object; the URL gains `?ask=<scope>` and a reload restores the same scoped conversation. |
| J3 | The scope row names the object and Change actually re-scopes. |
| J4 | Loading is a skeleton at answer geometry plus a mono status naming what is being read — **no spinner, no typing dots, no thinking indicator**. |
| J5 | Answers cite evidence rows and end in a product action that navigates. |
| J6 | The error state names the engine, states nothing changed, and offers Retry plus the configured fallback. |
| J7 | Suggested questions differ per scope; the four specimened variants are reachable. |
| J8 | The standing footer note about accept / reject is present. |
| J9 | Desktop drawer is 460px (440 at 1280, 420 at 1024) and traps focus; mobile sheet is 78% and traps focus; both restore focus on close. |

## K. Responsive sweep

Run every route at **1440×900, 1280×800, 1024×768, 768×1024, 430×932, 390×844, 360×800** and check:

| # | Check |
| --- | --- |
| K1 | No horizontal overflow (`document.documentElement.scrollWidth <= clientWidth`). |
| K2 | Top nav below 768 is replaced by the bottom bar; above 768 the bottom bar is gone. |
| K3 | At 768–1023 drawers become full-height sheets and tables become 2-line stacked rows. |
| K4 | At 1024–1279 3-up becomes 2+1 and Resume drops to two panes. |
| K5 | Verdict counts are visible at every width. Search is never hidden. |
| K6 | At 360–389 nav labels may truncate but never disappear; nothing renders below 12px. |
| K7 | Layouts are **recomposed**, not scaled — no `transform: scale` on a desktop grid. |

---

## How these are run

| Layer | Command | Covers |
| --- | --- | --- |
| Responsive sweep | `npx playwright test tests/responsive.spec.ts` | §K, plus §A1–A8 per route per width |
| Interactions | `npx playwright test tests/interactions.spec.ts` | §B–§J behaviour, including every Iteration 12 state |
| Accessibility | `npx playwright test tests/accessibility.spec.ts` | §A5, A9–A12 |
| Everything | `npx playwright test` | 126 tests |

Reaching the states that have no visible trigger, by design:

| State | How |
| --- | --- |
| 12A · Discover no results | `/discover?verdict=skip&mode=Remote` |
| 12B · run failed | `/discover?state=failed` |
| 12C · Skip verdict | `/jobs/gp-sds` |
| 12D · Resume no JD selected | `/resume`, then Clear on the target job |
| 12E · Roadmap plan complete | `/roadmap`, then Mark done on each milestone |
| 12F · Settings key invalid | `/profile/settings`, then Test connection on Claude API |
| 3C · Focus no target yet | Change the target and save with an empty role |
| Assistant engine error | Ask `/fail` in the assistant |
