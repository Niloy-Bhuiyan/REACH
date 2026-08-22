import { cn } from "@/lib/utils/cn";

/**
 * The mark: a peak with a path notched out of its base — the two things REACH
 * does, in one shape. Two greens, no gradient mesh, no glow.
 */
export function Logo({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 30"
      width={size}
      height={(size * 30) / 32}
      aria-hidden
      className={cn("shrink-0", className)}
      style={{ width: size, height: (size * 30) / 32 }}
    >
      <path d="M16 2.5 1.5 27.5h10L16 19.5z" fill="var(--color-sage)" opacity="0.85" />
      <path d="M16 2.5 30.5 27.5h-10L16 19.5z" fill="var(--color-brand)" />
    </svg>
  );
}

/** Mark plus name. The only place the product shouts its own name. */
export function Wordmark({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Logo size={size} />
      <span
        className="leading-none font-semibold text-ink"
        style={{ fontSize: size * 0.72, letterSpacing: "0.14em" }}
      >
        REACH
      </span>
    </span>
  );
}

/* ── Scenery ──────────────────────────────────────────────────────────────
   One illustration, used once per screen at most: an arched window onto a
   valley with a path running through it. It is atmosphere, never information,
   so it is always aria-hidden and never carries a number or a label.
   --------------------------------------------------------------------- */

export function ArchScene({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 400 480"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      className={cn("pointer-events-none select-none", className)}
      style={style}
    >
      <defs>
        <clipPath id="reach-arch">
          <path d="M0 480V200a200 200 0 0 1 400 0v280z" />
        </clipPath>
        <linearGradient id="reach-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8e6de" />
          <stop offset="46%" stopColor="#f1e9dc" />
          <stop offset="78%" stopColor="#f8ecd8" />
          <stop offset="100%" stopColor="#f4ead9" />
        </linearGradient>
        <radialGradient id="reach-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fdf3de" />
          <stop offset="55%" stopColor="#f8e6c4" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#f8e6c4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="reach-path" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#efe4cf" />
          <stop offset="100%" stopColor="#fbf5e9" />
        </linearGradient>
      </defs>

      <g clipPath="url(#reach-arch)">
        <rect width="400" height="480" fill="url(#reach-sky)" />

        {/* The sun, low and warm. */}
        <circle cx="200" cy="292" r="130" fill="url(#reach-sun)" />
        <circle cx="200" cy="292" r="34" fill="#fbf0d8" />

        {/* A single star, because one is memorable and a field of them is noise. */}
        <path
          d="M231 118c.6 3.7 1.4 4.5 5.1 5.1-3.7.6-4.5 1.4-5.1 5.1-.6-3.7-1.4-4.5-5.1-5.1 3.7-.6 4.5-1.4 5.1-5.1z"
          fill="#cdc7b6"
          opacity="0.8"
        />

        {/* Far ridges. */}
        <path
          d="M0 318c46-38 84-16 122-44 40-30 68 12 108-16 34-24 62 8 96-8 26-12 48 4 74 14v216H0z"
          fill="#c9d2c2"
          opacity="0.55"
        />
        <path
          d="M0 348c40-26 72-4 114-30 42-26 74 18 116-8 34-21 64 6 96-6 26-10 50 6 74 16v160H0z"
          fill="#a9bba6"
          opacity="0.6"
        />

        {/* Near hills framing the valley. */}
        <path d="M0 392c58-40 106-24 152 6 36 23 62 40 62 82H0z" fill="#8ba489" opacity="0.72" />
        <path
          d="M400 384c-62-36-112-18-158 14-34 24-56 42-56 82h214z"
          fill="#7c9a7d"
          opacity="0.74"
        />

        {/* The path: it leaves the frame, which is the whole point. */}
        <path
          d="M186 480c2-46 24-64 42-84 16-18 12-34-2-48-12-12-14-24-2-34 10-8 26-10 40-6-16-2-30 2-36 10-8 10-2 20 8 30 16 16 22 36 6 56-18 22-38 40-40 76z"
          fill="url(#reach-path)"
        />

        {/* Foreground bank. */}
        <path d="M0 468c48-22 96-26 140-14 24 7 40 16 46 26H0z" fill="#6f8c72" opacity="0.5" />
        <path
          d="M400 462c-52-20-100-22-142-8-22 8-36 17-42 26h184z"
          fill="#6f8c72"
          opacity="0.5"
        />
      </g>
    </svg>
  );
}

/**
 * A sprig of leaves, set outside the arch at very low contrast. Two mirrored
 * copies frame the illustration the way a margin ornament frames a page.
 */
export function LeafSprig({
  side = "left",
  className,
  style,
}: {
  side?: "left" | "right";
  className?: string;
  style?: React.CSSProperties;
}) {
  // Points sampled along the stem, tip last. Leaves alternate sides and shrink
  // toward the tip, which is what stops a sprig reading as a row of blobs.
  const leaves = [
    { x: 95, y: 272, dir: -1, s: 1 },
    { x: 91, y: 236, dir: 1, s: 0.95 },
    { x: 86, y: 199, dir: -1, s: 0.9 },
    { x: 79, y: 163, dir: 1, s: 0.84 },
    { x: 70, y: 128, dir: -1, s: 0.77 },
    { x: 59, y: 95, dir: 1, s: 0.69 },
    { x: 46, y: 64, dir: -1, s: 0.6 },
  ];

  return (
    <svg
      viewBox="0 0 120 320"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden
      className={cn("pointer-events-none select-none", className)}
      style={{ transform: side === "right" ? "scaleX(-1)" : undefined, ...style }}
    >
      <path
        d="M100 318C96 224 82 136 40 44"
        fill="none"
        stroke="#c2cfba"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.7"
      />
      {leaves.map((leaf, i) => (
        <g
          key={leaf.y}
          transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.dir < 0 ? -158 : -22}) scale(${leaf.s})`}
        >
          <ellipse
            cx="26"
            cy="0"
            rx="27"
            ry="11"
            fill={i % 2 === 0 ? "#cfdac7" : "#dae3d2"}
            opacity="0.85"
          />
        </g>
      ))}
    </svg>
  );
}
