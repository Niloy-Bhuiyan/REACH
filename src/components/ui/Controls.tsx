"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils/cn";
import { Chevron } from "./Button";
import { Icon, type IconName } from "./Icon";

/** Controls rest on a warm hairline and only take colour when focused. */
const CONTROL =
  "w-full rounded-xl border border-control bg-surface px-3.5 text-body text-ink " +
  "placeholder:text-ink-placeholder min-h-[46px] transition-colors duration-150 " +
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
      className={cn(CONTROL, "resize-y py-3 leading-relaxed", className)}
      {...rest}
    />
  );
});

/**
 * A filter is a pill. Unset it is quiet paper; set it takes the brand tint, so a
 * glance at the row tells you what is narrowing the results.
 */
export function Select({
  label,
  icon,
  value,
  onChange,
  options,
  className,
  neutralValue = "",
}: {
  label?: string;
  icon?: IconName;
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
        "relative inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 pr-9 text-sm transition-colors duration-150 focus-within:border-active",
        active
          ? "border-brand-line bg-brand-tint text-brand-text"
          : "border-control bg-surface text-ink-body hover:bg-surface-sunken",
        className,
      )}
    >
      {icon && (
        <Icon
          name={icon}
          size={16}
          className={active ? "text-brand-text" : "text-ink-muted"}
        />
      )}
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
      <span aria-hidden className="pointer-events-none absolute right-3">
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
    <div className={cn("flex items-start justify-between gap-6 py-4", className)}>
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
            "relative block h-[24px] w-[42px] rounded-full transition-colors duration-150",
            checked ? "bg-brand" : "bg-group",
          )}
        >
          <span
            className={cn(
              "absolute top-[2px] size-[20px] rounded-full bg-white shadow-tier2 transition-[left] duration-150",
              checked ? "left-[20px]" : "left-[2px]",
            )}
          />
        </span>
      </button>
    </div>
  );
}

/**
 * Two shapes, one component.
 *
 *   underline  — for switching a working surface inside a page.
 *   segmented  — for filtering a list. A pill track with one filled pill, which
 *                is the shape a thumb expects on a phone.
 *
 * In both, the selected label goes to full ink weight, so colour is never the
 * only cue.
 */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
  className,
  ariaLabel,
  variant = "underline",
}: {
  value: T;
  onChange: (next: T) => void;
  items: {
    value: T;
    label: string;
    count?: number;
    tone?: "brand" | "sage" | "apricot" | "terracotta";
  }[];
  className?: string;
  ariaLabel: string;
  variant?: "underline" | "segmented";
}) {
  const countTones = {
    brand: "text-brand-text",
    sage: "text-sage-text",
    apricot: "text-apricot-text",
    terracotta: "text-terracotta-text",
  } as const;

  if (variant === "segmented") {
    return (
      <div
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          "no-scrollbar flex items-stretch gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1",
          className,
        )}
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
                "flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-full px-3.5 text-sm whitespace-nowrap transition-colors duration-150",
                active
                  ? "bg-brand font-semibold text-white"
                  : "font-medium text-ink-body hover:bg-surface-sunken",
              )}
            >
              {item.label}
              {item.count !== undefined && (
                <span
                  className={cn(
                    "tnum font-semibold",
                    active ? "text-white/80" : "text-ink-muted",
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

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "no-scrollbar flex items-stretch gap-6 overflow-x-auto border-b border-line",
        className,
      )}
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
              "relative -mb-px flex min-h-[46px] items-center gap-1.5 border-b-2 text-sm whitespace-nowrap transition-colors duration-150",
              active
                ? "border-brand font-semibold text-ink"
                : "border-transparent font-medium text-ink-muted hover:text-ink",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  "tnum font-semibold",
                  active ? countTones[item.tone ?? "brand"] : "text-ink-muted",
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
