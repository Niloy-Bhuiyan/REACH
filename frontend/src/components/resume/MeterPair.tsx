import { Chip, Mono } from "@/components/ui/Chip";
import { Meter } from "@/components/ui/Meter";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { Card, Eyebrow, Hairline } from "@/components/ui/Surface";
import type { Keyword, MeterReading } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

/**
 * Two meters, permanently separate. ATS Readiness is a property of the document — no job
 * involved. JD Match is a property of one posting. Neither shows a 0–100 number, both lead
 * with a word, and they are never summed or averaged.
 *
 * With no JD selected, JD Match reads "Not yet measured" on a dashed surface with an empty
 * track. A 0% bar would be a false statement about the CV.
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
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      <MeterPanel
        glyph="g-ats"
        title="ATS Readiness"
        caption={ats.caption}
        reading={ats}
        tone="violet"
      />

      {jd ? (
        <MeterPanel
          glyph="g-jdmatch"
          title="JD Match"
          subtitle={jobLabel ?? undefined}
          caption={jd.caption}
          reading={jd}
          // Sage is Apply Now only. A partial match is an improvement, so it reads apricot;
          // a strong one reads violet, because neither meter is a verdict.
          tone={jd.value === "strong" ? "violet" : "apricot"}
        />
      ) : (
        <Card className="border-dashed p-4">
          <div className="flex items-center gap-2.5">
            <PixelIcon name="g-jdmatch" size={24} />
            <Eyebrow>JD Match</Eyebrow>
          </div>
          <p className="mt-2 font-display text-[22px] leading-tight font-bold text-ink-muted">
            Not yet measured
          </p>
          <Meter fill={null} label="Not yet measured" className="mt-2.5" />
          <p className="mt-2.5 text-[13px] leading-relaxed text-ink-body">
            Needs one job description. It is never a score on its own.
          </p>
          <button
            type="button"
            onClick={onPickJob}
            className="mt-2 min-h-[44px] text-[13.5px] font-semibold text-violet-text hover:underline"
          >
            Pick a job to measure against →
          </button>
        </Card>
      )}
    </div>
  );
}

function MeterPanel({
  glyph,
  title,
  subtitle,
  caption,
  reading,
  tone,
}: {
  glyph: string;
  title: string;
  subtitle?: string;
  caption: string;
  reading: MeterReading;
  tone: "violet" | "sage" | "apricot";
}) {
  const word = reading.value ? reading.value[0].toUpperCase() + reading.value.slice(1) : "—";

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <PixelIcon name={glyph} size={24} />
        <Eyebrow>{title}</Eyebrow>
        {subtitle && <Mono className="normal-case">{subtitle}</Mono>}
      </div>

      {/* The verdict word leads; the bar supports it. */}
      <p className="mt-2 flex items-baseline gap-2.5">
        <span
          className={cn(
            "font-display text-[24px] leading-none font-extrabold",
            tone === "violet"
              ? "text-violet-text"
              : tone === "apricot"
                ? "text-apricot-text"
                : "text-sage-text",
          )}
        >
          {word}
        </span>
        <span className="text-[12.5px] text-ink-muted">{caption}</span>
      </p>

      <Meter
        fill={reading.fill}
        tone={tone}
        label={`${title}: ${word}`}
        className="mt-2.5"
      />

      <dl className="mt-3">
        {reading.derivation.map((row, i) => (
          <div key={row.label}>
            {i > 0 && <Hairline />}
            <div className="flex items-baseline justify-between gap-3 py-1.5">
              <dt className="text-[13px] text-ink-body">{row.label}</dt>
              <dd className="tnum font-mono text-[12.5px] text-ink">{row.value}</dd>
            </div>
          </div>
        ))}
      </dl>

      <p className="mt-2 border-t border-hairline pt-2.5 text-[12.5px] leading-snug text-ink-muted">
        {reading.footnote}
      </p>
    </Card>
  );
}

/**
 * Keywords are grouped by consequence and every group is labelled, so colour never carries
 * the meaning alone.
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
  const groups: { state: Keyword["state"]; label: string; tone: "terracotta" | "apricot" | "sage" }[] =
    [
      { state: "missing-high", label: "High priority · missing", tone: "terracotta" },
      { state: "missing", label: "Missing · lower priority", tone: "apricot" },
      { state: "matched", label: "Matched", tone: "sage" },
    ];

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Eyebrow>Keywords from this JD</Eyebrow>
        {present !== null && total !== null && (
          <Mono>
            {present} of {total} present
          </Mono>
        )}
      </div>

      {groups.map((group) => {
        const items = keywords.filter((k) => k.state === group.state);
        if (items.length === 0) return null;
        const shown = group.state === "matched" ? items.slice(0, 8) : items;
        return (
          <div key={group.state}>
            <Eyebrow tone={group.tone}>{group.label}</Eyebrow>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {shown.map((keyword) => (
                <Chip key={keyword.text} tone={group.tone}>
                  <PixelIcon
                    name={group.state === "matched" ? "g-kw-match" : "g-kw-missing"}
                    size={13}
                  />
                  {keyword.text}
                </Chip>
              ))}
              {items.length > shown.length && (
                <Chip tone="stone">+{items.length - shown.length} more</Chip>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
