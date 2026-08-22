"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
export type ButtonTone = "violet" | "sage" | "apricot" | "terracotta";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * One primary action per screen. Everything else is secondary or a link.
 *
 * Hover darkens, pressed settles — no lift, no scale on hover, no ripple.
 * Disabled always carries a reason so it is never a dead end.
 */
const FILL: Record<ButtonTone, string> = {
  violet: "bg-violet text-white hover:bg-violet-hover",
  sage: "bg-sage text-white hover:bg-sage-hover",
  apricot: "bg-apricot text-white hover:bg-apricot-hover",
  // Terracotta never takes a large fill.
  terracotta: "bg-terracotta-tint text-terracotta-text hover:bg-[#fbe7e1]",
};

const OUTLINE: Record<ButtonTone, string> = {
  violet: "text-ink hover:bg-surface-sunken",
  sage: "text-sage-text hover:bg-sage-tint",
  apricot: "text-apricot-text hover:bg-apricot-tint",
  terracotta: "text-terracotta-text hover:bg-terracotta-tint",
};

const QUIET: Record<ButtonTone, string> = {
  violet: "text-ink-body hover:bg-surface-sunken hover:text-ink",
  sage: "text-sage-text hover:bg-sage-tint",
  apricot: "text-apricot-text hover:bg-apricot-tint",
  terracotta: "text-terracotta-text hover:bg-terracotta-tint",
};

const LINKY: Record<ButtonTone, string> = {
  violet: "text-violet-text hover:text-ink",
  sage: "text-sage-text hover:text-ink",
  apricot: "text-apricot-text hover:text-ink",
  terracotta: "text-terracotta-text hover:text-ink",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-[36px] px-3 text-sm rounded-lg gap-1.5",
  md: "min-h-[40px] px-3.5 text-sm rounded-lg gap-2",
  lg: "min-h-[44px] px-4 text-body rounded-[10px] gap-2",
};

function classesFor(
  variant: ButtonVariant,
  tone: ButtonTone,
  size: ButtonSize,
  full?: boolean,
) {
  const base = cn(
    "inline-flex items-center justify-center font-medium whitespace-nowrap select-none",
    "transition-[background-color,color,border-color,opacity] duration-100",
    "disabled:pointer-events-none disabled:bg-surface-sunken disabled:text-ink-disabled disabled:border-transparent disabled:shadow-none",
    SIZE[size],
    full && "w-full",
  );

  if (variant === "primary") return cn(base, "font-medium", FILL[tone]);
  if (variant === "secondary")
    return cn(base, "border border-control bg-surface", OUTLINE[tone]);
  if (variant === "ghost") return cn(base, "bg-transparent", QUIET[tone]);
  return cn(
    "inline-flex min-h-[36px] items-center gap-1 text-sm font-medium transition-colors duration-100 hover:underline",
    LINKY[tone],
    full && "w-full justify-center",
  );
}

interface CommonProps {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  full?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Button = forwardRef<
  HTMLButtonElement,
  CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement> & { reason?: string }
>(function Button(
  { variant = "primary", tone = "violet", size = "md", full, className, children, reason, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      title={rest.disabled ? reason : rest.title}
      className={cn(classesFor(variant, tone, size, full), className)}
      {...rest}
    >
      {children}
    </button>
  );
});

export function ButtonLink({
  href,
  variant = "primary",
  tone = "violet",
  size = "md",
  full,
  className,
  children,
  ...rest
}: CommonProps & { href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link
      href={href}
      className={cn(classesFor(variant, tone, size, full), className)}
      {...rest}
    >
      {children}
    </Link>
  );
}

/**
 * Reserved for the single "go on then" action on a screen. Everywhere else the
 * label already says where it goes, so the arrow was noise.
 */
export function Arrow() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="size-3.5 shrink-0 opacity-70"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

/** The chevron used on disclosure rows. */
export function Chevron({ open }: { open?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={cn(
        "size-4 shrink-0 text-ink-muted transition-transform duration-150",
        open && "rotate-180",
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}
