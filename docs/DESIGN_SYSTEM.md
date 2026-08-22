# REACH — Design System

> **Visual layer superseded, 2026-08-22 (second pass).** Two attached reference images — one
> desktop, one mobile — became the visual authority for the whole product. They replaced the
> *visual* system again: paper, palette, typeface, illustration, iconography and component shape.
> Those are defined in `frontend/src/app/globals.css`, summarised in §0 below, and that file is
> the source of truth.
>
> Everything below §0 that is **product rule** still stands and is still enforced: single-valued
> verdict colour, colour always paired with a word, ATS Readiness and JD Match kept separate,
> the Opportunity Delta contract, canonical terminology, motion restraint, the responsive matrix
> and the accessibility rules. Where the sections below quote old hexes, type sizes, glyph names
> or card-and-border recipes, read them as history.

## 0. The current visual system

| Concern | Current | Was (rescue) | Was (DNA v2) |
| --- | --- | --- | --- |
| Display face | Playfair Display, 400 — headlines, screen titles, role names, big figures | Geist Sans everywhere | Baloo 2 |
| Interface face | Geist Sans | Geist Sans | Instrument Sans |
| Mono | Geist Mono — console, figures, provenance | Geist Mono | IBM Plex Mono |
| Type scale | 9 steps: hero 56 · display 38 · title 26 · section 19 · subhead 16 · body 15 · sm 13.5 · meta 12.5 | 8 steps, sans only | 11 ad-hoc sizes |
| Canvas | `#FAF7F2` warm paper | `#F6F6F8` cool neutral | `#F5F3FB` violet-tinted |
| Surface | `#FFFDFA` | `#FFFFFF` | `#FBFAFE` |
| Sunken | `#F4F0E8` / `#F4EFE6` | `#F1F1F4` | — |
| Lines | `#ECE5D9` / `#F2ECE2` warm hairlines | `#ECECEF` | violet-tinted |
| Ink | `#1B1B17` / `#5A574E` / `#8B8779` | `#16161A` / `#55555F` / `#86868F` | `#101B49` / … |
| Action + identity | Forest `#4A6551` | Violet `#5B53D1` | Violet `#5B53D1` |
| Console | `#1E2320` warm dark | `#16161C` | `#1B233A` |
| Grouping | Spacing and a warm hairline. `Card` defaults to `plain`; radius 16. | Spacing; radius 12 | A bordered card per group |
| Actions | Pills — 38 / 44 / 50 high | Rounded rects | Rounded rects |
| Chips | Pills, tinted, no border. Verdicts and states only. | Rounded rects | 17 bordered chips on Home |
| Tabs | Underline for panes, segmented pill track for filters | Underline | Filled pills |
| Icons | One in-house line set, 24 box, 1.6 stroke (`components/ui/Icon.tsx`) | Pixel glyph family | Pixel glyph family |
| Illustration | SVG arch-and-valley scenery plus leaf sprigs (`components/ui/Brand.tsx`) | Pixel scenery PNGs | Pixel scenery PNGs |
| Mark | SVG peak with a path notched out of its base | Pixel `px-logo` | Pixel `px-logo` |
| Pixel art | Retired from the UI. The 78 assets stay in `public/art`, unreferenced. | Brand mark, One Fix, Roadmap, empty states | Everywhere |

### Semantic colour, retuned to the warm ground

| Meaning | Token | Value |
| --- | --- | --- |
| Apply Now | `sage` | `#4E8560`, text `#3A6B4A`, tint `#E9F1E8` |
| One Fix Away | `apricot` | `#B07C2A`, text `#8D6221`, tint `#F8EFDD` |
| Skip / hard blocker | `terracotta` | `#A85841`, text `#9C5039`, tint `#F8E9E2` |
| Action and identity | `brand` | `#4A6551`, hover `#3C5442`, tint `#EDF2EC` |

