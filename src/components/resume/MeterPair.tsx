import { Meta, Mono } from "@/components/ui/Chip";
import { Disclosure } from "@/components/ui/Disclosure";
import { Meter } from "@/components/ui/Meter";
import { Hairline } from "@/components/ui/Surface";
import type { Keyword, MeterReading } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

/**
 * Two readings that never merge. ATS Readiness is a property of the document —
 * no job involved. JD Match is a property of one posting. Each leads with a word,
 * neither shows a 0–100 number, and their derivations are one click away rather
 * than spread across the screen.
 *
 * With no JD selected, JD Match reads "Not yet measured" on an empty track. A 0%
 * bar would be a false statement about the CV.
 */
export function MeterPair({
  ats,
  jd,
  jobLabel,
  onPickJob,
  className,
}: {
  ats: MeterReading;
  jd: MeterReading | null;
  jobLabel: string | null;
  onPickJob: () => void;
  className?: string;
}) {
  return (
    <div className={cn("divide-y divide-line border-y border-line", className)}>
      <Reading
        title="ATS Readiness"
        subtitle="the document itself"
        reading={ats}
        tone="brand"
      />

      {jd ? (
        <Reading
          title="JD Match"
          subtitle={jobLabel ?? "this posting only"}
          reading={jd}
          tone={jd.value === "strong" ? "brand" : "apricot"}
        />
      ) : (
        <div className="py-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-ink">JD Match</span>
            <span className="text-body font-semibold text-ink-muted">Not yet measured</span>
          </div>
          <Meter fill={null} label="Not yet measured" className="mt-2" />
          <p className="mt-2 text-sm text-ink-muted">
            Needs one job description. It is never a score on its own.
          </p>
          <button
            type="button"
            onClick={onPickJob}
            className="mt-1 min-h-[36px] text-sm font-medium text-brand-text hover:underline"
          >
            Pick a job to measure against
          </button>
        </div>
      )}
    </div>
  );
}

function Reading({
  title,
  subtitle,
  reading,
  tone,
}: {
  title: string;
  subtitle: string;
  reading: MeterReading;
  tone: "brand" | "apricot";
}) {
  const word = reading.value ? reading.value[0].toUpperCase() + reading.value.slice(1) : "—";

  return (
    <div className="py-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-ink">{title}</span>
        <span
          className={cn(
            "text-body font-semibold",
            tone === "brand" ? "text-brand-text" : "text-apricot-text",
          )}
        >
          {word}
        </span>
      </div>
      <Meter fill={reading.fill} tone={tone} label={`${title}: ${word}`} className="mt-2" />
      <p className="mt-2">
        <Meta>{subtitle}</Meta>
      </p>

      <Disclosure label="What this is from" className="mt-2 border-t-0">
        <dl className="pt-1">
          {reading.derivation.map((row, i) => (
            <div key={row.label}>
              {i > 0 && <Hairline />}
              <div className="flex items-baseline justify-between gap-3 py-1.5">
                <dt className="text-sm text-ink-body">{row.label}</dt>
                <dd className="tnum font-mono text-meta text-ink">{row.value}</dd>
              </div>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-sm text-ink-muted">{reading.footnote}</p>
      </Disclosure>
    </div>
  );
}

/**
 * Keywords grouped by consequence, every group labelled, so colour is never the
 * only cue.
 */
export function KeywordGroups({
  keywords,
  present,
  total,
  className,
}: {
  keywords: Keyword[];
  present: number | null;
  total: number | null;
  className?: string;
}) {
  const groups: {
    state: Keyword["state"];
    label: string;
    tone: string;
  }[] = [
    { state: "missing-high", label: "High priority · missing", tone: "text-terracotta-text" },
    { state: "missing", label: "Missing · lower priority", tone: "text-apricot-text" },
    { state: "matched", label: "Matched", tone: "text-sage-text" },
  ];

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
        <h3 className="text-sm font-medium text-ink">Keywords from this JD</h3>
        {present !== null && total !== null && (
          <Mono>
            {present} of {total}
          </Mono>
        )}
      </div>

      {groups.map((group) => {
        const items = keywords.filter((k) => k.state === group.state);
        if (items.length === 0) return null;
        return (
          <div key={group.state} className="border-b border-hairline py-3 last:border-b-0">
            <p className={cn("text-meta font-medium", group.tone)}>{group.label}</p>
            <p className="mt-1 text-sm text-ink-body">
              {items.map((k) => k.text).join(", ")}
            </p>
          </div>
        );
      })}
    </div>
  );
}
