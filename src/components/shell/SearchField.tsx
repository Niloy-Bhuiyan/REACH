"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { useIsMobile } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";

/** Search is the only input in Summary Mode, and it is never hidden at any width. */
export function SearchField({
  placeholder = "Search jobs, internships, skills, companies…",
  mobilePlaceholder = "Search jobs, skills, companies…",
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
        "flex items-center gap-2.5 rounded-[12px] border-[1.5px] border-control bg-surface shadow-search",
        size === "lg" ? "py-2 pr-2 pl-4" : "py-1.5 pr-1.5 pl-3.5",
        className,
      )}
    >
      <PixelIcon name="g-scan" size={20} />
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={mobilePlaceholder && isNarrow ? mobilePlaceholder : placeholder}
        aria-label="Search jobs, internships, skills and companies"
        className="min-h-[44px] min-w-0 flex-1 bg-transparent text-[15px] text-ink placeholder:text-ink-placeholder focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Search"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-[9px] bg-violet text-surface transition-colors duration-100 hover:bg-violet-hover",
          size === "lg" ? "h-[46px] w-[46px]" : "h-[40px] w-[40px]",
        )}
      >
        <PixelIcon name="g-nav-discover" size={20} />
      </button>
    </form>
  );
}