**Green appears twice, in two roles that never collide.** The brand forest is a *solid dark
fill on a verb* — a button, a link, the search action. Sage is a *pale tint behind a noun* —
the word "Apply Now". They differ by value and by shape, and the verdict always carries its
word, so no green is ever load-bearing on its own. Violet is gone from the product; the
non-negotiable it served (a brand colour that is never a verdict) is now served by the forest.

### Where the display face is allowed

The serif is a display face, not a body face. It appears on: the Focus promise, one screen
title per route, the verdict sentence on Job Detail, the One Fix and Roadmap headlines, role
names in lists and cards, milestone titles, the assistant title, and the Opportunity Delta
figures. It never sets body copy, labels, controls, metadata or console output.

---

---


Transcribed from **REACH Design DNA v2** (locked) plus the Final Handoff Index. Where a screen and
this document disagree, this document wins.

Implementation: `frontend/src/app/globals.css` (`@theme` block) is the single source of these
values in code. Never hard-code a hex that exists here.

---

## 1. Tokens

### Surfaces

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#F5F3FB` | Page base on every screen. **No white page, ever.** |
| `surface` | `#FBFAFE` | Cards, nav, panels, drawers |
| `surface-inset` | `#FFFFFF` | Tiles nested in a card only |
| `surface-read` | `#FFFDF8` | Resume preview, pasted JD, any document body (border `#E7E1D6`) |
| `surface-console` | `#1B233A` | **Activity Console only** — the only dark surface in REACH |
| `table-head` | `#F5F3FB` | Data-table header rows (the DNA-legal way to quiet a header) |
| `row-hover` | `#F7F5FD` | Row/card hover |

Console interior: text `#C4CBE0`, meta `#7C88AC`, accent `#9AA0F0`, ok `#8FBF9A`.

### Borders

| Token | Value | Use |
| --- | --- | --- |
| `border` | `#E7E4F0` | Flat card edge |
| `hairline` | `#F1EFF8` | In-card row divider (decorative) |
| `border-group` | `#DCD8EC` | Tier-2 grouping: any card whose boundary carries meaning |
| `border-control` | `#C3BCEC` | Inputs, selects, secondary buttons at rest — **1.5px** |
| `border-active` | `#574FC0` | Focus ring, selected control, active tab underline — **2px** |

### Ink

| Token | Value | Use | Contrast |
| --- | --- | --- | --- |
| `ink` | `#101B49` | Display and headings | 14.9 |
| `ink-link` | `#2E2A8C` | Navigable names | 9.8 |
| `ink-body` | `#4A5170` | Body copy | 6.7 |
| `ink-muted` | `#666C8C` | Meta, labels, timestamps — **12px floor** | 4.6 |
| `ink-placeholder` | `#6E7490` | Placeholders and inline glyphs | 4.2 |
| `ink-disabled` | `#8A8FA8` | Disabled labels — never opacity alone on text | 3.2 |

### Semantic families — single-valued

| Family | fill | text | tint | Meaning |
| --- | --- | --- | --- | --- |
| **violet** | `#6C63D8` | `#574FC0` | `#F3EFFC` | Brand and action **only**. CTAs, active nav, links, completion, selection. **Never a verdict.** |
| **sage** | `#3F7D53` | `#2E6742` | `#EEF5EF` | **Apply Now** / eligible / verified / connected / free resource **only** |
| **apricot** | `#C4762F` | `#A85C22` | `#FDF4EA` | **One Fix Away**, Roadmap, improvement, stale, attention |
| **terracotta** | `#A33F28` | `#A33F28` | `#FBEDE9` | **Skip**, hard blockers, destructive. Border `#E3BCB2`. **Quiet buttons only — no large fills.** |

- Apricot `#A85C22` replaces `#B4652A` below 16px. `#E0904F` is decoration only, never text.
- Violet selection border / rule variant: `#DED7F6`.
- Sage is **not** used for Fastest Fix, One Fix Away, Skip or Roadmap.

