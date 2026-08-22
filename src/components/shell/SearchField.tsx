"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useIsMobile } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";

/**
 * Search is never hidden at any width. The icon here is a plain glyph rather
 * than pixel art — inside a control, pixel art competes with the input instead
 * of supporting it.
 */
export function SearchField({
  placeholder = "Search roles, skills or companies",
  mobilePlaceholder = "Search roles or companies",
  defaultValue = "",
  className,
  size = "lg",
}: {
  placeholder?: string;
  mobilePlaceholder?: string;
  defaultValue?: string;
  className?: string;
  size?: "lg" | "md";
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const isNarrow = useIsMobile();

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(value.trim() ? `/discover?q=${encodeURIComponent(value.trim())}` : "/discover");
      }}
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-control bg-surface px-3.5 transition-colors duration-100 focus-within:border-active hover:border-group",
        className,
      )}
    >
      <SearchGlyph />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={mobilePlaceholder && isNarrow ? mobilePlaceholder : placeholder}
        aria-label="Search roles, skills and companies"
        className={cn(
          "min-w-0 flex-1 bg-transparent text-body text-ink placeholder:text-ink-placeholder focus:outline-none",
          size === "lg" ? "min-h-[52px]" : "min-h-[46px]",
        )}
      />
      <button
        type="submit"
        aria-label="Search"
        className="-mr-1.5 flex size-[44px] shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors duration-100 hover:bg-surface-sunken hover:text-ink"
      >
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </button>
    </form>
  );
}

function SearchGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="size-[18px] shrink-0 text-ink-muted"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </svg>
  );
}
