"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useIsMobile } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";

/**
 * Search is never hidden at any width. One long pill, a magnifier that labels
 * it, and a single filled action at the end — so the way in is unmistakable
 * without any surrounding copy explaining it.
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
        "flex items-center gap-3 rounded-full border border-line bg-surface shadow-search transition-colors duration-150 focus-within:border-active hover:border-group",
        size === "lg" ? "py-2 pr-2 pl-5 sm:pl-6" : "py-1.5 pr-1.5 pl-4",
        className,
      )}
    >
      <Icon name="discover" size={size === "lg" ? 20 : 18} className="text-ink-muted" />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={mobilePlaceholder && isNarrow ? mobilePlaceholder : placeholder}
        aria-label="Search roles, skills and companies"
        className={cn(
          "min-w-0 flex-1 bg-transparent text-ink placeholder:text-ink-placeholder focus:outline-none",
          size === "lg" ? "min-h-[48px] text-[1.0625rem]" : "min-h-[44px] text-body",
        )}
      />
      <button
        type="submit"
        aria-label="Search"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full bg-brand text-white transition-colors duration-150 hover:bg-brand-hover",
          size === "lg" ? "size-[48px]" : "size-[44px]",
        )}
      >
        <Icon name="arrowRight" size={19} strokeWidth={1.7} />
      </button>
    </form>
  );
}
