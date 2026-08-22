"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";
import { Chevron } from "./Button";

/** Controls rest on a neutral hairline and only take colour when focused. */
const CONTROL =
  "w-full rounded-lg border border-control bg-surface px-3 text-body text-ink " +
  "placeholder:text-ink-placeholder min-h-[44px] transition-colors duration-100 " +
  "hover:border-group focus:border-active disabled:bg-surface-sunken disabled:text-ink-disabled";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ className, invalid, ...rest }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(CONTROL, invalid && "border-terracotta bg-terracotta-tint", className)}
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
      className={cn(CONTROL, "resize-y py-2.5 leading-relaxed", className)}
      {...rest}
    />
  );
});

/** An unset filter is quiet; a set one takes the brand tint so it is easy to spot. */
export function Select({
  label,
  value,
  onChange,
  options,
  className,
  neutralValue = "",
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  /** The value that counts as "not set", so a sort default never reads as a filter. */
  neutralValue?: string;
}) {
  const active = value !== neutralValue && value !== "" && value !== "all";
  return (
    <label
      className={cn(
        "relative inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 pr-8 text-sm transition-colors duration-100 focus-within:border-active",
        active
          ? "border-violet-line bg-violet-tint text-violet-text"
          : "border-control bg-surface text-ink-body hover:bg-surface-sunken",
        className,
      )}
    >
      {label && <span className="text-ink-muted">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label ?? options.find((o) => o.value === value)?.label}
        className="cursor-pointer appearance-none bg-transparent py-2 font-medium focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute right-2.5">
        <Chevron />
      </span>
    </label>
  );
}

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
    <div className={cn("flex items-start justify-between gap-6 py-3.5", className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="cursor-pointer text-body font-medium text-ink">
          {label}
        </label>
        {detail && <p className="mt-0.5 text-sm text-ink-muted">{detail}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="flex h-[44px] w-[44px] shrink-0 items-center justify-center"
      >
        <span
          aria-hidden
          className={cn(
            "relative block h-[24px] w-[42px] rounded-full transition-colors duration-100",
            checked ? "bg-violet" : "bg-group",
          )}
        >
          <span
            className={cn(
              "absolute top-[2px] size-[20px] rounded-full bg-white shadow-tier2 transition-[left] duration-100",
              checked ? "left-[20px]" : "left-[2px]",
            )}
          />
        </span>
      </button>
    </div>
  );
}

/**
 * Tabs are an underline, not a row of pills. The selected label goes to full ink
 * weight, so colour is never the only cue.
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
  items: {
    value: T;
    label: string;
    count?: number;
    tone?: "violet" | "sage" | "apricot" | "terracotta";
  }[];
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
      className={cn("no-scrollbar flex items-stretch gap-5 overflow-x-auto border-b border-line", className)}
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
              "relative -mb-px flex min-h-[44px] items-center gap-1.5 border-b-2 text-sm whitespace-nowrap transition-colors duration-100",
              active
                ? "border-ink font-semibold text-ink"
                : "border-transparent font-medium text-ink-muted hover:text-ink",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  "tnum font-semibold",
                  active ? countTones[item.tone ?? "violet"] : "text-ink-muted",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
