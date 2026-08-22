# REACH — Product

## What it is

REACH turns a student's scattered evidence — CV, GitHub, LinkedIn, portfolio, Kaggle — into a
structured **evidence record**, matches it against live job postings, and sorts every posting into
one of three verdicts. Where a posting is *nearly* reachable, REACH names the single thing standing
in the way, types it, and produces a plan to close it.

It is not a job board, not a course marketplace, and not a chatbot. It is an instrument that answers
five questions:

1. What can I apply for **today**?
2. What is **blocking** me?
3. What is the **smallest** thing I can do about it?
4. How many more roles does that **actually** open? (counted, not projected)
5. Is my CV **readable** — by a machine, and against *this* posting?

## Who it is for

Final-year students and early-career job seekers. The reference persona in every design frame is a
BSc Statistics student in Dhaka graduating Dec 2026, targeting Data Analyst roles. Money is a real
constraint (hence "free resource first, paid only if"), and credibility matters more than
encouragement — REACH never inflates, never gamifies, never celebrates.

## The three verdicts

| Verdict | Meaning | Colour |
| --- | --- | --- |
| **Apply Now** | All hard requirements met; worth applying today. | Sage |
| **One Fix Away** | Exactly one meaningful unmet item stands between you and a strong fit. | Apricot |
| **Skip** | A hard blocker makes this not worth your time now. | Terracotta |

A verdict is a **sentence**, not a score. Job Detail says "You meet every hard requirement for this
role", never "87% match".

## Gap typing

When something is missing, REACH classifies *why*, because the type decides the fix and its cost.

| Type | Meaning | Typical fix |
| --- | --- | --- |
| **Knowledge gap** | You cannot do it yet. | Real learning — weeks, plus a project to prove it. |
| **Proof gap** | You can do it, but nothing public shows it. | One shipped artefact — days. |
| **Signal gap** | You have done it and it is visible, but not in the words screeners match on. | Hours — CV/README wording. |

All three are always shown, with the user's one highlighted and the others explicitly ruled out, so
the classification is legible rather than asserted.

## Opportunity Delta

The reachable set **now** → the reachable set **after a named fix**, with the affected postings
listed. Five required parts: current set, projected set, delta badge, plain-language basis,
drill-down.

It is **counted, not predicted**. The canonical figure across the whole product is **12 → 20, +8**,
derived from one verified run:

```
54  verified postings in today's run
12  already Apply Now
 8  blocked by SQL only          ← the +8
 4  blocked by SQL + something else   → excluded, and the exclusion is stated
```

The exclusion is what makes the number trustworthy. Never call it an impact score, unlock score,
potential or boost.

## ATS Readiness vs JD Match — two concepts, never one

| | ATS Readiness | JD Match |
| --- | --- | --- |
| Subject | The document itself | The document against **one** posting |
| Job involved? | No | Yes, named |
| Values | Good / Fair / Poor (a word) | Strong / Partial / Weak (a word) |
| With no JD | Still live | **"Not yet measured"** — never 0% |

They are always shown as a pair, never summed, never averaged, and neither shows a 0–100 number.

## Evidence source ≠ AI engine

Two ideas that must never blur:

- **Evidence sources** (CV, GitHub, LinkedIn, Kaggle, portfolio) decide *what REACH can prove about
  you*. Sage-labelled. Managed in Profile.
- **AI engine connections** (REACH-hosted, Claude API, ChatGPT/Codex, Local model) decide *who runs
  the reasoning*. Violet-labelled. Configured **only** in Profile → Settings, the one screen where
  provider logos may appear, at 24–30px inside a row.

Standing guarantees, repeated in the product: an engine cannot write to your CV or profile without
accept/reject, cannot invent employers/metrics/skills/projects, cannot decide eligibility (hard
filters are rules, not model output), and cannot change your Opportunity Delta. Removing an engine
never removes your data. If an engine fails mid-run, REACH retries once, falls back to
REACH-hosted, and **says so** in the run summary — it never silently switches.

## Terminology — canonical only

| Canonical | Never say |
| --- | --- |
| Apply Now | Ready to apply · Strong match · Best fit · Recommended |
| One Fix Away | Almost there · Near match · Close fit · Quick wins |
| Skip | Not a fit · Rejected · Ignore · Poor match |
| Biggest Blocker | Top gap · Main issue · Weakness · Problem area |
| Fastest Fix | Quick win · Top fix · Best next move · Fastest path |
| Opportunity Delta | Impact score · Unlock score · Potential · Boost |
| ATS Readiness | ATS score · Resume score · 82/100 |
| JD Match | Match % · Fit score · Compatibility |
| Knowledge / Proof / Signal gap | Skill gap · Missing item · Weak area |
| Evidence source | Integration · Account · Plugin |
| AI engine connection | AI login · Provider · Bot · Assistant |
| Discover · Activity Console | Live feed · Terminal · Logs · Agent thoughts |
| Evidence record | Career Twin · Digital twin · AI profile · Candidate model · Your AI |

## Data contract the UI depends on

Eight rules from Handoff §11. The frontend behaves as if all eight are true; the mock layer
implements them literally so the behaviour is exercised.

| # | Rule | Value assumed |
| --- | --- | --- |
| 01 | Re-verification cadence | Once per scheduled run, plus on demand when Discover is opened >6 h after the last run. |
| 02 | **Freshness bands** | ≤24 h → stone, reads normally. 24–72 h → apricot + the word `stale`. >72 h → shown but excluded from every count. |
| 03 | Disappeared postings | Retained 48 h labelled *no longer listed at source*, then dropped. Stops counting the moment it is flagged. Never vanishes mid-session. |
| 04 | **Delta is per-run, server-side** | Both sides computed at the end of a completed run, cached against the run id. The client renders a stored figure and never derives one. |
| 05 | **A partial run never moves a number** | A failed/cancelled run writes no Delta and updates no count. The last completed run stays authoritative and is labelled as such. |
| 06 | **The audit set is stored** | Each Delta persists the explicit posting ids of its before/after sets with closing dates. The drill-down is a lookup, not a reconstruction. |
| 07 | **Predicted and realised both kept** | Predicted frozen at plan creation; realised computed from the first completed run after the last milestone closes. Difference explained by naming postings. |
| 08 | Evidence-source staleness is separate | Per-source sync age, stale past 14 days. Never blocks a run, never marks a posting stale. Two different clocks, never merged. |

**Clocks.** All timestamps stored UTC, rendered in the user's local zone, in IBM Plex Mono with
tabular numerals. Under an hour → minutes; under a day → hours; then days. Never a bare date — the
point of the stamp is recency, not history.

## Open item (not a frontend blocker)

The eight thresholds above need an engineering owner's signature. The design assumes the values
listed; the frontend implements them as named constants in `src/lib/api/contract.ts` so a change is
one edit, not a redesign.
