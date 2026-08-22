"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useAssistantSubject } from "@/components/assistant/AssistantProvider";
import { AssistantEntry } from "@/components/assistant/AssistantSurface";
import { DiffCard } from "@/components/resume/DiffCard";
import { KeywordGroups, MeterPair } from "@/components/resume/MeterPair";
import { useSetStatusLine } from "@/components/shell/AppShell";
import { Arrow, Button } from "@/components/ui/Button";
import { Meta, Mono } from "@/components/ui/Chip";
import { Tabs, Textarea } from "@/components/ui/Controls";
import { Disclosure } from "@/components/ui/Disclosure";
import { Sheet, SheetGrip } from "@/components/ui/Overlay";
import { Hairline, Page } from "@/components/ui/Surface";
import { Skeleton, SkeletonRows } from "@/components/ui/States";
import {
  acceptEdit,
  analyseJdText,
  getResume,
  getResumeAnalysis,
  listJobs,
  listResumeVersions,
  rejectEdit,
  reorderResumeSections,
  saveResumeVersion,
} from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { qk } from "@/lib/api/keys";
import type { ResumeDocument, ResumeSection, SuggestedEdit } from "@/lib/api/types";
import { useIsMobile, usePersistentState } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";
import { VERDICT_SHORT } from "@/lib/utils/verdict";

type Pane = "preview" | "sections" | "edits";

/**
 * One workspace: the document is the work, and the analysis supports it from the
 * side. Sections, preview and the edit queue share a single work area rather than
 * competing as three dashboards.
 */
