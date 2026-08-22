import { cn } from "@/lib/utils/cn";
import { PixelIcon } from "./PixelIcon";

/**
 * A surface only exists when it has a job: separating a working panel from the
 * page, or lifting an overlay above it. Grouping that can be done with spacing
 * is done with spacing.
 *
 *   plain    — no border, no fill. The default. Spacing does the grouping.
 *   panel    — white, hairline, gentle radius. For a genuine working surface.
 *   raised   — panel plus a soft shadow. For the one thing that must lead.
 *   accent   — a semantic tint, used sparingly and only where the colour means something.
 */
export function Card({
  as: Tag = "div",
  variant = "panel",
  tint,
  className,
  children,
  ...rest
}: {
  as?: "div" | "section" | "article" | "aside";
  variant?: "plain" | "panel" | "raised";
  tint?: "violet" | "sage" | "apricot" | "terracotta" | "read";
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const tints = {
    violet: "bg-violet-tint",
    sage: "bg-sage-tint",
    apricot: "bg-apricot-tint",
    terracotta: "bg-terracotta-tint",
    read: "bg-surface-read border border-surface-read-border",
  } as const;

  return (
    <Tag
      className={cn(
        variant !== "plain" && "rounded-xl",
        variant === "panel" && !tint && "border border-line bg-surface",
        variant === "raised" && !tint && "border border-line bg-surface shadow-tier2",
        tint && tints[tint],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * A section head is type. The glyph is opt-in and reserved for the handful of
 * signature moments — never a decoration attached to every heading.
 */
export function SectionHead({
  glyph,
  glyphSize = 22,
  title,
  detail,
  count,
  countTone = "muted",
  action,
  className,
  as: Tag = "h2",
}: {
  glyph?: string;
  glyphSize?: number;
  title: string;
  detail?: string;
  count?: number;
  countTone?: "muted" | "violet" | "sage" | "apricot" | "terracotta";
  action?: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  const countTones = {
    muted: "text-ink-muted",
    violet: "text-violet-text",
    sage: "text-sage-text",
    apricot: "text-apricot-text",
    terracotta: "text-terracotta-text",
  } as const;

  return (
    <div className={cn("flex items-baseline gap-2.5", className)}>
      {glyph && (
        <PixelIcon name={glyph} size={glyphSize} className="translate-y-[3px] self-start" />
      )}
      <div className="min-w-0 flex-1">
        <Tag className="text-section text-ink">
          {title}
          {count !== undefined && (
            <span className={cn("tnum ml-2 font-medium", countTones[countTone])}>{count}</span>
          )}
        </Tag>
        {detail && <p className="mt-0.5 text-sm text-ink-muted">{detail}</p>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}

/** A quiet label. Sentence case, not shouted — tracking-heavy caps read as chrome. */
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
    <span className={cn("text-meta font-medium", tones[tone], className)}>{children}</span>
  );
}

/** A divider, used where two things genuinely need separating. */
export function Hairline({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-hairline", className)} />;
}

/** The vertical rhythm between page sections. One tier, used consistently. */
export function Stack({
  className,
  children,
  gap = "lg",
}: {
  className?: string;
  gap?: "sm" | "md" | "lg";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col",
        gap === "sm" && "gap-3",
        gap === "md" && "gap-6",
        gap === "lg" && "gap-10 sm:gap-12",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Page shell: one max width, one inset rhythm, everywhere. */
export function Page({
  className,
  children,
  width = "wide",
}: {
  className?: string;
  width?: "wide" | "reading";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-5 sm:px-8 lg:px-10",
        width === "wide" ? "max-w-[1180px]" : "max-w-[760px]",
        className,
      )}
    >
      {children}
    </div>
  );
}
