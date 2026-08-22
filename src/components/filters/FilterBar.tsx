"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Select } from "@/components/ui/Controls";
import { Sheet, SheetGrip } from "@/components/ui/Overlay";
import { Eyebrow } from "@/components/ui/Surface";
import type { Employment, JobQuery, WorkMode } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

export const MODES: WorkMode[] = ["Remote", "Hybrid", "On-site"];
export const TYPES: Employment[] = ["Full-time", "Internship", "Part-time"];
export const POSTED = [
  { value: "3", label: "Posted < 3 days" },
  { value: "7", label: "Posted < 1 week" },
  { value: "14", label: "Posted < 2 weeks" },
];

/** Filters the toolbar hides are grouped and labelled, never dropped. */
export function activeFilterCount(query: JobQuery): number {
  return [query.location, query.mode, query.employment, query.postedWithinDays, query.savedOnly]
    .filter(Boolean).length;
}

/**
 * Working Mode toolbar: four visible controls plus "More filters · n", sort and the saved
 * count — the five-control cap. Sticky under the page header.
 */
export function FilterBar({
  query,
  onChange,
  savedCount,
  className,
}: {
  query: JobQuery;
  onChange: (patch: Partial<JobQuery>) => void;
  savedCount: number;
  className?: string;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const extra = activeFilterCount(query);

  return (
    <>
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <Select
          label="Role:"
          value={query.q ?? ""}
          onChange={(value) => onChange({ q: value || undefined })}
          options={[
            { value: "", label: "Any role" },
            { value: "Data Analyst", label: "Data Analyst" },
            { value: "Business Analyst", label: "Business Analyst" },
            { value: "Analyst", label: "Any analyst role" },
          ]}
          className="hidden md:inline-flex"
        />
        <Select
          value={query.location ?? ""}
          onChange={(value) => onChange({ location: value || undefined })}
          options={[
            { value: "", label: "Anywhere" },
            { value: "Dhaka", label: "Dhaka" },
            { value: "Remote", label: "Remote · BD" },
          ]}
          className="hidden sm:inline-flex"
        />
        <Select
          value={query.mode ?? ""}
          onChange={(value) => onChange({ mode: (value || undefined) as WorkMode })}
          options={[
            { value: "", label: "Any mode" },
            ...MODES.map((m) => ({ value: m, label: m })),
          ]}
          className="hidden sm:inline-flex"
        />
        <Select
          value={query.employment ?? ""}
          onChange={(value) => onChange({ employment: (value || undefined) as Employment })}
          options={[
            { value: "", label: "Any type" },
            ...TYPES.map((t) => ({ value: t, label: t })),
          ]}
          className="hidden lg:inline-flex"
        />

        <Button variant="secondary" size="md" onClick={() => setSheetOpen(true)}>
          <span className="sm:hidden">Filters</span>
          <span className="hidden sm:inline">More filters</span>
          {extra > 0 && (
            <span className="tnum ml-1 rounded-md bg-violet-tint px-1.5 py-0.5 text-[12px] font-bold text-violet-text">
              {extra}
            </span>
          )}
        </Button>

        <Select
          label="Sort:"
          value={query.sort ?? "best-fit"}
          onChange={(value) => onChange({ sort: value as JobQuery["sort"] })}
          options={[
            { value: "best-fit", label: "Best fit" },
            { value: "newest", label: "Newest" },
            { value: "closing-soon", label: "Closing soon" },
          ]}
          className="hidden md:inline-flex"
        />

        <Button
          variant={query.savedOnly ? "primary" : "secondary"}
          size="md"
          onClick={() => onChange({ savedOnly: query.savedOnly ? undefined : true })}
          aria-pressed={!!query.savedOnly}
          className="ml-auto"
        >
          Saved <span className="tnum ml-1">{savedCount}</span>
        </Button>
      </div>

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        query={query}
        onChange={onChange}
      />
    </>
  );
}

/** Active filters render as removable chips, so what narrowed the set is always visible. */
export function ActiveFilterChips({
  query,
  onChange,
  className,
}: {
  query: JobQuery;
  onChange: (patch: Partial<JobQuery>) => void;
  className?: string;
}) {
  const chips: { key: keyof JobQuery; label: string }[] = [];
  if (query.q) chips.push({ key: "q", label: query.q });
  if (query.location) chips.push({ key: "location", label: query.location });
  if (query.mode) chips.push({ key: "mode", label: query.mode });
  if (query.employment) chips.push({ key: "employment", label: query.employment });
  if (query.postedWithinDays)
    chips.push({ key: "postedWithinDays", label: `Posted < ${query.postedWithinDays} days` });
  if (query.savedOnly) chips.push({ key: "savedOnly", label: "Saved only" });

  if (chips.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange({ [chip.key]: undefined })}
          aria-label={`Remove filter ${chip.label}`}
          className="min-h-[36px]"
        >
          <Chip tone="violet">
            {chip.label}
            <span aria-hidden className="text-[13px]">
              ✕
            </span>
          </Chip>
        </button>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange({
            q: undefined,
            location: undefined,
            mode: undefined,
            employment: undefined,
            postedWithinDays: undefined,
            savedOnly: undefined,
          })
        }
        className="min-h-[36px] px-1 text-[13px] font-semibold text-violet-text hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}

/**
 * The sheet holds every filter the toolbar hides, grouped and labelled, 44px minimum targets,
 * with the result count live on the primary button.
 */
export function FilterSheet({
  open,
  onClose,
  query,
  onChange,
  resultCount,
}: {
  open: boolean;
  onClose: () => void;
  query: JobQuery;
  onChange: (patch: Partial<JobQuery>) => void;
  resultCount?: number;
}) {
  const groups = [
    {
      label: "Type",
      options: TYPES.map((t) => ({ label: t, active: query.employment === t, apply: () => onChange({ employment: query.employment === t ? undefined : t }) })),
    },
    {
      label: "Work mode",
      options: MODES.map((m) => ({ label: m, active: query.mode === m, apply: () => onChange({ mode: query.mode === m ? undefined : m }) })),
    },
    {
      label: "Location",
      options: ["Dhaka", "Remote"].map((l) => ({ label: l, active: query.location === l, apply: () => onChange({ location: query.location === l ? undefined : l }) })),
    },
    {
      label: "Posted",
      options: POSTED.map((p) => ({
        label: p.label,
        active: query.postedWithinDays === Number(p.value),
        apply: () =>
          onChange({
            postedWithinDays:
              query.postedWithinDays === Number(p.value) ? undefined : Number(p.value),
          }),
      })),
    },
  ];

  return (
    <Sheet open={open} onClose={onClose} label="Filters" height="min(620px, 92%)">
      <SheetGrip />
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between px-5 pb-3">
          <h2 className="font-display text-[21px] font-bold text-ink">Filters</h2>
          <button
            type="button"
            onClick={() =>
              onChange({
                q: undefined,
                location: undefined,
                mode: undefined,
                employment: undefined,
                postedWithinDays: undefined,
                savedOnly: undefined,
              })
            }
            className="min-h-[44px] px-1 text-[13.5px] font-semibold text-violet-text hover:underline"
          >
            Reset
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          {groups.map((group) => (
            <div key={group.label} className="border-t border-hairline py-4 first:border-t-0">
              <Eyebrow>{group.label}</Eyebrow>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {group.options.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={option.apply}
                    aria-pressed={option.active}
                    className={cn(
                      "min-h-[48px] rounded-[10px] border-[1.5px] px-4 text-[14px] transition-colors duration-100",
                      option.active
                        ? "border-control bg-violet-tint font-semibold text-violet-text"
                        : "border-line bg-surface text-ink-body hover:bg-row-hover",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shrink-0 border-t border-line px-5 py-3.5">
          <Button size="lg" full onClick={onClose}>
            {resultCount === undefined ? "Show results" : `Show ${resultCount} results`}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
