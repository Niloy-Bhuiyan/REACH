import { BrandIcon, ENGINE_BRAND, SOURCE_BRAND } from "@/components/ui/BrandIcon";
import { LetterTile, PixelIcon } from "@/components/ui/PixelIcon";
import { cn } from "@/lib/utils/cn";

/**
 * One box, three fallbacks, so a row of marks always lines up.
 *
 *   1. A real brand logo when REACH knows one — GitHub, LinkedIn, Kaggle, Claude, OpenAI.
 *   2. The pixel glyph, for the things that are REACH's own concepts — a CV, a portfolio.
 *   3. A lettered tile, because a wrong mark is worse than no mark.
 *
 * Brand marks are drawn on a tighter grid than the pixel glyphs, so they are inset inside the
 * shared box rather than sized to it. That is what keeps the optical weight even.
 */
const BRAND_INSET = 0.82;

function Box({
  size,
  className,
  children,
}: {
  size: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-hidden
      className={cn("flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      {children}
    </span>
  );
}

export function SourceGlyph({
  id,
  icon,
  name,
  size = 24,
  className,
}: {
  id: string;
  /** The pixel glyph the seed names, if any. */
  icon?: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const brand = SOURCE_BRAND[id];
  if (brand) {
    return (
      <Box size={size} className={className}>
        <BrandIcon name={brand} size={Math.round(size * BRAND_INSET)} className="text-ink" />
      </Box>
    );
  }
  if (icon) {
    return (
      <Box size={size} className={className}>
        <PixelIcon name={icon} size={size} />
      </Box>
    );
  }
  return (
    <Box size={size} className={className}>
      <LetterTile letter={name[0]} size={size} />
    </Box>
  );
}

export function EngineGlyph({
  id,
  icon,
  size = 26,
  className,
}: {
  id: string;
  icon?: string;
  size?: number;
  className?: string;
}) {
  const brand = ENGINE_BRAND[id];
  if (brand) {
    return (
      <Box size={size} className={className}>
        <BrandIcon name={brand} size={Math.round(size * BRAND_INSET)} className="text-ink" />
      </Box>
    );
  }
  return (
    <Box size={size} className={className}>
      <PixelIcon name={icon ?? "g-engine"} size={size} />
    </Box>
  );
}