export default function ResumePage() {
  const client = useQueryClient();
  const isMobile = useIsMobile();

  const [jobId, setJobId] = usePersistentState<string | null>("resume:jobId", "bkash-da");
  const [pane, setPane] = useState<Pane>("preview");
  const [selectedSection, setSelectedSection] = useState("experience");
  const [jdSheet, setJdSheet] = useState(false);
  const [jdText, setJdText] = useState("");
  const [blockedNotice, setBlockedNotice] = useState<string | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);

  const versions = useQuery({ queryKey: qk.resumeVersions, queryFn: listResumeVersions });
  const current = versions.data?.find((v) => v.isCurrent);
  const versionId = current?.id ?? "v4";

  const doc = useQuery({ queryKey: qk.resume(versionId), queryFn: () => getResume(versionId) });
  const analysis = useQuery({
    queryKey: qk.resumeAnalysis(versionId, jobId),
    queryFn: () => getResumeAnalysis(versionId, jobId),
  });
  const jobs = useQuery({ queryKey: qk.jobs({ sort: "best-fit" }), queryFn: () => listJobs({}) });

  const decide = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "accept" | "reject" }) =>
      action === "accept" ? acceptEdit(id) : rejectEdit(id),
    onSuccess: () => {
      setBlockedNotice(null);
      void client.invalidateQueries({ queryKey: ["resume", "analysis"] });
    },
    onError: (error) => {
      setBlockedNotice(error instanceof ApiError ? error.message : "That edit cannot be accepted.");
    },
  });

  const save = useMutation({
    mutationFn: () => saveResumeVersion(versionId),
    onSuccess: () => void client.invalidateQueries({ queryKey: qk.resumeVersions }),
  });

  const reorder = useMutation({
    mutationFn: (next: string[]) => reorderResumeSections(versionId, next),
  });

  const analyseJd = useMutation({
    mutationFn: () => analyseJdText(versionId, jdText),
    onSuccess: () => {
      setJdSheet(false);
      setJobId("bkash-da");
    },
  });

  useSetStatusLine(current ? `Saved · ${current.label}` : null);
  useAssistantSubject({
    scope: "resume-bullet",
    id: selectedSection,
    label: "Ask about this bullet",
    subject: `This bullet · ${selectedSection}`,
  });

  if (doc.isLoading || !doc.data || !analysis.data) return <ResumeSkeleton />;

  const data = analysis.data;
  const pendingEdits = data.edits.filter((e) => e.state === "pending");
  const acceptedCount = data.edits.filter((e) => e.state === "accepted").length;
  const blockedCount = data.edits.filter((e) => e.state === "blocked").length;
  const sections = orderSections(doc.data, order);

  const moveSection = (id: string, delta: number) => {
    const ids = sections.map((s) => s.id);
    const from = ids.indexOf(id);
    const to = Math.min(ids.length - 1, Math.max(0, from + delta));
    if (from === to) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    setOrder(ids);
    reorder.mutate(ids);
  };

  return (
    <Page className="pt-6 pb-24 sm:pt-8 sm:pb-16">
      <header className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h1 className="text-title text-ink">Resume</h1>
        <Mono>{current?.label}</Mono>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <VersionMenu versions={versions.data ?? []} />
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending || acceptedCount === 0}
            reason="Accept an edit first — nothing is written until you do"
          >
            {save.isPending ? "Saving…" : "Save version"}
          </Button>
          <div className="hidden lg:block">
            <AssistantEntry />
          </div>
        </div>
      </header>

      {/* The one thing JD Match depends on, stated plainly. */}
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <Meta>Measuring against</Meta>
        {data.jobLabel ? (
          <>
            <span className="text-body text-ink">{data.jobLabel}</span>
            {jobId && (
              <Link
                href={`/jobs/${jobId}`}
                className="inline-flex min-h-[36px] items-center text-sm font-medium text-brand-text hover:underline"
              >
                Open
              </Link>
            )}
            <Button variant="link" onClick={() => setJobId(null)}>
              Clear
            </Button>
          </>
        ) : (
          <>
            <span className="text-body text-ink-muted">No job selected</span>
            <Button variant="link" onClick={() => setJdSheet(true)}>
              Choose one
            </Button>
          </>
        )}
      </p>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-12">
        {/* The work area. One pane at a time. */}
        <div className="min-w-0">
          <Tabs
            ariaLabel="Resume workspace"
            value={pane}
            onChange={setPane}
            items={[
              { value: "preview", label: "Preview" },
              { value: "sections", label: "Sections" },
              { value: "edits", label: "Suggested edits", count: pendingEdits.length },
            ]}
          />

          <div className="mt-5">
            {pane === "preview" && (
              <ResumePreview doc={doc.data} sections={sections} edits={data.edits} />
            )}

            {pane === "sections" && (
              <ul>
                {sections.map((section, i) => (
                  <EditorRow
                    key={section.id}
                    section={section}
                    selected={section.id === selectedSection}
                    first={i === 0}
                    last={i === sections.length - 1}
                    onSelect={() => setSelectedSection(section.id)}
                    onMove={(delta) => moveSection(section.id, delta)}
                  />
                ))}
              </ul>
            )}

            {pane === "edits" && (
              <div>
                {blockedNotice && (
                  <p
                    role="alert"
                    className="mb-4 rounded-lg border border-terracotta-line bg-terracotta-tint px-3 py-2 text-sm text-terracotta-text"
                  >
                    {blockedNotice}
                  </p>
                )}
                {data.edits.length === 0 ? (
                  <p className="text-body text-ink-body">
                    No suggested edits yet. Choose a job description to generate them.
                  </p>
                ) : (
                  data.edits.map((edit, i) => (
                    <DiffCard
                      key={edit.id}
                      edit={edit}
                      index={i + 1}
                      total={data.edits.length}
                      pending={decide.isPending}
                      onAccept={() => decide.mutate({ id: edit.id, action: "accept" })}
                      onReject={() => decide.mutate({ id: edit.id, action: "reject" })}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* The analysis rail. Two readings, then detail on demand. */}
        <aside className="min-w-0">
          <div className="lg:sticky lg:top-24">
            <MeterPair
              ats={data.atsReadiness}
              jd={data.jdMatch}
              jobLabel={data.jobLabel}
              onPickJob={() => setJdSheet(true)}
            />

            {data.edits.length > 0 && (
              <div className="mt-5">
                <p className="text-sm text-ink-body">
                  {pendingEdits.length} suggested edit{pendingEdits.length === 1 ? "" : "s"} to
                  review
                  {blockedCount > 0 && `, ${blockedCount} blocked for lack of evidence`}.
                </p>
                <Button className="mt-3" full onClick={() => setPane("edits")}>
                  Review edits
                  <Arrow />
                </Button>
              </div>
            )}

            {data.jdMatch && (
              <div className="mt-6">
                <Disclosure
                  label="Keyword coverage"
                  detail={`${data.keywordsPresent} of ${data.keywordsTotal}`}
                >
                  <KeywordGroups
                    keywords={data.keywords}
                    present={data.keywordsPresent}
                    total={data.keywordsTotal}
                    className="pt-1"
                  />
                </Disclosure>
              </div>
            )}

            {!data.jdMatch && data.withoutJob.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-ink">Available without a job</h3>
                <ul className="mt-2">
                  {data.withoutJob.map((item) => (
                    <li key={item.id} className="border-b border-hairline last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setPane("edits")}
                        className="flex min-h-[44px] w-full items-baseline justify-between gap-3 text-left"
                      >
                        <span className="text-sm text-ink">{item.label}</span>
                        <Mono>{item.detail}</Mono>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>

      {isMobile && (
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-20 flex items-center gap-3 border-t border-line bg-surface px-4 py-3">
          <span className="min-w-0 flex-1 text-sm text-ink-muted">
            {acceptedCount > 0
              ? `${acceptedCount} pending edit${acceptedCount === 1 ? "" : "s"}`
              : "Nothing is written until you accept it"}
          </span>
          {pane === "edits" ? (
            <Button
              size="lg"
              onClick={() => save.mutate()}
              disabled={acceptedCount === 0 || save.isPending}
              reason="Accept an edit first"
            >
              Save version
            </Button>
          ) : (
            <Button size="lg" onClick={() => setPane("edits")}>
              Review edits
            </Button>
          )}
        </div>
      )}

      <JdSheet
        open={jdSheet}
        onClose={() => setJdSheet(false)}
        text={jdText}
        onText={setJdText}
        onAnalyse={() => analyseJd.mutate()}
        pending={analyseJd.isPending}
        jobs={jobs.data?.jobs ?? []}
        onPick={(id) => {
          setJobId(id);
          setJdSheet(false);
        }}
      />
    </Page>
  );
}

/* ── Sections ───────────────────────────────────────────────────────────── */

function orderSections(doc: ResumeDocument, order: string[] | null): ResumeSection[] {
  if (!order) return doc.sections;
  const map = new Map(doc.sections.map((s) => [s.id, s]));
  return order.map((id) => map.get(id)!).filter(Boolean);
}

/** Evidence health is stated where the section is edited, so gaps are visible there. */
function EditorRow({
  section,
  selected,
  first,
  last,
  onSelect,
  onMove,
}: {
  section: ResumeSection;
  selected: boolean;
  first: boolean;
  last: boolean;
  onSelect: () => void;
  onMove: (delta: number) => void;
}) {
  const tone =
    section.health.tone === "ok"
      ? "text-sage-text"
      : section.health.tone === "attention"
        ? "text-apricot-text"
        : "text-ink-muted";

  return (
    <li
      className={cn(
        "flex items-center gap-3 border-b border-hairline py-2.5 last:border-b-0",
        selected && "bg-surface-sunken",
      )}
    >
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 py-1 text-left">
        <span className="block text-body text-ink">{section.title}</span>
        <span className="mt-0.5 block">
          <Meta>{section.detail}</Meta>
        </span>
      </button>
      <span className={cn("shrink-0 text-sm", tone)}>{section.health.label}</span>
      <span className="flex shrink-0 items-center">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={first}
          aria-label={`Move ${section.title} up`}
          className="flex h-[44px] w-[30px] items-center justify-center rounded text-meta text-ink-muted hover:bg-surface-sunken disabled:text-ink-disabled"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={last}
          aria-label={`Move ${section.title} down`}
          className="flex h-[44px] w-[30px] items-center justify-center rounded text-meta text-ink-muted hover:bg-surface-sunken disabled:text-ink-disabled"
        >
          ↓
        </button>
      </span>
    </li>
  );
}

/* ── Preview ────────────────────────────────────────────────────────────── */

/** The ivory reading surface. Pending edits are marked; nothing is written until saved. */
function ResumePreview({
  doc,
  sections,
  edits,
  className,
}: {
  doc: ResumeDocument;
  sections: ResumeSection[];
  edits: SuggestedEdit[];
  className?: string;
}) {
  const accepted = edits.filter((e) => e.state === "accepted");
  const replacement = new Map(accepted.map((e) => [e.before, e.after]));

  return (
    <div
      className={cn(
        "min-w-[300px] rounded-xl border border-surface-read-border bg-surface-read px-7 py-8 sm:px-9 sm:py-10",
        className,
      )}
    >
      <h2 className="text-section text-ink">{doc.name}</h2>
      <p className="mt-0.5 text-sm text-ink-muted">{doc.contact}</p>

      {sections
        .filter((section) => section.body && section.body.length > 0)
        .map((section) => (
          <section key={section.id} className="mt-7">
            <h3 className="text-meta font-semibold tracking-[0.06em] text-ink-muted uppercase">
              {section.title}
            </h3>
            <div className="mt-2 border-t border-surface-read-border pt-3">
              {section.body!.map((block) => (
                <div key={block.id} className="mt-3 first:mt-0">
                  {block.heading && (
                    <p className="flex items-baseline justify-between gap-3">
                      <span className="text-body font-medium text-ink">{block.heading}</span>
                      {block.meta && <Mono>{block.meta}</Mono>}
                    </p>
                  )}
                  <ul className="mt-1 space-y-1">
                    {block.lines.map((line) => {
                      const after = replacement.get(line.text);
                      return (
                        <li
                          key={line.id}
                          className={cn(
                            "text-sm leading-relaxed text-ink-body",
                            after && "border-l-2 border-brand pl-3",
                          )}
                        >
                          {after ?? line.text}
                          {after && (
                            <span className="ml-2 text-meta font-medium text-brand-text">
                              pending
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}

      <p className="mt-8 border-t border-surface-read-border pt-4 text-sm text-ink-muted">
        Violet marks show pending accepted edits. Nothing is written to your file until you save a
        version.
      </p>
    </div>
  );
}

/* ── Versions & JD ──────────────────────────────────────────────────────── */

function VersionMenu({
  versions,
}: {
  versions: { id: string; label: string; isCurrent: boolean }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="secondary" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        Versions ({versions.length})
      </Button>
      {open && (
        <div className="absolute top-[46px] right-0 z-30 w-[248px] rounded-xl border border-line bg-surface p-2 shadow-tier3">
          <ul>
            {versions.map((version) => (
              <li key={version.id}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm hover:bg-surface-sunken"
                >
                  <span className="flex-1 text-ink">{version.label}</span>
                  {version.isCurrent && <Meta>current</Meta>}
                </button>
              </li>
            ))}
          </ul>
          <p className="border-t border-hairline px-2.5 pt-2 text-sm text-ink-muted">
            Accepting edits creates a new version, never overwrites.
          </p>
        </div>
      )}
    </div>
  );
}

function JdSheet({
  open,
  onClose,
  text,
  onText,
  onAnalyse,
  pending,
  jobs,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  text: string;
  onText: (value: string) => void;
  onAnalyse: () => void;
  pending: boolean;
  jobs: {
    id: string;
    role: string;
    company: string;
    verdict: "apply-now" | "one-fix-away" | "skip";
  }[];
  onPick: (id: string) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} label="Choose a job description" height="min(620px, 90%)">
      <SheetGrip />
      <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
        <h2 className="text-section text-ink">Measure against one posting</h2>
        <p className="mt-1 text-body text-ink-body">
          JD Match is a property of one job. ATS Readiness is unaffected by this choice.
        </p>

        <ul className="mt-4 max-h-[220px] overflow-y-auto">
          {jobs
            .filter((job) => job.verdict !== "skip")
            .slice(0, 6)
            .map((job, i) => (
              <li key={job.id}>
                {i > 0 && <Hairline />}
                <button
                  type="button"
                  onClick={() => onPick(job.id)}
                  className="flex min-h-[48px] w-full items-baseline gap-3 text-left"
                >
                  <span className="min-w-0 flex-1 truncate text-body text-ink">
                    {job.role} · {job.company}
                  </span>
                  <Meta>{VERDICT_SHORT[job.verdict]}</Meta>
                </button>
              </li>
            ))}
        </ul>

        <div className="mt-4 border-t border-line pt-4">
          <h3 className="text-sm font-medium text-ink">Or paste a job description</h3>
          <Textarea
            value={text}
            onChange={(event) => onText(event.target.value)}
            rows={4}
            placeholder="We are looking for a Data Analyst with strong SQL, including window functions…"
            aria-label="Paste a job description"
            className="mt-2"
          />
          <div className="mt-2 flex items-center gap-3">
            <Mono>{text.length.toLocaleString()} chars</Mono>
            <Button
              className="ml-auto"
              onClick={onAnalyse}
              disabled={text.trim().length < 40 || pending}
              reason="Paste at least a paragraph of the posting first"
            >
              {pending ? "Analysing…" : "Analyse this JD"}
            </Button>
          </div>
          <p className="mt-2 text-sm text-ink-muted">
            A pasted JD produces a JD Match only — ATS Readiness is unaffected.
          </p>
        </div>
      </div>
    </Sheet>
  );
}

function ResumeSkeleton() {
  return (
    <Page className="pt-8">
      <Skeleton className="h-[30px] w-[160px]" />
      <Skeleton className="mt-3 h-[16px] w-[300px]" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <Skeleton className="h-[40px] w-[320px]" />
          <Skeleton className="mt-5 h-[460px]" />
        </div>
        <SkeletonRows rows={3} height={90} />
      </div>
    </Page>
  );
}
