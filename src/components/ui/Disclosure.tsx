"use client";

import { useState } from "react";
import { Chevron } from "./Button";
import { cn } from "@/lib/utils/cn";

/**
 * Secondary detail lives behind one of these rather than on the page. A quiet
 * row that names what is inside and summarises it, so nothing is hidden — only
 * deferred. This is the whole progressive-disclosure mechanism in REACH.
 */
export function Disclosure({
  label,
  detail,
  defaultOpen = false,
  children,
  className,
}: {
  label: string;
  detail?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("border-t border-hairline first:border-t-0", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-[48px] w-full items-center gap-3 text-left"
      >
        <span className="text-[13.5px] font-semibold text-ink">{label}</span>
        {detail && (
          <span className="min-w-0 flex-1 truncate text-[13px] text-ink-muted">{detail}</span>
        )}
        <span className={cn("ml-auto", detail && "ml-0")}>
          <Chevron open={open} />
        </span>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}
