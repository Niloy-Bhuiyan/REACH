# REACH — Build Status

**Updated:** 2026-08-22 · **Phases 1–9, a UI/UX rescue, then a reference-led redesign** · feature-complete
**App:** `D:\REACH\frontend` · **Git:** repo at `frontend/`

---

## Continuation state — read this first if you are a new session

1. Read `D:\REACH\CLAUDE.md`, then `docs/PRODUCT.md`, `docs/DESIGN_SYSTEM.md`,
   `docs/FRONTEND_SCOPE.md`, `docs/MOCK_API.md`, `docs/ACCEPTANCE_TESTS.md`.
2. The Claude Design handoff is mirrored locally — **you do not need the MCP**:
   - `design-refs/text/*.txt` — flattened text, one file per authoritative screen (cheap to read).
   - `design-refs/src/*.dc.html` — the originals, for exact px/hex values (`grep`/`sed` them).
   - `design-refs/*.png` — full-page screenshots of every authoritative screen.
   - `frontend/public/art/` — all 78 final true-alpha assets, byte-identical to the design project.
   - `shots/*.png` — screenshots of the build, for before/after comparison.
3. Run it: `cd frontend && npx next dev`. Tests: `npx playwright test`.

---

## UI/UX rescue (after phase 9)

The functional build was strong and the visual result was not. A rescue pass replaced the visual
system while preserving every behaviour, guarantee and service boundary.

Reversible checkpoints: local tag `pre-ui-rescue` and branch `checkpoint/pre-ui-rescue`, both
pushed, plus the remote tag `baseline-pre-ui-rescue`.

**Systemic causes found by measuring the running app, not by reading source.** Home alone carried
34 bordered boxes, 39 rounded surfaces, 17 bordered chips and 21 pixel glyphs, on a type ramp of
11 sizes where six sat within 2.5px of each other.

**What changed**

| Layer | Change |
| --- | --- |
| Typography | Geist Sans everywhere, Geist Mono for console and data. Eight-step scale. |
| Surfaces | Neutral canvas and white surfaces; `Card` defaults to `plain`; grouping is spacing and a hairline. |
| Colour | Semantic accents only. Structural UI is neutral. |
| Components | Chips for verdicts and states only; type-only section heads; underline tabs; one arrow per screen. |
| Disclosure | Provenance, run statistics, eligibility, engine exposure, keyword coverage and delta audits all moved behind `Disclosure`. |
| Pixel art | Reduced to the brand mark, One Fix Away, Roadmap and empty states. |

**Measured on Home**

| Metric | Before | After |
| --- | --- | --- |
| Words | 271 | 163 (−40%) |
| Words above the fold | 139 | 99 |
| Bordered boxes | 34 | 3 |
| Rounded surfaces | 39 | 4 |
| Bordered chips | 17 | 0 |
| Pixel glyphs | 21 | 0 in main, 1 wordmark in nav |
| Arrows | 7 | 1 |
| Distinct font sizes | 11 | 8 |

`docs/DESIGN_SYSTEM.md` §0 records what the visual layer is now; the product rules below it still
stand and are still enforced by the suite.

---

## Reference-led redesign (after the UI rescue)

Two attached reference images — a desktop landing and a mobile Discover screen — became the
visual authority for the whole product. The pass changed the visual language only: no route,
service function, data contract, mock handler or product rule moved.

**What the references settled**

| Layer | Decision |
| --- | --- |
| Paper | Warm off-white `#FAF7F2` throughout; surfaces are warm white, never clinical |
| Palette | Forest green identity, sage / apricot / terracotta as the three earth accents; violet retired |
| Type | Playfair Display for display moments, Geist Sans for the product, Geist Mono for data |
| Shape | Pills for every action and filter; 16px radius on surfaces; warm, soft elevation |
| Illustration | An SVG arch onto a valley with a path leaving the frame, flanked by leaf sprigs |
| Icons | One in-house line set replaces the pixel glyph family everywhere |
| Mobile | Composed from the mobile reference, not shrunk from desktop: a top bar that names the section, real cards with a company tile and a filled action, a segmented verdict track, and a five-icon bottom bar |

**What the references did not get to overrule**

- ATS Readiness and JD Match stay separate, never summed, never a 0–100 score.
- The Opportunity Delta stays counted, audited on the page and identical on every screen.
- Every verdict keeps its word. No colour carries meaning alone.
- The Activity Console stays dark and prominent while a run is live, then collapses to one
  provenance line with "Run log". It never shows reasoning, only observable operations.
