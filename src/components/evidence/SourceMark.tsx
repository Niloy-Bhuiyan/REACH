import { cn } from "@/lib/utils/cn";
import type { SourceState } from "@/lib/api/types";

/**
 * Evidence sources and analysis engines are the two things about REACH a person
 * has to be able to see at a glance, so each one keeps a recognisable mark.
 *
 * The marks are monochrome and drawn to a single 24 box, so a row of them reads
 * as one family rather than a strip of borrowed logos.
 */

const SOURCE_PATHS: Record<string, string> = {
  github:
    "M12 2.3a9.7 9.7 0 00-3.1 18.9c.5.1.7-.2.7-.5v-1.8c-2.7.6-3.3-1.3-3.3-1.3-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.2-.3-4.5-1.1-4.5-4.9 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.3 9.3 0 014.9 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.8-2.3 4.6-4.5 4.9.4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A9.7 9.7 0 0012 2.3z",
  linkedin:
    "M4.6 3.5h14.8a1.1 1.1 0 011.1 1.1v14.8a1.1 1.1 0 01-1.1 1.1H4.6a1.1 1.1 0 01-1.1-1.1V4.6a1.1 1.1 0 011.1-1.1zM7 10v7.4M7 6.6v.1M11 17.4V10M11 13.2c0-1.6.9-2.5 2.2-2.5 1.4 0 2.2.9 2.2 2.7v4",
  cv: "M6.5 3.5h7L18 8v12.5H6.5zM13.3 3.6V8.2h4.6M9.4 12.4h5.2M9.4 15.8h3.6",
  kaggle:
    "M8 3.6v16.8M8 14.2l6.4-6.6M11.2 10.9l4.4 9.5M8 20.4h-.1",
  portfolio:
    "M12 3.6a8.4 8.4 0 100 16.8 8.4 8.4 0 000-16.8zM3.7 12h16.6M12 3.6c2.1 2.3 3.2 5.2 3.2 8.4S14.1 18.1 12 20.4c-2.1-2.3-3.2-5.2-3.2-8.4S9.9 5.9 12 3.6z",
};

const FILLED = new Set(["github"]);

export function SourceMark({
  id,
  size = 20,
  className,
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  const path = SOURCE_PATHS[id];
  if (!path) {
    // Fallback ladder: a lettered tile, because a wrong mark is worse than none.
    return (
      <span
        aria-hidden
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md bg-surface-sunken font-semibold text-ink-muted",
          className,
        )}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.52) }}
      >
        {id.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  const filled = FILLED.has(id);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

/* ── Engines ──────────────────────────────────────────────────────────────
   The analysis engine is a product-level choice, so it keeps a mark too. Brand
   marks stay confined to Settings; everywhere else the engine is named in words.
   --------------------------------------------------------------------- */

const ENGINE_PATHS: Record<string, string> = {
  // Claude — the sunburst, reduced to eight strokes.
  claude:
    "M12 4.2v4M12 15.8v4M4.2 12h4M15.8 12h4M6.5 6.5l2.8 2.8M14.7 14.7l2.8 2.8M17.5 6.5l-2.8 2.8M9.3 14.7l-2.8 2.8",
  // OpenAI / ChatGPT — the interlocked hexagonal knot, simplified.
  openai:
    "M12 3.4l7.4 4.3v8.6L12 20.6l-7.4-4.3V7.7zM12 8.2l4.2 2.4v2.8L12 15.8l-4.2-2.4v-2.8z",
  codex:
    "M9.2 8.4L5.6 12l3.6 3.6M14.8 8.4L18.4 12l-3.6 3.6M13.2 6.4l-2.4 11.2",
  // REACH's own engine reuses the product mark.
  reach: "M12 3.6L2.8 20.4h6.4L12 15.2l2.8 5.2h6.4z",
};

export function EngineMark({
  id,
  size = 20,
  className,
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  const key = Object.keys(ENGINE_PATHS).find((k) => id.includes(k)) ?? "reach";
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ENGINE_PATHS[key]} />
    </svg>
  );
}

/* ── Connection state ─────────────────────────────────────────────────────
   Five states, each a word plus a dot. Only the two that cost the user
   something take a tint; connected is deliberately quiet.
   --------------------------------------------------------------------- */

export const SOURCE_STATE_WORD: Record<SourceState, string> = {
  connected: "Connected",
  syncing: "Syncing",
  attention: "Needs attention",
  "not-connected": "Connect",
  "missing-costly": "Missing",
};

const STATE_TONE: Record<SourceState, { dot: string; text: string; chip: string }> = {
  connected: { dot: "bg-sage", text: "text-sage-text", chip: "bg-sage-tint" },
  syncing: { dot: "bg-sage/60", text: "text-sage-text", chip: "bg-sage-tint" },
  attention: { dot: "bg-apricot", text: "text-apricot-text", chip: "bg-apricot-tint" },
  "not-connected": { dot: "bg-ink-disabled", text: "text-ink-muted", chip: "bg-surface-sunken" },
  "missing-costly": { dot: "bg-terracotta", text: "text-terracotta-text", chip: "bg-terracotta-tint" },
};

export function ConnectionState({
  state,
  label,
  className,
}: {
  state: SourceState;
  /** The seed's own wording wins when it is more specific than the canonical word. */
  label?: string;
  className?: string;
}) {
  const tone = STATE_TONE[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-meta font-medium whitespace-nowrap",
        tone.chip,
        tone.text,
        className,
      )}
    >
      <span aria-hidden className={cn("size-[6px] rounded-full", tone.dot)} />
      {label ?? SOURCE_STATE_WORD[state]}
    </span>
  );
}