### Meters

Track `#EDEAF7`. Fills use the **family button tone** (`#6C63D8` / `#3F7D53` / `#C4762F`) — never
the light accent, so the indicator clears 3:1.

### Elevation

| Tier | Spec | Use |
| --- | --- | --- |
| 1 — flat | `1px #E7E4F0`, no shadow | Ordinary cards |
| 2 — grouped | `1px #DCD8EC` + `0 2px 6px -3px rgba(16,27,73,.12)` | Boundaries that carry meaning |
| 3 — overlay | `1px #DCD8EC` + `0 18px 40px -24px rgba(16,27,73,.40)` | Drawers, sheets, dialogs, search |

Max one tier per row. Shadows only on tier 3 and search.

---

## 2. Type

| Face | Use |
| --- | --- |
| **Baloo 2** (500–800) | Display and headings only. Never body copy. |
| **Instrument Sans** (400–700) | Body, labels, UI |
| **IBM Plex Mono** (400/500) | Console log, timestamps, counts in dense tables, keyword diffs, ids. **12–13px** (12px floor). Tabular numerals. |

**Floors: nothing below 12px. Body floor 14.5px.**

| Context | Display | Body |
| --- | --- | --- |
| Summary Mode | 56–74px | 14.5–17px |
| Working Mode | Page title 28–36px | 14.5px body / 13.5px table / 11.5–13px mono meta |

Home canonical: display 74px, line-height 1, letter-spacing −.03em; subtitle 17px/1.5; nav 15px;
card title 23px Baloo 700.

---

## 3. Summary Mode vs Working Mode

Same tokens, different density contract.

| Dimension | **Summary** (Focus, dashboards, empty states) | **Working** (Discover, Job Detail, One Fix, Roadmap, Resume, Profile, Settings) |
| --- | --- | --- |
| Purpose | Orient and route. Five questions in five seconds. | Operate on real data: search, compare, edit, decide. |
| Surfaces | ≤ 9 top-level, ≤ 3 per row, equal heights | No cap — but ≤ 2 scroll regions and one dominant work area ≥ 55% width |
| Lists | **Exactly 3 rows + "see all"** | 20–50 rows/page, virtualise beyond, sticky header, visible count |
| Chips | ≤ 4 per row, one line | Wrapping allowed; collapse past 12 with "+n more"; groups labelled |
| Controls | 1 CTA per card; search is the only input | Toolbar ≤ 5 controls + "More filters · n" sheet; tabs; inline row actions |
| Layout | Hero + three tiers, 22px gutters, 64px inset | Page header ≤ 140px + 8/4 or 60/40; 20–22px gutters; 32–48px inset; detail in a drawer over the list |
| Whitespace | ≥ 34% of viewport | ≥ 22%, concentrated in header and between panes |
| Pixel art | Scenery band 300–330px; 72–84px objects in status cards | Optional 80–120px header strip; 30–34px glyphs at section heads only; **never behind data** |
| Row height | 54–62px, hairline divided | 48–56px desktop, 64px touch; hover `#F7F5FD`; **no zebra** |

---

## 4. Component inventory

Build each once. States are mandatory, not optional.

