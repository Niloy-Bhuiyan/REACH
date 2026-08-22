"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "link";
export type ButtonTone = "brand" | "sage" | "apricot" | "terracotta";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * One primary action per screen. Everything else is secondary or a link.
 *
 * Actions are pills — the softest shape on a page of rectangles, which is what
 * makes them read as pressable without a border or a shadow doing the work.
 * Hover darkens, pressed settles. Disabled always carries a reason.
 */
const FILL: Record<ButtonTone, string> = {
  brand: "bg-brand text-white hover:bg-brand-hover",
  sage: "bg-sage text-white hover:bg-sage-hover",
  apricot: "bg-apricot text-white hover:bg-apricot-hover",
  // Terracotta never takes a large fill.
  terracotta: "bg-terracotta-tint text-terracotta-text hover:bg-[#f4ded4]",
};

const OUTLINE: Record<ButtonTone, string> = {
  brand: "text-ink hover:bg-surface-sunken",
  sage: "text-sage-text hover:bg-sage-tint",
  apricot: "text-apricot-text hover:bg-apricot-tint",
  terracotta: "text-terracotta-text hover:bg-terracotta-tint",
};

const QUIET: Record<ButtonTone, string> = {
  brand: "text-ink-body hover:bg-surface-sunken hover:text-ink",
  sage: "text-sage-text hover:bg-sage-tint",
  apricot: "text-apricot-text hover:bg-apricot-tint",
  terracotta: "text-terracotta-text hover:bg-terracotta-tint",
};

const LINKY: Record<ButtonTone, string> = {
  brand: "text-brand-text hover:text-ink",
  sage: "text-sage-text hover:text-ink",
  apricot: "text-apricot-text hover:text-ink",
  terracotta: "text-terracotta-text hover:text-ink",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-[38px] px-3.5 text-sm gap-1.5",
  md: "min-h-[44px] px-4.5 text-sm gap-2",
  lg: "min-h-[50px] px-6 text-body gap-2.5",
};

function classesFor(
  variant: ButtonVariant,
  tone: ButtonTone,
  size: ButtonSize,
  full?: boolean,
) {
  const base = cn(
    "inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap select-none",
    "transition-[background-color,color,border-color,opacity] duration-150",
    "disabled:pointer-events-none disabled:bg-surface-sunken disabled:text-ink-disabled disabled:border-transparent disabled:shadow-none",
    SIZE[size],
    full && "w-full",
  );

  if (variant === "primary") return cn(base, FILL[tone]);
  if (variant === "secondary")
    return cn(base, "border border-control bg-surface", OUTLINE[tone]);
  if (variant === "ghost") return cn(base, "bg-transparent", QUIET[tone]);
  return cn(
    "inline-flex min-h-[36px] items-center gap-1 text-sm font-medium transition-colors duration-150 hover:underline",
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
  { variant = "primary", tone = "brand", size = "md", full, className, children, reason, ...rest },
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
  tone = "brand",
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
  return <Icon name="arrowRight" size={15} className="opacity-75" strokeWidth={1.8} />;
}

/** The chevron used on disclosure rows and select controls. */
export function Chevron({ open }: { open?: boolean }) {
  return (
    <Icon
      name="chevronDown"
      size={15}
      strokeWidth={1.8}
      className={cn("text-ink-muted transition-transform duration-200", open && "rotate-180")}
    />
  );
}
