"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "quiet";
export type ButtonTone = "violet" | "sage" | "apricot" | "terracotta";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Hover darkens ~6%, pressed darkens ~12% and scales .99 over 80 ms.
 * No lift, no scale on hover, no ripples, no bounces.
 * Disabled carries a reason string within one row — see `reason`.
 */
const TONE_FILL: Record<ButtonTone, string> = {
  violet: "bg-violet text-surface hover:bg-violet-hover",
  sage: "bg-sage text-surface hover:bg-sage-hover",
  apricot: "bg-apricot text-surface hover:bg-apricot-hover",
  // Terracotta is quiet buttons only — no large fills anywhere in the product.
  terracotta:
    "bg-terracotta-tint text-terracotta-text border border-terracotta-line hover:bg-[#f7e3dd]",
};

const TONE_SECONDARY: Record<ButtonTone, string> = {
  violet: "text-violet-text border-control hover:bg-violet-tint",
  sage: "text-sage-text border-sage-line hover:bg-sage-tint",
  apricot: "text-apricot-text border-apricot-line hover:bg-apricot-tint",
  terracotta: "text-terracotta-text border-terracotta-line hover:bg-terracotta-tint",
};

const TONE_TEXT: Record<ButtonTone, string> = {
  violet: "text-violet-text hover:text-ink",
  sage: "text-sage-text hover:text-ink",
  apricot: "text-apricot-text hover:text-ink",
  terracotta: "text-terracotta-text hover:text-ink",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-[36px] px-3.5 text-[13.5px] rounded-lg gap-2",
  md: "min-h-[44px] px-4 text-[14.5px] rounded-[10px] gap-2",
  lg: "min-h-[48px] px-5 text-[15px] rounded-[10px] gap-2.5",
};

function classesFor(
  variant: ButtonVariant,
  tone: ButtonTone,
  size: ButtonSize,
  full?: boolean,
) {
  const base = cn(
    "inline-flex items-center justify-center font-semibold whitespace-nowrap select-none",
    "transition-[background-color,color,border-color,transform] duration-100",
    "active:scale-[.99] disabled:pointer-events-none",
    "disabled:bg-track disabled:text-ink-disabled disabled:border-line disabled:shadow-none",
    SIZE[size],
    full && "w-full",
  );

  if (variant === "primary") return cn(base, TONE_FILL[tone]);
  if (variant === "secondary")
    return cn(base, "bg-surface border-[1.5px]", TONE_SECONDARY[tone]);
  if (variant === "quiet")
    return cn(base, "bg-transparent border-[1.5px]", TONE_SECONDARY[tone]);
  return cn(base, "px-0 min-h-0 bg-transparent underline-offset-2", TONE_TEXT[tone]);
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
      aria-describedby={rest.disabled && reason ? undefined : rest["aria-describedby"]}
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

/** The trailing arrow used on every "go somewhere" action in the design. */
export function Arrow() {
  return (
    <span aria-hidden className="translate-y-[-.5px]">
      →
    </span>
  );
}

/** The chevron on a disclosure row. Rotates, never bounces. */
export function Chevron({ open }: { open?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={`size-4 shrink-0 text-ink-muted transition-transform duration-150 ${
        open ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}