- Evidence connections (CV, GitHub, LinkedIn, Kaggle, Portfolio) are deliberately visible on
  Focus, Profile and Settings, each with a mark and a state word. AI engines stay discoverable,
  with their controls in Settings.

**Pixel art.** Retired from the UI. The references carry no pixel art and mixing the two
systems read as two products. All 78 assets remain in `frontend/public/art`, unreferenced, so
the decision is reversible in one commit.

---

## Phase checklist

| # | Phase | Status |
| --- | --- | --- |
| 1 | Architecture + tokens + shared shell/components | ✅ done |
| 2 | Home (`/`) | ✅ done |
| 3 | Discovery (`/discover`) | ✅ done |
| 4 | Job Detail (`/jobs/[id]`) + One Fix Away (`/one-fix/[id]`) | ✅ done |
| 5 | Roadmap (`/roadmap`) | ✅ done |
| 6 | Profile (`/profile`) + Settings (`/profile/settings`) | ✅ done |
| 7 | Resume (`/resume`) | ✅ done |
| 8 | Contextual Assistant (global overlay) | ✅ done |
| 9 | Full responsive / accessibility / interaction QA | ✅ done |

---

## Verification results

**Playwright — 126 / 126 passing** (`npx playwright test`), about 2 minutes on 3 workers.

| Suite | Tests | Covers |
| --- | --- | --- |
| `tests/responsive.spec.ts` | 77 | 10 routes × 7 widths: no horizontal overflow, type floors, 44px touch targets, banned terminology, nav swap at the 768 boundary, verdict counts never dropped, zero console errors |
| `tests/interactions.spec.ts` | 32 | run streaming and collapse, stop-writes-no-count, 12A empty state, 12B failed run, save persistence, three verdict skins, 12C Skip demotion, delta audit, roadmap completion and 12E, resume blocked edit and accept flow, assistant open/scope/citations/error, 12F invalid key, provider-mark confinement, Focus routing, reduced motion |
| `tests/accessibility.spec.ts` | 17 | focus ring spec, drawer focus trap and restore, meters announce a word, console is one polite live region, verdicts are words, images described or hidden, controls named, one visible `h1` per screen, art is pixel-rendered, no inert controls |

**Production build:** `npx next build` succeeds — 9 routes, TypeScript clean.
**Lint:** `npx eslint src --max-warnings=0` clean.
**Types:** `npx tsc --noEmit` clean.

---

## Fixes made during QA

| Found by | Issue | Fix |
| --- | --- | --- |
| Chrome DevTools | MSW started twice under StrictMode; the first queries escaped to 404 | Module-level singleton in `src/mocks/start.ts`; the app renders nothing until the network is intercepted |
| Visual diff vs design | Long hard-blocker text truncated the role name on Home's Skip preview | Short blocker labels on summaries; the full sentence lives on Job Detail |
| Visual diff vs design | Discovery counts read 12 / 17 / 23 because two seeds sat past the 72 h band | All kept postings brought inside the countable bands; rule 03 is exercised by a separate delisted 55th row that is shown but not counted |
| Visual diff vs design | Best-fit sort was ordering by freshness, not by the run's ranking | Best fit now preserves the run order within each verdict group |
| Visual diff vs design | "advanced sql" lowercased in the verdict sentence | Display-name map; an acronym is never lowercased |
| Visual diff vs design | Glyphs below the fold popped in late (Next lazy-loading 700-byte images) | `loading="eager"` on `PixelIcon` |
| DNA audit | Provider marks were rendering on `/profile` | Confined to `/profile/settings`; Profile uses the engine glyph |
| DNA audit | The JD Match meter used sage, which is Apply Now only | Apricot when partial, violet when strong; sage stays single-valued |
| DNA audit | Kaggle borrowed the "no evidence" glyph, which carries the wrong meaning | Lettered tile, per the fallback ladder |
| Playwright | Notification badge 10px, `⌘K` 11px, select chevrons 11px, reorder arrows 11px | All raised to the 12px floor |
| Playwright | Wordmark, rail tabs, search input, Change, ← Profile, "Open job detail", toggles and reorder arrows were below 44px | All raised; the engine radio keeps an 18px box inside a 44px label |
| Playwright | 360px horizontal overflow on Settings' engine action column | Action column goes full width below `sm` |
| Playwright | Resume rendered both the desktop and mobile pane trees | One tree, chosen by viewport |

