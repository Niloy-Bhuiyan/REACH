import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * The pixel glyph set is the only icon system in REACH. No line-icon library, no emoji,
 * no mixed sets on a screen — including nav, tabs, toolbars and empty states.
 *
 * Assets are the restored true-alpha family in `/public/art`. Integer scaling only,
 * `image-rendering: pixelated`, no drop shadow, no glow.
 */
export function PixelIcon({
  name,
  size = 24,
  height,
  alt = "",
  className,
  priority,
}: {
  /** File stem in `/public/art`, e.g. `g-nav-focus` or `px-wrench`. */
  name: string;
  size?: number;
  height?: number;
  /** Empty by default: glyphs sit beside a word, so they are decorative. */
  alt?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={`/art/${name}.png`}
      alt={alt}
      width={size}
      height={height ?? size}
      priority={priority}
      aria-hidden={alt === "" ? true : undefined}
      className={cn("pixel shrink-0", className)}
      style={{ width: size, height: height ?? size }}
    />
  );
}

/**
 * Scenery is a background layer only — never an inline object. Masked to transparent
 * before content begins, at most 55% contrast against the canvas.
 */
export function Scenery({
  name,
  width,
  height,
  className,
  style,
}: {
  name: string;
  width: number;
  height: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <Image
      src={`/art/${name}.png`}
      alt=""
      aria-hidden
      width={width}
      height={height}
      priority
      className={cn("pixel pointer-events-none absolute select-none", className)}
      style={{ width, height, ...style }}
    />
  );
}
