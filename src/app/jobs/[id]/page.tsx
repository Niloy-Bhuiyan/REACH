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
import { Meta, Mono } from "@/components/ui/Chip";
import { Disclosure } from "@/components/ui/Disclosure";
import { Hairline, Page, Stack } from "@/components/ui/Surface";
import { Skeleton, SkeletonRows } from "@/components/ui/States";
import { VerdictBadge } from "@/components/verdict/VerdictBadge";
import { getDelta, getJob, getLatestRun, getSimilarJobs, hideJob, listJobs, saveJob } from "@/lib/api";
import { qk } from "@/lib/api/keys";
import { useIsMobile } from "@/lib/hooks";
import { ago, closingDate, daysUntil } from "@/lib/utils/time";

/**
 * One anatomy, three verdict skins, read top to bottom: role → verdict → why →
 * evidence → what to do. Provenance and eligibility are true but secondary, so
 * they sit behind a disclosure rather than competing with the decision.
 *
 * The run is never lost: it lives in the query cache, not in Discovery's state.
 */
export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isMobile = useIsMobile();
  const client = useQueryClient();
  const router = useRouter();

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

  const delta = useQuery({
    queryKey: qk.delta(job.data?.blocker?.fixId ?? "sql"),
    queryFn: () => getDelta(job.data?.blocker?.fixId ?? "sql"),
    enabled: job.data?.verdict === "one-fix-away",
  });

  const similar = useQuery({
    queryKey: qk.similar(id),
    queryFn: () => getSimilarJobs(id),
    enabled: job.data?.verdict === "skip",
  });

  const save = useMutation({
    mutationFn: () => saveJob(id, !job.data!.saved),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: qk.job(id) });
      void client.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const hide = useMutation({
    mutationFn: () => hideJob(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["jobs"] });
      router.push("/discover?verdict=skip");
    },
  });

  if (job.isLoading || !job.data) return <DetailSkeleton />;
  const detail = job.data;
  const days = detail.provenance.closesAt ? daysUntil(detail.provenance.closesAt) : null;

  return (
    <Page className="pt-6 pb-28 sm:pt-8 sm:pb-20">
      {/* Context without carrying the whole list along. */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href="/discover"
          className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-medium text-brand-text hover:underline"
        >
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="size-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 8H3M7 4L3 8l4 4" />
          </svg>
          All results
        </Link>
        {index >= 0 && (
          <span className="ml-auto flex items-center gap-2">
            <Mono>
              {index + 1} of {group.length}
            </Mono>
            <Button
              variant="secondary"
              size="sm"
              disabled={!previous}
              reason="This is the first role in the group"
              onClick={() => previous && router.push(`/jobs/${previous.id}`)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!next}
              reason="This is the last role in the group"
              onClick={() => next && router.push(`/jobs/${next.id}`)}
            >
              Next
            </Button>
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
        <article className="min-w-0">
          <Stack gap="md">
            {/* Role, then verdict. Nothing between them. */}
            <header>
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                <h1 className="text-title text-ink">{detail.role}</h1>
                <VerdictBadge verdict={detail.verdict} size="lg" className="mt-1" />
              </div>
              <p className="mt-1.5">
                <Meta>
                  {detail.companyFull} · {detail.location} · {detail.mode} · {detail.employment}
                </Meta>
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                {detail.salary && <Mono>{detail.salary}</Mono>}
                {detail.experience && <Mono>{detail.experience}</Mono>}
                {days !== null && (
                  <Mono className={days <= 10 ? "text-apricot-text" : undefined}>
                    Closes {closingDate(detail.provenance.closesAt!)} · {days} days
                  </Mono>
                )}
              </p>
            </header>

            {/* The verdict is a sentence. There are no percentages on this screen. */}
            <section>
              <h2 className="max-w-[38ch] text-section leading-snug text-ink">
                {detail.verdict === "skip" ? detail.skipBlocker?.title : detail.verdictHeadline}
              </h2>
              <p className="mt-2.5 max-w-[62ch] text-body text-ink-body">
                {detail.verdict === "skip" ? detail.skipBlocker?.body : detail.verdictBody}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                {detail.verdict === "apply-now" && (
                  <a
                    href={detail.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-[10px] bg-sage px-4 text-body font-medium text-white transition-colors duration-100 hover:bg-sage-hover"
                  >
                    Apply on company site
                    <Arrow />
                  </a>
                )}
                {detail.verdict === "one-fix-away" && (
                  <ButtonLink
                    href={`/one-fix/${detail.blocker?.fixId ?? "sql"}`}
                    tone="apricot"
                    size="lg"
                  >
                    See the One Fix
                    <Arrow />
                  </ButtonLink>
                )}
                {detail.verdict === "skip" && (
                  <ButtonLink href="/discover?verdict=apply-now" size="lg">
                    Show the {similar.data?.length ?? 6} you can apply to
                    <Arrow />
                  </ButtonLink>
                )}

                <Button variant="secondary" size="lg" onClick={() => save.mutate()}>
                  {detail.saved ? "Saved" : "Save"}
                </Button>

                {detail.verdict === "apply-now" && (
                  <ButtonLink href="/resume" variant="ghost" size="lg">
                    Tailor CV
                  </ButtonLink>
                )}
                {detail.verdict === "skip" && (
                  <Button variant="ghost" size="lg" onClick={() => hide.mutate()}>
                    Hide this role
                  </Button>
                )}

                {/* Applying is still your call — present, and demoted to a link. */}
                {detail.verdict !== "apply-now" && (
                  <a
                    href={detail.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[40px] items-center text-sm font-medium text-ink-muted hover:text-ink hover:underline"
                  >
                    Apply anyway ↗
                  </a>
                )}
              </div>
            </section>

            {/* Why — every row carries the evidence it came from. */}
            {detail.hardRequirements.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                  <h2 className="text-section text-ink">Requirements</h2>
                  <span
                    className={`text-sm font-medium ${
                      detail.evidence.met === detail.evidence.total
                        ? "text-sage-text"
                        : "text-apricot-text"
                    }`}
                  >
                    {detail.evidence.met} of {detail.evidence.total} met
                  </span>
                </div>
                <ul>
                  {detail.hardRequirements.map((row) => (
                    <EvidenceRow key={row.id} row={row} />
                  ))}
                </ul>
              </section>
            )}

            {detail.preferredRequirements.length > 0 && (
              <section>
                <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
                  <h2 className="text-section text-ink">Preferred</h2>
                  <Meta>Never blocks an application</Meta>
                </div>
                <ul>
                  {detail.preferredRequirements.map((row) => (
                    <EvidenceRow key={row.id} row={row} preferred />
                  ))}
                </ul>
              </section>
            )}

            {detail.alsoUnmet && (
              <section>
                <h2 className="border-b border-line pb-2 text-section text-ink">Also unmet</h2>
                <ul>
                  {detail.alsoUnmet.map((row, i) => (
                    <li key={row.label}>
                      {i > 0 && <Hairline />}
                      <div className="flex items-baseline justify-between gap-3 py-2.5">
                        <span className="text-body text-ink">{row.label}</span>
                        <span
                          className={`text-sm ${row.met ? "text-sage-text" : "text-ink-muted"}`}
                        >
                          {row.note}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Supporting detail: true, but not what the decision rests on. */}
            <section>
              <Disclosure
                label="Eligibility"
                detail={detail.eligibilitySummary}
                defaultOpen={detail.verdict === "skip"}
              >
                <ul className="grid gap-x-8 gap-y-2 pt-1 sm:grid-cols-2">
                  {detail.eligibility.map((row) => (
                    <li key={row.label} className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-ink-body">{row.label}</span>
                      <span
                        className={`text-sm ${
                          row.state === "blocked"
                            ? "text-terracotta-text"
                            : row.state === "attention"
                              ? "text-apricot-text"
                              : "text-ink"
                        }`}
                      >
                        {row.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </Disclosure>

              <Disclosure label="Where this came from" detail={detail.provenance.label}>
                <dl className="pt-1">
                  {[
                    { label: "Source", value: detail.provenance.label },
                    { label: "First seen", value: closingDate(detail.provenance.firstSeenAt) },
                    { label: "Last verified", value: ago(detail.provenance.verifiedAt) },
                    { label: "Posting age", value: `${detail.postedDaysAgo} days` },
                  ].map((row, i) => (
                    <div key={row.label}>
                      {i > 0 && <Hairline />}
                      <div className="flex items-baseline justify-between gap-3 py-1.5">
                        <dt className="text-sm text-ink-body">{row.label}</dt>
                        <dd className="tnum font-mono text-meta text-ink">{row.value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
                {detail.provenance.dedupeNote && (
                  <p className="mt-2 text-sm text-ink-muted">{detail.provenance.dedupeNote}</p>
                )}
                <FreshnessStamp
                  iso={detail.provenance.verifiedAt}
                  delisted={detail.provenance.delisted}
                  className="mt-2 block"
                />
              </Disclosure>

              {detail.evidenceUsed.length > 0 && detail.verdict !== "skip" && (
                <Disclosure
                  label="Evidence used here"
                  detail={detail.evidenceUsed.map((e) => e.label).join(" · ")}
                >
                  <ul className="pt-1">
                    {detail.evidenceUsed.map((row, i) => (
                      <li key={row.label}>
                        {i > 0 && <Hairline />}
                        <div className="flex items-baseline justify-between gap-3 py-1.5">
                          <span className="text-sm text-ink">{row.label}</span>
                          <Mono>{row.detail}</Mono>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm text-ink-muted">
                    Every tick above links to the row it came from. Nothing is inferred.
                  </p>
                </Disclosure>
              )}
            </section>
          </Stack>
        </article>

        {/* The rail holds only what is distinctive about this verdict. */}
        <aside className="min-w-0">
          <div className="lg:sticky lg:top-24">
            {detail.verdict === "one-fix-away" && delta.data && (
              <OpportunityDelta
                delta={delta.data}
                nowLabel="reachable now"
                afterLabel={`after ${detail.blocker?.label.replace("Add ", "") ?? "the fix"}`}
              />
            )}

            {detail.optionalGain && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-ink">{detail.optionalGain.label}</h3>
                <p className="mt-1.5 text-sm text-ink-body">{detail.optionalGain.note}</p>
                <ButtonLink
                  href={`/one-fix/${detail.optionalGain.fixId}`}
                  variant="link"
                  className="mt-2"
                >
                  See the One Fix
                </ButtonLink>
              </div>
            )}

            {detail.whyNotSkip && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-ink">Why this is not a Skip</h3>
                <p className="mt-1.5 text-sm text-ink-body">{detail.whyNotSkip}</p>
              </div>
            )}

            <div className="mt-8 hidden lg:block">
              <AssistantEntry className="w-full justify-center" />
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile keeps one primary action within thumb reach. */}
      {isMobile && (
        <div className="fixed inset-x-0 bottom-[56px] z-20 flex gap-2 border-t border-line bg-surface px-4 py-3">
          <Button variant="secondary" size="lg" onClick={() => save.mutate()}>
            {detail.saved ? "Saved" : "Save"}
          </Button>
          {detail.verdict === "apply-now" && (
            <a
              href={detail.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[10px] bg-sage px-4 text-body font-medium text-white"
            >
              Apply on company site
            </a>
          )}
          {detail.verdict === "one-fix-away" && (
            <ButtonLink
              href={`/one-fix/${detail.blocker?.fixId ?? "sql"}`}
              tone="apricot"
              size="lg"
              className="flex-1"
            >
              See the One Fix
            </ButtonLink>
          )}
          {detail.verdict === "skip" && (
            <ButtonLink href="/discover?verdict=apply-now" size="lg" className="flex-1">
              Show the {similar.data?.length ?? 6}
            </ButtonLink>
          )}
        </div>
      )}
    </Page>
  );
}

function DetailSkeleton() {
  return (
    <Page className="pt-8">
      <Skeleton className="h-[20px] w-[120px]" />
      <div className="mt-6 grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div>
          <Skeleton className="h-[32px] w-[46%]" />
          <Skeleton className="mt-3 h-[16px] w-[62%]" />
          <Skeleton className="mt-8 h-[24px] w-[70%]" />
          <Skeleton className="mt-3 h-[52px]" />
          <SkeletonRows rows={4} height={58} className="mt-8" />
        </div>
        <Skeleton className="h-[120px]" />
      </div>
    </Page>
  );
}