---

## Decisions taken (do not re-litigate)

| Decision | Reason |
| --- | --- |
| Routes are `/jobs/[id]` and `/one-fix/[id]` as the brief specifies; the handoff's `/discover/:jobId` and `/fix/:blockerId` are permanent redirects in `next.config.ts`. | The brief wins on the URL string, the handoff wins on behaviour. |
| "The run is never lost" is satisfied by keeping run state in the TanStack Query cache, not by intercepting routes. Desktop `/jobs/[id]` renders the Discovery rail behind the panel exactly as frame 5A draws it. | Simpler, deep-linkable, testable, visually identical. |
| The 12B failed-run state is reached at `/discover?state=failed`, not by a visible control. | The design never drew a "simulate failure" button, and no dead or invented controls ship. |
| Settings has no "Save changes" button; toggles and engine choice persist immediately. | The design draws one, but with immediate persistence it would be a dead control. Immediate save is the better behaviour and the guarantee copy still holds. |
| Provider marks appear only on `/profile/settings`, even though design frame 8A shows them on Profile. | DNA v2 §09 confines them to Settings, and where a screen and the DNA disagree, the DNA wins. |
| The notification control uses the deadline glyph. | There is no bell in the 52-glyph family and emoji are banned. In REACH what is worth interrupting for is a closing date or a source that stopped reporting, so the glyph carries meaning rather than decorating. |
| Pages are client components. | The app is interactive and mock-driven; MSW's browser worker intercepts client `fetch`. The service boundary is unchanged if pages later move server-side. |

---

## Known remaining issues

| Item | Impact | Note |
| --- | --- | --- |
| The eight freshness / Delta thresholds need an engineering owner's signature. | None on the frontend | Implemented as named constants in `src/lib/api/contract.ts`; a change is one edit. |
| `docs/` and the root `CLAUDE.md` sit at `D:\REACH`, outside the git repo at `D:\REACH\frontend`. | Docs are not versioned with the code | Say the word and the repo root moves up. |
| Resume section reordering is arrow-button only; there is no pointer drag. | Minor | Keyboard and pointer both work through the arrows, which is the accessible path. The design's drag handle is rendered but decorative. |
| No PDF export binary; "Export my data" writes a JSON file, and Export PDF is not implemented. | Out of scope | Explicitly out of scope for this run. |
| Company logos are lettered tiles. | Matches design | The design specifies lettered tiles until real logos exist. |
| Mobile Discovery keeps the rail's content stacked below the results rather than dropping it. | Minor deviation | Frame 4C recomposes the rail away; keeping it loses no information and preserves the derivation rule. Easy to drop if you prefer the literal frame. |

---

## Readiness for backend integration

The swap is three steps and touches no component:

1. Set `NEXT_PUBLIC_API_BASE` to the server origin.
2. Stop starting the worker in `src/app/providers.tsx` (it is already gated on `NEXT_PUBLIC_API_BASE` being unset).
3. Delete `src/mocks/` and `public/mockServiceWorker.js`.

The server must implement the endpoints in `docs/MOCK_API.md` and return the shapes in
`src/lib/api/types.ts`. Any divergence surfaces as a TypeScript error inside `src/lib/api/*` —
one layer, not one hundred call sites.

Server-side responsibilities the UI already assumes (from the data contract):

- Compute both sides of the Opportunity Delta at the end of a completed run and cache it against
  the run id, with the explicit before/after posting ids and their closing dates.
- Never let a cancelled or failed run write a Delta or move a count.
- Stamp every posting with `verifiedAt`, and flag `delisted` rather than deleting.
- Refuse a resume edit with no evidence — `409 no_evidence` — rather than relying on the UI.
- Keep evidence-source sync age on its own clock, separate from posting freshness.

---

## Commits

| Commit | Phase |
| --- | --- |
| `e9c5b50` | Initial commit from Create Next App (pre-existing) |
| `8f228d7` | Architecture, tokens, shell, Focus, Discovery, Job Detail, One Fix Away |
| `01609c8` | Roadmap, Career Profile and Profile → Settings |
| `004b5bc` | Resume Builder with JD analysis, and the contextual assistant wired through |
| `24a6c30` | Responsive, accessibility and interaction QA — 126 Playwright tests and the fixes they found |
| `(head)` | Resume preview reachable at 768–1023 as a switchable pane |

Pushed to the private repository `Niloy-Bhuiyan/REACH` on `master`.