| Component | States / variants |
| --- | --- |
| `AppNav` | Desktop top bar / mobile bottom bar · 5 items × active/inactive · right cluster: one status line, one bell, one avatar |
| `VerdictBadge` | Apply Now (sage) · One Fix Away (apricot) · Skip (terracotta) — **always word + colour** |
| `JobRow` / `JobCard` | Table row (desktop) · compact card (mobile) · drawer header · with-blocker · skipped-with-reason |
| `RunConsole` | Idle · running (timestamped events, counts) · complete (collapsed summary line) · failed · mobile sheet at 46% |
| `FilterBar` + `FilterSheet` | Collapsed (4 primary) · expanded · active-count chip · sheet · cleared |
| `EvidenceRow` | Met (sage, cites the artefact) · missing hard (terracotta) · missing preferred (stone) · partial |
| `OpportunityDelta` | Desktop full (now → after, +n, derivation) · mobile inline strip · drill-down list with closing dates |
| `GapTypeBadge` | Knowledge · Proof · Signal — own glyph + one-line diagnosis |
| `MilestoneNode` | Done (sage check) · current (apricot ring, expanded) · locked (stone, collapsed) · skipped |
| `ResourceCard` | Free (sage, full weight, **first**) · paid alternative (dashed, quieter, "only if", reason required) |
| `CertificateVerdict` | Recommended · Optional · Unnecessary · Low ROI — word + reason + "how we decide" |
| `MeterPair` | ATS Readiness + JD Match side by side · never summed · each with its own derivation · no-JD state |
| `DiffCard` | Before · after · why · evidence · accept · reject · **blocked: no evidence** · accepted · rejected |
| `KeywordTag` | Matched (sage) · missing lower-priority (apricot) · high-priority missing (terracotta) |
| `AssistantSurface` | Closed entry · loading (skeleton + mono status) · answered (citations + product action) · error (engine named, nothing changed) · 4 scope variants |
| `IntegrationRow` | Evidence source: synced / stale / optional-for-this-target / not connected. Engine: active / available / not connected / key invalid / unhealthy |
| `EmptyState` | No results · no target set · nothing to apply for today · run failed · stale data |
| Primitives | Button (primary/secondary/tertiary/destructive × default, hover, active, focus, disabled, loading) · Input · Select · Toggle · Tabs · Drawer · Sheet · DataTable · Meter · Badge |

---

## 5. Interaction states

Every interactive element and data region defines all ten.

| State | Specification |
| --- | --- |
| Hover | Rows/cards to bg `#F7F5FD`, border to `#DCD8EC`. Filled buttons darken ~6% (`#5A51C0` / `#366B49` / `#AE6828`). **No lift, no scale.** |
| Pressed | Darken ~12%, `scale(.99)`, 80 ms. **No ripples, no bounces.** |
| Selected | Violet tint fill + 1.5px `#C3BCEC` + 3px violet rule on the leading edge; label goes 600. |
| Focus | **2px `#574FC0` ring at 2px offset**, radius + 2, keyboard only. Never removed. Inside the dark console use `#9AA0F0`. |
| Disabled | Fill `#EDEAF7`, label `#8A8FA8`, border `#E7E4F0`, no shadow, `cursor: not-allowed`, **and a reason string within 1 row**. |
| Error | 2px `#A33F28` border, `#FBEDE9` fill, 13px `#A33F28` message below **with a word** — never a red border alone. |
| Empty | Scenery vignette + one sentence naming what is missing + **exactly one** action. Never a blank card, never a spinner. |
| Loading | Skeleton bars `#EDEAF7` at the real row geometry, 1.2 s shimmer. Runs use the Console instead. Max one spinner per screen, 20px, only for sub-second actions. |
| Stale | Apricot chip "Last verified 3 d ago" + a Re-verify action. **Content stays visible.** |
| Success | Sage chip or row tint fading over 240 ms + plain-language confirmation. No confetti, no sound, no takeover. |

---

## 6. Motion

**Durations** — 100 (chip) · 120 (fade, tab) · 180 (drawer) · 220 (sheet) · 240 (count-up, tint fade) · 320 (progress).
**Easing** — entering `cubic-bezier(.2,.8,.2,1)` · exiting `cubic-bezier(.4,0,1,1)` · progress `linear`.

### Permitted, and only these

