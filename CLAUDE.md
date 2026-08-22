# REACH — workspace instructions

REACH is a job-discovery and career-evidence product for students and job seekers.
This workspace holds the **frontend build only**. The production backend is out of scope for now.

```
D:\REACH
├─ CLAUDE.md              ← you are here
├─ docs/                  ← authoritative build docs (read these before coding)
├─ design-refs/           ← local mirror of the Claude Design handoff (read-only)
│  ├─ src/                ← original .dc.html design files
│  ├─ text/               ← flattened text of each design file (cheap to read)
│  └─ *.png               ← full-page screenshots of every authoritative screen
└─ frontend/              ← the Next.js app (git repo lives here)
```

## The design is closed. Do not redesign REACH.

The authority chain, highest first:

1. **REACH Design DNA v2** — tokens, navigation, density modes, components, terminology,
   interaction states, motion, responsive matrix, asset hygiene. *Where a screen and the DNA
   disagree, the DNA wins.*
2. **REACH FINAL HANDOFF INDEX v1.1** — authoritative file per screen, route map, component and
   state inventory, asset inventory, responsive/interaction contracts, data contract.
3. The nine authoritative screen files + the Iteration 12 mobile secondary-state supplement.

Superseded — **never build from these**: `REACH Home.dc.html`, `REACH Home Directions.dc.html`,
`REACH Design System Proposal.dc.html`, `REACH Design DNA.dc.html` (v1).

Claude Design project id: `bdc0e802-b4e5-4df8-a031-deff395257db` (listed as "Design System Audit").
Everything needed is already mirrored in `design-refs/`; re-fetching is only for verification.

## Non-negotiables

- **Verdict colour is single-valued.** Sage = Apply Now. Apricot = One Fix Away. Terracotta = Skip.
  The forest brand green is action and identity, **never** a verdict — it only ever appears as a
  solid fill on a verb, while a verdict is always a pale tint behind its word.
- **Every status colour is paired with a word.** Colour is never the only cue.
- **ATS Readiness and JD Match are separate concepts.** Never summed, never averaged, never a
  0–100 score, and the phrase "ATS score" appears nowhere.
- **Opportunity Delta is counted, never predicted or derived client-side.** Same figure on every
  screen (12 → 20, +8), always with a visible derivation and a drill-down.
- **Every number over 24px has an inspectable derivation on the same screen.**
- **No AI-proposed text reaches a document without accept / reject.**
- **Terminology is canonical** — see `docs/DESIGN_SYSTEM.md` §Terminology. "Career Twin",
  "digital twin", "AI profile", "candidate model", "ATS score", "match %" are banned.
- **Motion clarifies state or causality, or it does not ship.** No loops, no sparkles, no confetti,
  no typing dots, no parallax. See `docs/DESIGN_SYSTEM.md` §Motion.
- **No dead visible controls.** If it renders, it does something.
- **One icon system, drawn in-house.** `src/components/ui/Icon.tsx` — 24 box, 1.6 stroke. No icon
  library, no emoji, no second set. Illustration is the SVG scenery in `ui/Brand.tsx`. The pixel
  glyph family was retired in the reference-led redesign; `/art/*` is kept but unreferenced.

## Read before coding

| Doc | What it settles |
| --- | --- |
| `docs/PRODUCT.md` | What REACH is, who it is for, the vocabulary, the guarantees |
| `docs/DESIGN_SYSTEM.md` | Tokens, type, density modes, components, states, motion, responsive |
| `docs/FRONTEND_SCOPE.md` | Routes, architecture, component map, per-screen scope |
| `docs/MOCK_API.md` | The typed service boundary and the MSW mock layer |
| `docs/ACCEPTANCE_TESTS.md` | What "done" means per screen |
| `docs/BUILD_STATUS.md` | Current state + continuation state for a fresh session |

## Working rules

- Stack: Next.js 16 App Router · TypeScript (strict) · Tailwind v4 · TanStack Query · MSW ·
  Framer Motion (approved motion only).
- Next.js 16 differs from older versions — `frontend/AGENTS.md` requires reading
  `frontend/node_modules/next/dist/docs/` before writing routing code. `params` is a `Promise`.
- All data access goes through `src/lib/api/` — components never call `fetch` directly and never
  import from `src/mocks/`. Replacing MSW with the real backend must not touch a UI component.
- After each major route: run the app, inspect with Chrome DevTools, compare against
  `design-refs/`, fix visual/responsive/overflow/console issues, then Playwright the primary
  interactions.
- Validate at 1440×900, 1280×800, 1024×768, 768×1024, 430×932, 390×844, 360×800.
- Update `docs/BUILD_STATUS.md` after every major phase. Commit at stable phase boundaries.
  **Never push without explicit permission.**
