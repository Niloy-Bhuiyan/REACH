import { cn } from "@/lib/utils/cn";
import { PixelIcon } from "./PixelIcon";

/**
 * Elevation tiers — 1 flat, 2 grouped, 3 overlay. Max one tier per row.
 * Shadows only on tier 3 and search.
 */
export function Card({
  tier = 1,
  tint,
  className,
  children,
  ...rest
}: {
  tier?: 1 | 2 | 3;
  tint?: "violet" | "sage" | "apricot" | "terracotta" | "read";
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const tints = {
    violet: "bg-violet-tint border-violet-line",
    sage: "bg-sage-tint border-sage-line",
    apricot: "bg-apricot-tint border-apricot-line",
    terracotta: "bg-terracotta-tint border-terracotta-line",
    read: "bg-surface-read border-surface-read-border",
  } as const;

  return (
    <div
      className={cn(
        "rounded-[14px] border",
        tint ? tints[tint] : "bg-surface",
        !tint && tier === 1 && "border-line",
        !tint && tier === 2 && "border-group shadow-tier2",
        !tint && tier === 3 && "border-group shadow-tier3",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

/**
 * Section head: pixel glyph at 22–34px plus a Baloo title. When no glyph fits, ship the
 * type-only head — a missing glyph is acceptable, a wrong glyph is not.
 */
export function SectionHead({
  glyph,
  glyphSize = 30,
  title,
  detail,
  count,
  countTone = "violet",
  action,
  className,
  as: Tag = "h2",
}: {
  glyph?: string;
  glyphSize?: number;
  title: string;
  detail?: string;
  count?: number;
  countTone?: "violet" | "sage" | "apricot" | "terracotta";
  action?: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  const countTones = {
    violet: "bg-violet-tint text-violet-text border-violet-line",
    sage: "bg-sage-tint text-sage-text border-sage-line",
    apricot: "bg-apricot-tint text-apricot-text border-apricot-line",
    terracotta: "bg-terracotta-tint text-terracotta-text border-terracotta-line",
  } as const;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {glyph && <PixelIcon name={glyph} size={glyphSize} />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2.5">
          <Tag className="font-display text-[20px] leading-tight font-bold text-ink sm:text-[22px]">
            {title}
          </Tag>
          {count !== undefined && (
            <span
              className={cn(
                "tnum rounded-full border px-2.5 py-0.5 text-[13px] font-bold",
                countTones[countTone],
              )}
            >
              {count}
            </span>
          )}
        </div>
        {detail && (
          <p className="mt-0.5 text-[13.5px] leading-snug text-ink-body">{detail}</p>
        )}
      </div>
      {action}
    </div>
  );
}

/** Eyebrow label — 12px floor, .08–.14em tracking, muted. */
export function Eyebrow({
  children,
  tone = "muted",
  className,
}: {
  children: React.ReactNode;
  tone?: "muted" | "violet" | "sage" | "apricot" | "terracotta";
  className?: string;
}) {
  const tones = {
    muted: "text-ink-muted",
    violet: "text-violet-text",
    sage: "text-sage-text",
    apricot: "text-apricot-text",
    terracotta: "text-terracotta-text",
  } as const;
  return (
    <span
      className={cn(
        "text-[12px] leading-none font-bold tracking-[.12em] uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** In-card row divider — decorative hairline, never a structural border. */
export function Hairline({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-hairline", className)} />;
}
