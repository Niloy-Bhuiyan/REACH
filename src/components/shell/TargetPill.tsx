"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Controls";
import { Sheet, SheetGrip } from "@/components/ui/Overlay";
import { Eyebrow } from "@/components/ui/Surface";
import { setTarget } from "@/lib/api";
import type { Employment, Target, WorkMode } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

/**
 * The active career target reads as one restrained pill directly under the hero copy —
 * role, city, employment type and work mode, with one Change action.
 */
export function TargetPill({
  target,
  className,
  compact,
}: {
  target: Target;
  className?: string;
  compact?: boolean;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <div
        className={cn(
          "inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-brand-line bg-surface/85 px-4 py-1.5 text-[13.5px] text-ink-body",
          className,
        )}
      >
        <Eyebrow tone="brand">Target</Eyebrow>
        <span aria-hidden className="h-3 w-px bg-brand-line" />
        <span className="text-ink">{target.role}</span>
        <span aria-hidden className="text-ink-placeholder">
          ·
        </span>
        <span>{target.location}</span>
        {!compact && (
          <>
            <span aria-hidden className="text-ink-placeholder">
              ·
            </span>
            <span>
              {target.employment.join(" · ")} · {target.modes.join(" · ")}
            </span>
          </>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="ml-1 min-h-[44px] px-1 font-semibold text-brand-text hover:underline"
        >
          Change
        </button>
      </div>

      <TargetSheet open={editing} onClose={() => setEditing(false)} target={target} />
    </>
  );
}

export function TargetSheet({
  open,
  onClose,
  target,
}: {
  open: boolean;
  onClose: () => void;
  target: Target | null;
}) {
  const client = useQueryClient();
  const [role, setRole] = useState(target?.role ?? "");
  const [location, setLocation] = useState(target?.location ?? "Dhaka");
  const [mode, setMode] = useState<WorkMode>(target?.modes[0] ?? "Hybrid");
  const [employment, setEmployment] = useState<Employment>(
    target?.employment[0] ?? "Full-time",
  );

  const save = useMutation({
    mutationFn: () =>
      setTarget({
        role: role.trim(),
        location,
        modes: [mode],
        employment: [employment],
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["focus"] });
      void client.invalidateQueries({ queryKey: ["profile"] });
      onClose();
    },
  });

  return (
    <Sheet open={open} onClose={onClose} label="Change your target" height="min(560px, 88%)">
      <SheetGrip />
      <div className="flex h-full flex-col overflow-y-auto px-5 pb-5">
        <h2 className="font-display text-[22px] font-bold text-ink">Your target</h2>
        <p className="mt-1 text-[14px] leading-relaxed text-ink-body">
          Every verdict on every screen is judged against this. Clearing the role resets REACH to
          its first run.
        </p>

        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <Eyebrow>Role</Eyebrow>
            <Input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="Data Analyst"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <Eyebrow>Location</Eyebrow>
            <Input value={location} onChange={(event) => setLocation(event.target.value)} />
          </label>

          <div className="flex flex-col gap-1.5">
            <Eyebrow>Work mode</Eyebrow>
            <Select
              value={mode}
              onChange={(value) => setMode(value as WorkMode)}
              options={[
                { value: "Hybrid", label: "Hybrid" },
                { value: "Remote", label: "Remote" },
                { value: "On-site", label: "On-site" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Eyebrow>Employment type</Eyebrow>
            <Select
              value={employment}
              onChange={(value) => setEmployment(value as Employment)}
              options={[
                { value: "Full-time", label: "Full-time" },
                { value: "Internship", label: "Internship" },
                { value: "Part-time", label: "Part-time" },
              ]}
            />
          </div>
        </div>

        <div className="mt-auto flex gap-2 pt-6">
          <Button variant="secondary" size="lg" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            size="lg"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="flex-[2]"
          >
            {save.isPending ? "Saving…" : "Save target"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
