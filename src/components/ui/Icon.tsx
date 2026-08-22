import { cn } from "@/lib/utils/cn";

/**
 * One icon system, drawn in-house. Every glyph shares the same 24 box, the same
 * 1.6 stroke, the same round caps and joins, so nothing on a screen looks
 * borrowed. No icon library, no emoji, no second set.
 *
 * Icons are decorative by default: they sit beside a word, so they are hidden
 * from the accessibility tree unless a `title` is passed.
 */

const PATHS = {
  /* Navigation */
  focus: "M12 3.5l2.4 5.2 5.6.7-4.1 3.9 1.1 5.6L12 16.2l-5 2.7 1.1-5.6L4 9.4l5.6-.7z",
  discover: "M10.8 4a6.8 6.8 0 100 13.6 6.8 6.8 0 000-13.6zM15.8 15.8L20 20",
  roadmap:
    "M7 20c0-3 3.2-3.2 5-4.6 1.4-1.1 1.6-3.1-.4-4.1-2-1-4.6-1-4.6-3.4C7 5.7 9.4 4 12.5 4M6.2 19.2a1.2 1.2 0 102.4 0 1.2 1.2 0 00-2.4 0M11.6 4a1.2 1.2 0 102.4 0 1.2 1.2 0 00-2.4 0",
  resume:
    "M6 3.5h7.2L18 8.3V20a.5.5 0 01-.5.5h-11A.5.5 0 016 20V4a.5.5 0 010-.5zM13 3.6V8.5h4.9M9 12.5h6M9 16h4",
  profile:
    "M12 4a3.6 3.6 0 100 7.2A3.6 3.6 0 0012 4zM5 20c0-3.4 3.1-5.4 7-5.4s7 2 7 5.4",

  /* Product */
  pin: "M12 21s6.4-5.6 6.4-10.2A6.4 6.4 0 005.6 10.8C5.6 15.4 12 21 12 21zM12 8.4a2.4 2.4 0 100 4.8 2.4 2.4 0 000-4.8z",
  briefcase:
    "M4.5 8.5h15a.5.5 0 01.5.5v9a.5.5 0 01-.5.5h-15a.5.5 0 01-.5-.5V9a.5.5 0 01.5-.5zM9 8.5V6.2c0-.4.3-.7.7-.7h4.6c.4 0 .7.3.7.7v2.3M4 12.6c2.6 1 5.3 1.5 8 1.5s5.4-.5 8-1.5",
  sliders: "M4 7.5h10M18 7.5h2M4 16.5h4M12 16.5h8M16 5.6v3.8M9.6 14.6v3.8",
  sort: "M7 4.5v15M7 4.5L4.4 7.3M7 4.5l2.6 2.8M17 19.5v-15M17 19.5l-2.6-2.8M17 19.5l2.6-2.8",
  bell: "M12 4a5.4 5.4 0 00-5.4 5.4c0 4-1.6 5.6-1.6 5.6h14s-1.6-1.6-1.6-5.6A5.4 5.4 0 0012 4zM10.3 18.4a1.9 1.9 0 003.4 0",
  star: "M12 4.2l2.3 4.9 5.3.7-3.9 3.7 1 5.3-4.7-2.6-4.7 2.6 1-5.3L4.4 9.8l5.3-.7z",
  spark: "M12 4.5c.6 3.6 1.4 4.4 5 5-3.6.6-4.4 1.4-5 5-.6-3.6-1.4-4.4-5-5 3.6-.6 4.4-1.4 5-5z",
  check: "M5 12.6l4.6 4.4L19 7",
  checkCircle: "M20 12a8 8 0 11-3.4-6.5M8.6 11.8l2.8 2.7L20 6.4",
  alert: "M12 8.6v4.6M12 16.6v.1M10.7 4.9L3.5 18a1.5 1.5 0 001.3 2.2h14.4a1.5 1.5 0 001.3-2.2L13.3 4.9a1.5 1.5 0 00-2.6 0z",
  info: "M12 4a8 8 0 100 16 8 8 0 000-16zM12 11v5M12 8v.1",
  clock: "M12 4a8 8 0 100 16 8 8 0 000-16zM12 7.6V12l3 1.8",
  refresh: "M19.5 12a7.5 7.5 0 11-2.2-5.3M19.6 4.6v4.2h-4.2",
  doc: "M6.5 3.5h7L18 8v12.5h-11zM13.3 3.6V8.2h4.6M9.5 12.5h5M9.5 16h3.4",
  link: "M10.4 13.6a3.6 3.6 0 005.4.4l2.4-2.4a3.6 3.6 0 00-5.1-5.1l-1.4 1.4M13.6 10.4a3.6 3.6 0 00-5.4-.4l-2.4 2.4a3.6 3.6 0 005.1 5.1l1.4-1.4",
  external: "M14 5h5v5M19 5l-7.4 7.4M17 14v4.5a.5.5 0 01-.5.5h-11a.5.5 0 01-.5-.5v-11a.5.5 0 01.5-.5H10",
  plus: "M12 5.5v13M5.5 12h13",
  minus: "M5.5 12h13",
  close: "M6.4 6.4l11.2 11.2M17.6 6.4L6.4 17.6",
  play: "M8.5 5.8l9.2 5.7a.6.6 0 010 1L8.5 18.2a.6.6 0 01-.9-.5V6.3a.6.6 0 01.9-.5z",
  arrowRight: "M4.5 12h14M13.5 6.8l5.2 5.2-5.2 5.2",
  arrowUpRight: "M7 17L17.4 6.6M8.6 6.6h8.8v8.8",
  chevronDown: "M6 9.5l6 5.5 6-5.5",
  chevronRight: "M9.5 5.5l6 6.5-6 6.5",
  chevronLeft: "M14.5 5.5l-6 6.5 6 6.5",
  target: "M12 4a8 8 0 100 16 8 8 0 000-16zM12 8.4a3.6 3.6 0 100 7.2 3.6 3.6 0 000-7.2zM12 11.6v.8",
  layers: "M12 3.8l8 4.3-8 4.3-8-4.3zM4.4 12.4L12 16.5l7.6-4.1M4.4 16.3L12 20.4l7.6-4.1",
  shield: "M12 3.8l7 2.6v5.2c0 4.2-3 7-7 8.6-4-1.6-7-4.4-7-8.6V6.4zM9 12l2.2 2.2L15.2 10",
  key: "M14.6 4.6a4.8 4.8 0 11-3.4 8.2L4.6 19.4H4v-2.2l1.2-1.2h1.6v-1.6h1.6l2.8-2.8a4.8 4.8 0 013.4-7zM15.8 8.4v.1",
  eye: "M2.8 12S6.4 6 12 6s9.2 6 9.2 6-3.6 6-9.2 6-9.2-6-9.2-6zM12 9.4a2.6 2.6 0 100 5.2 2.6 2.6 0 000-5.2z",
  upload: "M12 16V4.8M8 8.4L12 4.6l4 3.8M4.5 15.5V19a.5.5 0 00.5.5h14a.5.5 0 00.5-.5v-3.5",
  download: "M12 4.6V16M8 12.2l4 3.8 4-3.8M4.5 15.5V19a.5.5 0 00.5.5h14a.5.5 0 00.5-.5v-3.5",
  wrench:
    "M15.4 4.4a4.6 4.6 0 00-5.8 5.8L4 15.8V20h4.2l5.6-5.6a4.6 4.6 0 005.8-5.8l-2.9 2.9-2.6-.6-.6-2.6z",
  path: "M4.5 19.5c4-.5 5-2.6 5-4.6 0-2.2-2.6-2.4-2.6-4.4S9.5 7.4 12 7.4h7.4M16.6 4.6l3 2.8-3 2.8",
  book: "M4.5 5.2c2.6-.7 5.2-.7 7.5.6 2.3-1.3 4.9-1.3 7.5-.6v12.6c-2.6-.7-5.2-.7-7.5.6-2.3-1.3-4.9-1.3-7.5-.6zM12 5.8v12.6",
  filter: "M4.5 6.5h15l-5.8 6.6V19l-3.4-2.2v-3.7z",
  grid: "M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z",
  list: "M4.5 7h1M8.5 7h11M4.5 12h1M8.5 12h11M4.5 17h1M8.5 17h11",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  title,
  className,
  strokeWidth = 1.6,
}: {
  name: IconName;
  size?: number;
  /** Pass only when the icon is the whole meaning; otherwise it stays decorative. */
  title?: string;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

/**
 * A small filled dot. Used with a verdict word so the colour has a shape, which
 * survives greyscale and colour-blindness better than a tint alone.
 */
export function Dot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-[7px] shrink-0 rounded-full bg-current", className)}
    />
  );
}
