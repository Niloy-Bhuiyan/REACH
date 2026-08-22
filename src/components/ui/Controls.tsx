"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";

/** Inputs, selects and secondary buttons rest on 1.5px #C3BCEC. Placeholder is #6E7490. */
const CONTROL =
  "w-full rounded-[10px] border-[1.5px] border-control bg-surface px-3.5 text-[14.5px] text-ink " +
  "placeholder:text-ink-placeholder min-h-[44px] transition-colors duration-100 " +
  "hover:border-group focus:border-active disabled:bg-track disabled:text-ink-disabled";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ className, invalid, ...rest }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        CONTROL,
        invalid && "border-2 border-terracotta bg-terracotta-tint",
        className,
      )}
      {...rest}
    />
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(CONTROL, "resize-y py-3 leading-relaxed", className)}
      {...rest}
    />
  );
});

export function Select({
  label,
  value,
  onChange,
  options,
  className,
}: {
  /** Rendered inside the control, so the toolbar reads "Role: Data Analyst". */
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <label
      className={cn(
        "relative inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] border-[1.5px] border-control bg-surface pr-8 pl-3.5 text-[14px] transition-colors duration-100 hover:border-group focus-within:border-active",
        className,
      )}
    >
      {label && <span className="text-ink-muted">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label ?? options.find((o) => o.value === value)?.label}
        className="cursor-pointer appearance-none bg-transparent py-2.5 pr-1 font-semibold text-ink focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="pointer-events-none absolute right-3 text-[12px] text-ink-placeholder"
      >
        ▾
      </span>
    </label>
  );
}

/** Toggle. The label is always present — the switch alone never carries the meaning. */
export function Toggle({
  checked,
  onChange,
  label,
  detail,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  detail?: string;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("flex items-start justify-between gap-4 py-3", className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-[14.5px] font-semibold text-ink">
          {label}
        </label>
        {detail && <p className="mt-0.5 text-[13px] text-ink-body">{detail}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="flex h-[44px] w-[46px] shrink-0 items-center justify-center"
      >
        <span
          aria-hidden
          className={cn(
            "relative block h-[26px] w-[46px] rounded-full border transition-colors duration-100",
            checked ? "border-violet bg-violet" : "border-control bg-track",
          )}
        >
          <span
            className={cn(
              "absolute top-[2px] h-[20px] w-[20px] rounded-full bg-surface shadow-tier2 transition-[left] duration-100",
              checked ? "left-[23px]" : "left-[2px]",
            )}
          />
        </span>
      </button>
    </div>
  );
}

/**
 * Tabs. Selected carries a violet tint fill, a 1.5px control border and a 2px active
 * underline, and the label goes 600 — never colour alone.
 */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
  ariaLabel,
}: {
  value: T;
  onChange: (next: T) => void;
  items: { value: T; label: string; count?: number; tone?: "violet" | "sage" | "apricot" | "terracotta" }[];
  className?: string;
  ariaLabel: string;
}) {
  const countTones = {
    violet: "text-violet-text",
    sage: "text-sage-text",
    apricot: "text-apricot-text",
    terracotta: "text-terracotta-text",
  } as const;

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex items-stretch gap-1.5 overflow-x-auto", className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative flex min-h-[44px] items-center gap-2 rounded-[10px] border-[1.5px] px-3.5 text-[14px] whitespace-nowrap transition-colors duration-100",
              active
                ? "border-control bg-violet-tint font-semibold text-ink"
                : "border-transparent bg-transparent font-medium text-ink-body hover:bg-row-hover",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  "tnum text-[14px] font-bold",
                  countTones[item.tone ?? "violet"],
                )}
              >
                {item.count}
              </span>
            )}
            {active && (
              <span
                aria-hidden
                className="absolute inset-x-2 -bottom-[1.5px] h-[2px] rounded-full bg-active"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
