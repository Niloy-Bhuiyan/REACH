import type { GapType, Verdict } from "@/lib/api/types";

/**
 * Verdict colour is single-valued: sage = Apply Now, apricot = One Fix Away,
 * terracotta = Skip. Violet is brand and action and is never a verdict.
 *
 * Every entry pairs the colour with its canonical word — colour is never the only cue.
 */

export const VERDICT_LABEL: Record<Verdict, string> = {
  "apply-now": "Apply Now",
  "one-fix-away": "One Fix Away",
  skip: "Skip",
};

export const VERDICT_SHORT: Record<Verdict, string> = {
  "apply-now": "Apply",
  "one-fix-away": "One fix",
  skip: "Skip",
};

export interface VerdictTone {
  text: string;
  tint: string;
  line: string;
  fill: string;
  fillHover: string;
  rule: string;
}

export const VERDICT_TONE: Record<Verdict, VerdictTone> = {
  "apply-now": {
    text: "text-sage-text",
    tint: "bg-sage-tint",
    line: "border-sage-line",
    fill: "bg-sage",
    fillHover: "hover:bg-sage-hover",
    rule: "bg-sage",
  },
  "one-fix-away": {
    text: "text-apricot-text",
    tint: "bg-apricot-tint",
    line: "border-apricot-line",
    fill: "bg-apricot",
    fillHover: "hover:bg-apricot-hover",
    rule: "bg-apricot",
  },
  // Terracotta is quiet buttons only — no large fills.
  skip: {
    text: "text-terracotta-text",
    tint: "bg-terracotta-tint",
    line: "border-terracotta-line",
    fill: "bg-terracotta-tint",
    fillHover: "hover:bg-terracotta-tint",
    rule: "bg-terracotta",
  },
};

export const VERDICT_ORDER: Verdict[] = ["apply-now", "one-fix-away", "skip"];

/* ── Gap typing ─────────────────────────────────────────────────────────── */

export const GAP_LABEL: Record<GapType, string> = {
  knowledge: "Knowledge gap",
  proof: "Proof gap",
  signal: "Signal gap",
};

/** One icon per gap type, from the single icon system. */
export const GAP_ICON: Record<GapType, "book" | "checkCircle" | "spark"> = {
  knowledge: "book",
  proof: "checkCircle",
  signal: "spark",
};

export const GAP_DIAGNOSIS: Record<GapType, string> = {
  knowledge: "You cannot do it yet. Needs real learning — weeks, and a project to prove it.",
  proof: "You can do it, but nothing public shows it. Needs one shipped artefact — days.",
  signal:
    "You have done it and it is visible — but not in the words screeners match on. Hours.",
};

export const GAP_INITIAL: Record<GapType, string> = {
  knowledge: "K",
  proof: "P",
  signal: "S",
};
