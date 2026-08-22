"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useMemo } from "react";
import { useAssistantSubject } from "@/components/assistant/AssistantProvider";
import { AssistantEntry } from "@/components/assistant/AssistantSurface";
import { OpportunityDelta } from "@/components/delta/OpportunityDelta";
import { EvidenceRow } from "@/components/evidence/EvidenceRow";
import { FreshnessStamp } from "@/components/job/JobRow";
import { useSetStatusLine } from "@/components/shell/AppShell";
import { Arrow, Button, ButtonLink } from "@/components/ui/Button";
import { Chip, Mono } from "@/components/ui/Chip";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { Card, Eyebrow, Hairline, SectionHead } from "@/components/ui/Surface";
import { Skeleton, SkeletonRows } from "@/components/ui/States";
import { VerdictBadge } from "@/components/verdict/VerdictBadge";
import {
  getDelta,
  getJob,
  getLatestRun,
  getSimilarJobs,
  hideJob,
  listJobs,
  saveJob,
} from "@/lib/api";
import { qk } from "@/lib/api/keys";
import type { JobDetail, Verdict } from "@/lib/api/types";
import { useIsMobile } from "@/lib/hooks";
import { ago, closingDate, daysUntil } from "@/lib/utils/time";
import { VERDICT_TONE } from "@/lib/utils/verdict";

/**
 * One anatomy, three verdict skins: header, verdict block, hard requirements, preferred +
 * missing, eligibility, provenance. Only the verdict colour, the sentence and the primary
 * action change. There are no percentages on this screen.
 *
 * Desktop keeps context — the Discovery rail stays visible with the open row selected, and the
 * run itself is never lost because it lives in the query cache, not in Discovery's state.
 */
