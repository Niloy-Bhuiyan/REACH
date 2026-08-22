"use client";

import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Controls";
import { Sheet, SheetGrip } from "@/components/ui/Overlay";
import { Eyebrow } from "@/components/ui/Surface";
import type { Employment, JobQuery, WorkMode } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

export const MODES: WorkMode[] = ["Remote", "Hybrid", "On-site"];
export const TYPES: Employment[] = ["Full-time", "Internship", "Part-time"];
export const POSTED = [
  { value: "3", label: "Last 3 days" },
  { value: "7", label: "Last week" },
  { value: "14", label: "Last 2 weeks" },
];

/** Filters the toolbar hides are grouped and labelled in the sheet, never dropped. */
export function activeFilterCount(query: JobQuery): number {
  return [query.employment, query.postedWithinDays, query.savedOnly].filter(Boolean).length;
}

/**
 * Two filters that most people change, one door to the rest, and sort. Anything
 * more on the toolbar is a decision the user has not asked to make yet.
 */
export function FilterBar({
  query,
  onChange,
  onOpenSheet,
  className,
}: {
  query: JobQuery;
  onChange: (patch: Partial<JobQuery>) => void;
  onOpenSheet: () => void;
  className?: string;
}) {
  const extra = activeFilterCount(query);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Select
        value={query.location ?? ""}
        onChange={(value) => onChange({ location: value || undefined })}
        options={[
          { value: "", label: "Anywhere" },
          { value: "Dhaka", label: "Dhaka" },
          { value: "Remote", label: "Remote" },
        ]}
      />
      <Select
        value={query.mode ?? ""}
        onChange={(value) => onChange({ mode: (value || undefined) as WorkMode })}
        options={[
          { value: "", label: "Any mode" },
          ...MODES.map((m) => ({ value: m, label: m })),
        ]}
      />

      <Button variant="secondary" size="md" onClick={onOpenSheet}>
        More filters
        {extra > 0 && <span className="tnum font-semibold text-brand-text">{extra}</span>}
      </Button>

      <Select
        label="Sort"
        value={query.sort ?? "best-fit"}
        onChange={(value) => onChange({ sort: value as JobQuery["sort"] })}
        neutralValue="best-fit"
        options={[
          { value: "best-fit", label: "Best fit" },
          { value: "newest", label: "Newest" },
          { value: "closing-soon", label: "Closing soon" },
        ]}
        className="sm:ml-auto"
      />
    </div>
  );
}

/** What narrowed the set is always visible, and always removable. */
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
  if (query.q) chips.push({ key: "q", label: `“${query.q}”` });
  if (query.employment) chips.push({ key: "employment", label: query.employment });
  if (query.postedWithinDays)
    chips.push({ key: "postedWithinDays", label: `Posted in ${query.postedWithinDays} days` });
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
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-brand-tint px-2.5 text-meta font-medium text-brand-text transition-colors duration-100 hover:bg-brand-line"
        >
          {chip.label}
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="size-3 opacity-70"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
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
        className="min-h-[36px] px-1 text-meta font-medium text-ink-muted hover:text-ink hover:underline"
      >
        Clear
      </button>
    </div>
  );
}

/** Everything the toolbar hides, grouped and labelled, with the count on the button. */
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
      label: "Employment type",
      options: TYPES.map((t) => ({
        label: t,
        active: query.employment === t,
        apply: () => onChange({ employment: query.employment === t ? undefined : t }),
      })),
    },
    {
      label: "Work mode",
      options: MODES.map((m) => ({
        label: m,
        active: query.mode === m,
        apply: () => onChange({ mode: query.mode === m ? undefined : m }),
      })),
    },
    {
      label: "Location",
      options: ["Dhaka", "Remote"].map((l) => ({
        label: l,
        active: query.location === l,
        apply: () => onChange({ location: query.location === l ? undefined : l }),
      })),
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
    {
      label: "Saved",
      options: [
        {
          label: "Saved only",
          active: !!query.savedOnly,
          apply: () => onChange({ savedOnly: query.savedOnly ? undefined : true }),
        },
      ],
    },
  ];

  return (
    <Sheet open={open} onClose={onClose} label="Filters" height="min(640px, 92%)">
      <SheetGrip />
      <div className="flex min-h-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between px-6 pb-2">
          <h2 className="text-section text-ink">Filters</h2>
          <Button
            variant="link"
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
          >
            Reset
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          {groups.map((group) => (
            <div key={group.label} className="border-t border-line py-5 first:border-t-0">
              <Eyebrow>{group.label}</Eyebrow>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {group.options.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={option.apply}
                    aria-pressed={option.active}
                    className={cn(
                      "min-h-[44px] rounded-lg border px-3.5 text-sm transition-colors duration-100",
                      option.active
                        ? "border-brand-line bg-brand-tint font-medium text-brand-text"
                        : "border-control bg-surface text-ink-body hover:bg-surface-sunken",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shrink-0 border-t border-line px-6 py-4">
          <Button size="lg" full onClick={onClose}>
            {resultCount === undefined ? "Show results" : `Show ${resultCount} results`}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