| Moment | Spec |
| --- | --- |
| Console event append | Fade up 2px over 120 ms, at least 300 ms apart, newest last |
| Console collapse to summary | Height 200–220 ms |
| Progress bar | Width 240 ms (Discovery) / 320 ms (Roadmap) |
| Drawer | Translate 24px + fade 180 ms, backdrop 120 ms, from the right |
| Sheet | 220–280 ms from the bottom edge |
| Opportunity Delta | Projected number counts up **once**, 240 ms, on first reveal in view; the `+n` badge fades 120 ms. Tabular numerals so width never jumps. **Never loops, never re-runs on scroll.** |
| Milestone completion | Node fill + rail colour 300 ms; marker settles once, 240 ms |
| Accepted resume edit | After-text tints sage 240 ms, row settles 160 ms, queue advances 120 ms; collapses into the preview 200 ms |

### Forbidden everywhere

Looping or decorative animation · typing dots · thinking indicators · sparkles · glows · confetti ·
trophies · streaks · XP · level-ups · parallax · animated scenery · bouncing CTAs · **any motion
while the user is reading dense data**.

### prefers-reduced-motion

Count-ups resolve instantly. Slides become fades. The console renders as a static list with final
counts. Transitions collapse to at most 100 ms opacity. **Nothing else changes.**

---

## 7. Responsive matrix

One touch standard throughout: **44×44 minimum, 48px preferred on primary actions.**

| Width | Navigation | Layout | Overlays and dense data |
| --- | --- | --- | --- |
| ≤ 479 | Bottom bar, 5 items, 56px targets | Single column; 16px inset at 360–389, 20px at 390+ | Sheets only; tables become stacked label/value rows |
| 480–767 | Bottom bar | Single column, wider gutters | Sheets; two-up chip rows allowed |
| 768–1023 | Top bar, labels visible | Two columns; sidebars drop below; editor/preview becomes a toggle | Drawers become full-height sheets; tables to 2-line stacked rows; all filters in one sheet |
| 1024–1279 | Top bar | 32px inset; 3-up becomes 2+1; panes 55/45; Resume drops to two panes | Drawer 420px; 3 toolbar controls + sheet |
| 1280–1439 | Top bar | 48px inset, full composition | Drawer 440–460px; table drops its least-important column |
| **1440** | Top bar | **Canonical.** Content 1312–1440 max, 64px inset, 3-up rows; work screens 8/4 | Drawer 460px; three panes on Resume |
| ≥ 1600 | Top bar full width | Content capped at 1440 and centred | Unchanged — **no third sidebar appears** |

Scenery: 300–330px (1440) to 280–300, 240–260 (right bookend only), 200–240, 150–190 (430/390),
130–150 (360–389). Display: 66–74, 56–66, 44–52, 40–48, 26–34, 24–28.

**Forbidden at every width:** horizontal scrolling of primary content · hiding search · dropping the
verdict counts · type below the floors · side-by-side cards under 768px · desktop grids **scaled
down** rather than recomposed.

Mobile nav bar: 74px including safe area, active item is a violet label + 3px violet rule, labels
may truncate to 9 characters at 360–389 but never disappear. No hamburger, no nested drawer
navigation.

---

## 8. Accessibility

- Every status colour is paired with a word. Colour is never the only cue.
- Visible focus ring: 2px `#574FC0` at 2px offset, on canvas and on surfaces.
- Drawers and sheets **trap focus** and restore it to the trigger on close.
- The Activity Console is an `aria-live="polite"` region — **not** read event by event.
- Cmd-K / Ctrl-K opens the assistant scoped to the current object. Esc closes any overlay.
- 44×44 touch minimum; 46px on the three controls raised this pass (assistant sheet "Open the fix",
  mobile resume Accept / Dismiss); 48px on primary actions.
- Meters expose `role="meter"` with `aria-valuetext` carrying the **word**, not a number.
- Tabular numerals on every count so widths never jump.

---

## 9. Pixel art

Density by context — the universal floor is gone, identity is not.