export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isMobile = useIsMobile();

  const job = useQuery({ queryKey: qk.job(id), queryFn: () => getJob(id) });
  const list = useQuery({ queryKey: qk.jobs({ sort: "best-fit" }), queryFn: () => listJobs({}) });
  const run = useQuery({ queryKey: qk.latestRun, queryFn: getLatestRun });

  useSetStatusLine(run.data?.completedAt ? `Verified ${ago(run.data.completedAt)}` : null);
  useAssistantSubject({
    scope: job.data?.verdict === "skip" ? "skip" : "job",
    id,
    label: "Ask about this job",
    subject: job.data ? `This job · ${job.data.role} at ${job.data.company}` : "This job",
  });

  const group = useMemo(() => {
    if (!list.data || !job.data) return [];
    return list.data.jobs.filter((j) => j.verdict === job.data!.verdict);
  }, [list.data, job.data]);

  const index = group.findIndex((j) => j.id === id);
  const previous = index > 0 ? group[index - 1] : null;
  const next = index >= 0 && index < group.length - 1 ? group[index + 1] : null;

  if (job.isLoading || !job.data) return <DetailSkeleton />;

  const detail = job.data;

  return (
    <div className="mx-auto grid w-full max-w-[1440px] gap-0 md:grid-cols-[minmax(0,40%)_minmax(0,60%)]">
      {/* The list stays behind at 68% opacity with the open row selected. */}
      <aside className="hidden min-w-0 border-r border-line px-6 py-6 opacity-[.68] transition-opacity duration-100 hover:opacity-100 md:block">
        <div className="flex items-baseline gap-2.5">
          <h2 className="font-display text-[20px] font-bold text-ink">
            {list.data?.total ?? 0} opportunities
          </h2>
          {run.data?.completedAt && <Mono>verified {ago(run.data.completedAt)}</Mono>}
        </div>

        <div className="mt-3 flex items-center gap-4 border-b border-line pb-2">
          {(["apply-now", "one-fix-away", "skip"] as Verdict[]).map((verdict) => (
            <Link
              key={verdict}
              href={`/discover?verdict=${verdict}`}
              className={cnTab(verdict === detail.verdict)}
            >
              {verdict === "apply-now" ? "Apply" : verdict === "one-fix-away" ? "One fix" : "Skip"}{" "}
              <span className={`tnum font-bold ${VERDICT_TONE[verdict].text}`}>
                {list.data?.counts[verdict] ?? 0}
              </span>
            </Link>
          ))}
        </div>

        <ul className="mt-1 flex flex-col">
          {group.slice(0, 8).map((row) => {
            const selected = row.id === id;
            return (
              <li key={row.id}>
                <Link
                  href={`/jobs/${row.id}`}
                  aria-current={selected ? "true" : undefined}
                  className={`relative block rounded-[10px] px-3 py-3 transition-colors duration-100 ${
                    selected ? "bg-violet-tint" : "hover:bg-row-hover"
                  }`}
                >
                  {selected && (
                    <span
                      aria-hidden
                      className="absolute top-3 bottom-3 left-0 w-[3px] rounded-r bg-violet"
                    />
                  )}
                  <span className="flex items-baseline justify-between gap-3">
                    <span
                      className={`text-[14px] font-semibold ${selected ? "text-ink" : "text-ink-link"}`}
                    >
                      {row.role}
                    </span>
                    <Mono>{ago(row.provenance.verifiedAt).replace(" ago", "")}</Mono>
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-ink-muted">
                    {row.company} · {row.location} · {row.mode}
                  </span>
                  {selected && (
                    <span className="mt-1 block text-[12.5px] font-semibold text-violet-text">
                      Open in detail
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      <JobPanel
        detail={detail}
        index={index}
        total={group.length}
        previous={previous?.id ?? null}
        next={next?.id ?? null}
        isMobile={isMobile}
      />
    </div>
  );
}

function cnTab(active: boolean) {
  return `flex min-h-[44px] items-center pb-1.5 text-[13.5px] ${
    active ? "border-b-2 border-active font-semibold text-ink" : "text-ink-body"
  }`;
}

/* ── The panel ──────────────────────────────────────────────────────────── */

function JobPanel({
  detail,
  index,
  total,
  previous,
  next,
  isMobile,
}: {
  detail: JobDetail;
  index: number;
  total: number;
  previous: string | null;
  next: string | null;
  isMobile: boolean;
}) {
  const client = useQueryClient();
  const router = useRouter();
  const tone = VERDICT_TONE[detail.verdict];

  const delta = useQuery({
    queryKey: qk.delta(detail.blocker?.fixId ?? "sql"),
    queryFn: () => getDelta(detail.blocker?.fixId ?? "sql"),
    enabled: detail.verdict === "one-fix-away",
  });

  const similar = useQuery({
    queryKey: qk.similar(detail.id),
    queryFn: () => getSimilarJobs(detail.id),
    enabled: detail.verdict === "skip",
  });

  const save = useMutation({
    mutationFn: () => saveJob(detail.id, !detail.saved),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: qk.job(detail.id) });
      void client.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const hide = useMutation({
    mutationFn: () => hideJob(detail.id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["jobs"] });
      router.push("/discover?verdict=skip");
    },
  });

  const days = detail.provenance.closesAt ? daysUntil(detail.provenance.closesAt) : null;

  return (
    <article className="min-w-0 bg-surface px-5 pt-5 pb-28 md:px-8 md:pb-10 md:shadow-tier3">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/discover"
          className="min-h-[44px] content-center text-[13.5px] font-semibold text-violet-text hover:underline"
        >
          ← Back to results
        </Link>
        {index >= 0 && (
          <span className="ml-auto flex items-center gap-2">
            <Mono>
              Role {index + 1} of {total}
            </Mono>
            <Button
              variant="secondary"
              size="sm"
              disabled={!previous}
              reason="This is the first role in the group"
              onClick={() => previous && router.push(`/jobs/${previous}`)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!next}
              reason="This is the last role in the group"
              onClick={() => next && router.push(`/jobs/${next}`)}
            >
              Next
            </Button>
          </span>
        )}
      </div>

      {/* Header */}
      <header className="mt-3 flex flex-wrap items-start gap-4">
        <span
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[12px] border border-line bg-canvas font-display text-[22px] font-bold text-ink-muted"
          aria-hidden
        >
          {detail.companyInitial}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[28px] leading-tight font-extrabold text-ink md:text-[34px]">
            {detail.role}
          </h1>
          <p className="mt-1 text-[14.5px] text-ink-body">
            {detail.companyFull} · {detail.location} · {detail.mode} · {detail.employment}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {detail.salary && <Chip tone="stone">{detail.salary}</Chip>}
            {detail.experience && <Chip tone="stone">{detail.experience}</Chip>}
            {detail.team && <Chip tone="stone">{detail.team}</Chip>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <VerdictBadge verdict={detail.verdict} size="lg" />
          {days !== null && (
            <Mono>
              Deadline {closingDate(detail.provenance.closesAt!)} · {days} days
            </Mono>
          )}
        </div>
      </header>

      {/* The verdict is a sentence, not a score. */}
      <section
        className={`mt-4 flex flex-wrap items-start gap-4 rounded-[14px] border p-5 ${tone.tint} ${tone.line}`}
      >
        <PixelIcon
          name={
            detail.verdict === "apply-now"
              ? "px-apply"
              : detail.verdict === "one-fix-away"
                ? "px-wrench"
                : "g-req-missing"
          }
          size={44}
          height={detail.verdict === "skip" ? 44 : 50}
        />
        <div className="min-w-0 flex-1">
          {detail.verdict === "skip" && (
            <Eyebrow tone="terracotta" className="mb-1 block">
              Hard blocker
            </Eyebrow>
          )}
          <h2 className={`font-display text-[20px] leading-snug font-bold ${tone.text}`}>
            {detail.verdict === "skip"
              ? detail.skipBlocker?.title
              : detail.verdictHeadline}
          </h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-ink-body">
            {detail.verdict === "skip" ? detail.skipBlocker?.body : detail.verdictBody}
          </p>
        </div>

        {/* The verdict determines the action bar. */}
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
          {detail.verdict === "apply-now" && (
            <>
              <a
                href={detail.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] items-center justify-center gap-2.5 rounded-[10px] bg-sage px-5 text-[15px] font-semibold text-surface transition-colors duration-100 hover:bg-sage-hover"
              >
                Apply on company site <Arrow />
              </a>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => save.mutate()} className="flex-1">
                  {detail.saved ? "Saved" : "Save"}
                </Button>
                <ButtonLink href="/resume" variant="secondary" className="flex-1">
                  Tailor CV
                </ButtonLink>
              </div>
            </>
          )}

          {detail.verdict === "one-fix-away" && (
            <>
              <ButtonLink
                href={`/one-fix/${detail.blocker?.fixId ?? "sql"}`}
                tone="apricot"
                size="lg"
              >
                See the One Fix <Arrow />
              </ButtonLink>
              <Button variant="secondary" onClick={() => save.mutate()} full>
                {detail.saved ? "Saved" : "Save"}
              </Button>
              {/* Applying is still your call — present, but demoted to a text link. */}
              <a
                href={detail.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center text-[13.5px] font-semibold text-ink-muted hover:text-ink hover:underline"
              >
                Apply anyway ↗
              </a>
            </>
          )}

          {/* 12C — Skip: applying is available but demoted to a text link. */}
          {detail.verdict === "skip" && (
            <>
              <ButtonLink href="/discover?verdict=apply-now" size="lg">
                Show the {similar.data?.length ?? 6} <Arrow />
              </ButtonLink>
              <Button variant="secondary" onClick={() => hide.mutate()}>
                Hide this role
              </Button>
              <p className="mt-1 text-center text-[12.5px] text-ink-muted">
                Disagree? Applying is still your call.{" "}
                <a
                  href={detail.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-terracotta-text underline"
                >
                  Apply anyway ↗
                </a>
              </p>
            </>
          )}
        </div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)]">
        <div className="min-w-0">
          {detail.hardRequirements.length > 0 && (
            <Card className="overflow-hidden">
              <SectionHead
                glyph="px-cv"
                glyphSize={26}
                title="Hard requirements"
                detail="Every row shows the evidence behind it"
                className="px-4 pt-4 pb-2"
                action={
                  <Chip tone={detail.evidence.met === detail.evidence.total ? "sage" : "apricot"}>
                    {detail.evidence.met} of {detail.evidence.total} met
                  </Chip>
                }
              />
              <ul className="border-t border-hairline">
                {detail.hardRequirements.map((row) => (
                  <EvidenceRow key={row.id} row={row} />
                ))}
              </ul>
            </Card>
          )}

          {detail.preferredRequirements.length > 0 && (
            <Card className="mt-4 overflow-hidden">
              <SectionHead
                glyph="px-onefix"
                glyphSize={26}
                title="Preferred, and what you are missing"
                detail="Preferred items never block an application"
                className="px-4 pt-4 pb-2"
                action={<Chip tone="stone">2 of 3 met</Chip>}
              />
              <ul className="border-t border-hairline">
                {detail.preferredRequirements.map((row) => (
                  <EvidenceRow key={row.id} row={row} preferred />
                ))}
              </ul>
            </Card>
          )}

          {/* 12C — the also-unmet list, separated by consequence. */}
          {detail.alsoUnmet && (
            <Card className="mt-4 p-4">
              <Eyebrow>Also unmet</Eyebrow>
              <ul className="mt-2.5 flex flex-col">
                {detail.alsoUnmet.map((row, i) => (
                  <li key={row.label}>
                    {i > 0 && <Hairline />}
                    <div className="flex items-center gap-2.5 py-2.5">
                      <PixelIcon name={row.met ? "g-req-met" : "g-req-missing"} size={18} />
                      <span className="flex-1 text-[14px] font-semibold text-ink">{row.label}</span>
                      <Chip tone={row.met ? "sage" : "stone"}>{row.note}</Chip>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="mt-4 p-4">
            <SectionHead
              glyph="px-skip"
              glyphSize={26}
              title="Eligibility"
              action={
                <Chip tone={detail.eligibilitySummary === "No blockers" ? "sage" : "terracotta"}>
                  {detail.eligibilitySummary}
                </Chip>
              }
            />
            <ul className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {detail.eligibility.map((row) => (
                <li key={row.label} className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className={`mt-[7px] h-[7px] w-[7px] shrink-0 rounded-full ${
                      row.state === "clear"
                        ? "bg-sage"
                        : row.state === "attention"
                          ? "bg-apricot"
                          : "bg-terracotta"
                    }`}
                  />
                  <span className="min-w-0 text-[13.5px] leading-snug">
                    <span className="block font-semibold text-ink">{row.label}</span>
                    <span className="block text-ink-body">{row.value}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Provenance is a rail, not a footnote. */}
        <aside className="flex min-w-0 flex-col gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <span aria-hidden className="h-[7px] w-[7px] rounded-full bg-sage" />
              <Eyebrow tone="sage">Listing is live</Eyebrow>
            </div>
            <dl className="mt-2.5 flex flex-col">
              {[
                { label: "Source", value: detail.provenance.label },
                { label: "First seen", value: closingDate(detail.provenance.firstSeenAt) },
                { label: "Last verified", value: `${ago(detail.provenance.verifiedAt)}` },
                { label: "Posting age", value: `${detail.postedDaysAgo} days` },
                ...(detail.provenance.closesAt
                  ? [{ label: "Deadline", value: closingDate(detail.provenance.closesAt) }]
                  : []),
              ].map((row, i) => (
                <div key={row.label}>
                  {i > 0 && <Hairline />}
                  <div className="flex items-baseline justify-between gap-3 py-2">
                    <dt className="text-[13px] text-ink-body">{row.label}</dt>
                    <dd className="tnum font-mono text-[12.5px] text-ink uppercase">{row.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            {detail.provenance.dedupeNote && (
              <p className="mt-2 border-t border-hairline pt-2.5 text-[12.5px] leading-snug text-ink-muted">
                {detail.provenance.dedupeNote}
              </p>
            )}
            <FreshnessStamp
              iso={detail.provenance.verifiedAt}
              delisted={detail.provenance.delisted}
              className="mt-2 block"
            />
          </Card>

          {detail.evidenceUsed.length > 0 && detail.verdict !== "skip" && (
            <Card className="p-4">
              <Eyebrow>Evidence used here</Eyebrow>
              <ul className="mt-2.5 flex flex-col gap-2">
                {detail.evidenceUsed.map((row) => (
                  <li key={row.label} className="flex items-center gap-2.5">
                    <PixelIcon name={row.icon} size={20} />
                    <span className="flex-1 text-[13.5px] font-semibold text-ink">{row.label}</span>
                    <Mono>{row.detail}</Mono>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12.5px] leading-snug text-ink-muted">
                Every ✓ above links to the row it came from. Nothing is inferred.
              </p>
            </Card>
          )}

          {detail.optionalGain && (
            <Card tint="apricot" className="p-4">
              <h3 className="font-display text-[17px] font-bold text-apricot-text">
                {detail.optionalGain.label}
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-body">
                {detail.optionalGain.note}
              </p>
              <ButtonLink
                href={`/one-fix/${detail.optionalGain.fixId}`}
                tone="apricot"
                full
                className="mt-3"
              >
                See the One Fix <Arrow />
              </ButtonLink>
            </Card>
          )}

          {detail.verdict === "one-fix-away" && delta.data && (
            <OpportunityDelta
              delta={delta.data}
              nowLabel="now"
              afterLabel={`after ${detail.blocker?.label.replace("Add ", "") ?? "the fix"}`}
            />
          )}

          {detail.whyNotSkip && (
            <Card className="p-4">
              <h3 className="font-display text-[17px] font-bold text-ink">
                Why this is not a Skip
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-body">
                {detail.whyNotSkip}
              </p>
            </Card>
          )}

          <AssistantEntry className="w-full justify-center" />
        </aside>
      </div>

      {/* Mobile: a sticky action bar carrying Save, a secondary, and the verdict-coloured primary. */}
      {isMobile && (
        <div className="fixed inset-x-0 bottom-[58px] z-20 flex gap-2 border-t border-line bg-surface px-4 py-3 shadow-tier3">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => save.mutate()}
            className="min-w-[92px]"
          >
            {detail.saved ? "Saved" : "Save"}
          </Button>
          {detail.verdict === "apply-now" && (
            <a
              href={detail.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-[10px] bg-sage px-4 text-[15px] font-semibold text-surface"
            >
              Apply on company site <Arrow />
            </a>
          )}
          {detail.verdict === "one-fix-away" && (
            <ButtonLink
              href={`/one-fix/${detail.blocker?.fixId ?? "sql"}`}
              tone="apricot"
              size="lg"
              className="flex-1"
            >
              See the One Fix <Arrow />
            </ButtonLink>
          )}
          {detail.verdict === "skip" && (
            <ButtonLink href="/discover?verdict=apply-now" size="lg" className="flex-1">
              Show the {similar.data?.length ?? 6} <Arrow />
            </ButtonLink>
          )}
        </div>
      )}
    </article>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto grid w-full max-w-[1440px] md:grid-cols-[minmax(0,40%)_minmax(0,60%)]">
      <div className="hidden px-6 py-6 md:block">
        <Skeleton className="h-[26px] w-[200px]" />
        <SkeletonRows rows={5} height={62} className="mt-4" />
      </div>
      <div className="bg-surface px-5 py-6 md:px-8">
        <Skeleton className="h-[38px] w-[62%]" />
        <Skeleton className="mt-3 h-[18px] w-[46%]" />
        <Skeleton className="mt-5 h-[120px]" />
        <SkeletonRows rows={4} height={66} className="mt-5" />
      </div>
    </div>
  );
}