| Context | Screens | Budget |
| --- | --- | --- |
| Brand moments | Focus, onboarding, auth, empty states | 10–18%: scenery band 300–330px + 72–84px status objects + section glyphs |
| Narrative | Roadmap, One Fix Away, Job Detail header | 5–10%: header strip 120–200px, emblems 48–72px, glyphs at section heads. **Art must carry meaning.** |
| Functional | Discovery results, Resume editor, filters, settings, tables | 1–5%: 30–34px glyphs at section heads and tab labels; optional 80–120px header strip; **zero art behind data, rows or forms** |
| No-data | Empty results, no target, nothing today, failed run | Up to 25%: one scenery vignette + one sentence + one action |

**Minimum:** every screen carries the pixel wordmark plus at least one pixel glyph.
**Banned:** mascots, robots, faces, AI pets, animated loops, HUD frames, XP bars, art behind numbers
or dense text, mid-size per-row decoration, smoothed scaling.
**Scenery:** at most 55% contrast vs canvas, masked to transparent before content begins, 40–50%
opacity, background layer only — never an inline object.

### Assets in this repo

`frontend/public/art/` — 78 files, byte-identical to the design project's `refs/i/` and `refs/`.

- `g-*.png` — the 52-glyph family (24×24 grid, exported 4× at 96px, true alpha, one-pixel `#2E2A5A`
  outline). Reproducible from the design project's `refs/glyphgen.js`.
- `px-*.png` — the 17 **restored** true-alpha icons. The opaque originals (design project
  `refs/px-*.png`) are **not** in this repo and must never be used.
- `scene-path.png` (720×360), `scene-path-390.png`, `scene-profile.png`, `horizon*.png`,
  `hero-left.png`, `hero-right.png` — scenery, opaque by design, background layer only.
- Third-party marks: `px-github`, `px-linkedin` (evidence sources — legal wherever an integration
  row appears); `px-chatgpt`, `px-claude`, `px-codex`, `px-cloud` (engines — **Profile → Settings
  only**, 24–30px, inside a row). These are vector brand marks, the single sanctioned exception to
  the pixel family.

Rendering: always `image-rendering: pixelated`, integer scaling only, no drop shadow, no glow.

### Fallback ladder when art does not exist

1. Nearest existing motif from the same family (briefcase for opportunities, wrench for fixes, map
   for plans, locked case for blockers).
2. Otherwise ship a type-only head — eyebrow label + Baloo title. **A missing glyph is acceptable;
   a wrong glyph is not.**
3. Missing scenery becomes a flat canvas header at the same height. Never stretch or repeat a scene.
4. Never substitute an emoji, stock illustration, line icon or AI-generated image.

---

## 10. Ship checklist

**Every screen** — canvas `#F5F3FB`, surfaces `#FBFAFE`, no white or grey page · nav is
Focus / Discover / Roadmap / Resume / Profile on both platforms · one Baloo display anchor, type
floors respected, tabular numbers · sage = Apply Now, apricot = One Fix Away, terracotta = Skip,
violet = action, no exceptions · every status colour paired with a word · every number over 24px has
a derivation · canonical terminology in every label and empty state · pixel wordmark plus at least
one glyph, density inside the band · elevation tier chosen deliberately · all ten interaction states
defined · focus ring visible, 44×44 targets, AA contrast, reduced-motion path · mobile
**recomposed**, never scaled.

**Summary Mode also** — at most 9 surfaces, at most 3 per row, equal heights, one CTA per card ·
lists show exactly 3 rows plus "see all" · at most 4 chips per row, no tables/toolbars/tabs ·
scenery 300–330px · at least 34% whitespace · target intent visible without scrolling.

**Working Mode also** — one dominant work area at least 55% width, at most 2 scroll regions ·
toolbar at most 5 controls plus "More filters · n" · tables: quiet head, hairline rows, mono counts,
hover tint, no zebra, no horizontal scroll on mobile · detail opens in a drawer/sheet over the list,
context never lost · scores appear as pairs with derivations, never merged · AI output arrives as
reviewable rows with accept/reject and a no-evidence state · art at most 5% and none behind data ·
console only while a run is active · at least 22% whitespace.
