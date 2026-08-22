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
import { Chip, Mono } from "@/components/ui/Chip";
import { Tabs, Textarea } from "@/components/ui/Controls";
import { Sheet, SheetGrip } from "@/components/ui/Overlay";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { Card, Eyebrow, Hairline, SectionHead } from "@/components/ui/Surface";
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
import { qk } from "@/lib/api/keys";
import { ApiError } from "@/lib/api/client";
import type { ResumeDocument, ResumeSection, SuggestedEdit } from "@/lib/api/types";
import { useIsMobile, usePersistentState } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";
import { VERDICT_SHORT, VERDICT_TONE } from "@/lib/utils/verdict";

type Pane = "analysis" | "edits" | "keywords";
type MobileTab = "analysis" | "edits" | "preview";

/**
 * An evidence-constrained workspace. Two meters that never merge, every suggested change as
 * before / after / why / evidence with accept and reject, and anything the sources cannot
 * support visibly blocked rather than quietly written.
 */
export default function ResumePage() {
  const client = useQueryClient();
  const isMobile = useIsMobile();

  const [jobId, setJobId] = usePersistentState<string | null>("resume:jobId", "bkash-da");
  const [pane, setPane] = useState<Pane>("analysis");
  const [mobileTab, setMobileTab] = useState<MobileTab>("analysis");
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
      // The only path to that sentence is proving it first.
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

  useSetStatusLine(current ? `Saved ${current.label}` : null);
  useAssistantSubject({
    scope: "resume-bullet",
    id: selectedSection,
    label: "Ask about this bullet",
    subject: `This bullet · ${selectedSection}`,
  });

  if (doc.isLoading || !doc.data || !analysis.data) return <ResumeSkeleton />;

  const data = analysis.data;
  const pendingEdits = data.edits.filter((e) => e.state === "pending");
  const acceptedIds = new Set(
    data.edits.filter((e) => e.state === "accepted").map((e) => e.id),
  );
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

  const analysisPane = (
    <div className="flex flex-col gap-5">
      <MeterPair
        ats={data.atsReadiness}
        jd={data.jdMatch}
        jobLabel={data.jobLabel}
        onPickJob={() => setJdSheet(true)}
      />

      {!data.jdMatch && (
        <>
          <Card className="p-4">
            <Eyebrow>Pick a job to measure against</Eyebrow>
            <ul className="mt-2.5 flex flex-col">
              {(jobs.data?.jobs ?? [])
                .filter((job) => job.verdict !== "skip")
                .slice(0, 3)
                .map((job, i) => (
                  <li key={job.id}>
                    {i > 0 && <Hairline />}
                    <div className="flex items-center gap-3 py-2.5">
                      <Chip tone={job.verdict === "apply-now" ? "sage" : "apricot"}>
                        {VERDICT_SHORT[job.verdict]}
                      </Chip>
                      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">
                        {job.role} · {job.company}
                      </span>
                      <Button size="sm" variant="secondary" onClick={() => setJobId(job.id)}>
                        Use
                      </Button>
                    </div>
                  </li>
                ))}
            </ul>
            <button
              type="button"
              onClick={() => setJdSheet(true)}
              className="mt-2 min-h-[44px] text-[13.5px] font-semibold text-violet-text hover:underline"
            >
              Or paste a job description →
            </button>
          </Card>

          <Card className="p-4">
            <Eyebrow>Available without a job</Eyebrow>
            <ul className="mt-2.5 flex flex-col gap-2">
              {data.withoutJob.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setPane("edits")}
                    className="flex min-h-[44px] w-full items-center gap-2.5 rounded-[10px] border border-line px-3 text-left hover:bg-row-hover"
                  >
                    <PixelIcon name={item.icon} size={20} />
                    <span className="flex-1 text-[14px] font-semibold text-ink">{item.label}</span>
                    <Mono>{item.detail}</Mono>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {data.jdMatch && (
        <Card className="p-4">
          <p className="text-[13.5px] leading-relaxed text-ink-body">
            {data.edits.length} suggested edits ·{" "}
            {data.edits.filter((e) => e.state === "blocked").length} blocked for lack of evidence
          </p>
          <Button className="mt-3" onClick={() => setPane("edits")} full>
            Review suggested edits <Arrow />
          </Button>
        </Card>
      )}
    </div>
  );

  const editsPane = (
    <div className="flex flex-col gap-3">
      {blockedNotice && (
        <p role="alert" className="rounded-[10px] border-2 border-terracotta-line bg-terracotta-tint px-3 py-2 text-[13px] text-terracotta-text">
          {blockedNotice}
        </p>
      )}
      {data.edits.length === 0 && (
        <p className="text-[14px] text-ink-body">
          No suggested edits for this document yet. Choose a job description to generate them.
        </p>
      )}
      {data.edits.map((edit, i) => (
        <DiffCard
          key={edit.id}
          edit={edit}
          index={i + 1}
          total={data.edits.length}
          pending={decide.isPending}
          onAccept={() => decide.mutate({ id: edit.id, action: "accept" })}
          onReject={() => decide.mutate({ id: edit.id, action: "reject" })}
        />
      ))}
    </div>
  );

  const keywordsPane = data.jdMatch ? (
    <KeywordGroups
      keywords={data.keywords}
      present={data.keywordsPresent}
      total={data.keywordsTotal}
    />
  ) : (
    <p className="text-[14px] leading-relaxed text-ink-body">
      Keyword coverage, hard-requirement checks and suggested edits are all relative to one
      posting — so they stay off until you choose one.
    </p>
  );

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-28 sm:px-8 md:px-10 md:pb-12 xl:px-16">
      <header className="flex flex-col gap-3 pt-5 sm:pt-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <PixelIcon name="px-cv" size={28} height={32} />
          <h1 className="font-display text-[26px] leading-tight font-extrabold text-ink sm:text-[30px]">
            Resume Builder
          </h1>
          <Mono>{current?.label}</Mono>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <VersionMenu versions={versions.data ?? []} />
            <Button
              variant="secondary"
              onClick={() => save.mutate()}
              disabled={save.isPending || acceptedIds.size === 0}
              reason="Accept an edit first — nothing is written until you do"
            >
              {save.isPending ? "Saving…" : "Save version"}
            </Button>
            <div className="hidden sm:block">
              <AssistantEntry />
            </div>
          </div>
        </div>

        {/* JD Match names its posting. ATS Readiness never does. */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Eyebrow>Target job</Eyebrow>
          {data.jobLabel ? (
            <>
              <Chip tone="violet">{data.jobLabel}</Chip>
              <Mono>{data.jdParsedNote}</Mono>
              {jobId && (
                <Link
                  href={`/jobs/${jobId}`}
                  className="text-[13px] font-semibold text-violet-text hover:underline"
                >
                  Open job detail ↗
                </Link>
              )}
              <Button variant="tertiary" onClick={() => setJobId(null)}>
                Clear
              </Button>
            </>
          ) : (
            <>
              <Chip tone="stone">No job selected</Chip>
              <Button variant="tertiary" onClick={() => setJdSheet(true)}>
                Paste a JD instead
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Desktop: three panes — editor, analysis, ivory preview. */}
      {!isMobile && (
      <div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)_minmax(0,380px)] xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)_minmax(0,440px)]">
        <section className="min-w-0">
          <SectionHead glyph="g-reorder" glyphSize={24} title="Editor" detail="Reorder sections · click to edit" />
          <ul className="mt-3 flex flex-col gap-1.5">
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
        </section>

        <section className="min-w-0">
          <Tabs
            ariaLabel="Analysis panes"
            value={pane}
            onChange={setPane}
            items={[
              { value: "analysis", label: "Analysis" },
              { value: "edits", label: "Suggested edits", count: pendingEdits.length },
              { value: "keywords", label: "Keywords" },
            ]}
          />
          <div className="mt-4">
            {pane === "analysis" && analysisPane}
            {pane === "edits" && editsPane}
            {pane === "keywords" && keywordsPane}
          </div>
        </section>

        <section className="hidden min-w-0 lg:block">
          <SectionHead glyph="g-version" glyphSize={24} title="Live preview" detail="A4 · 1 page" />
          <ResumePreview doc={doc.data} sections={sections} edits={data.edits} className="mt-3" />
        </section>
      </div>
      )}

      {/* Mobile: three tabs, never three panes. */}
      {isMobile && (
      <div className="mt-4">
        <Tabs
          ariaLabel="Resume tabs"
          value={mobileTab}
          onChange={setMobileTab}
          items={[
            { value: "analysis", label: "Analysis" },
            { value: "edits", label: "Edits", count: pendingEdits.length },
            { value: "preview", label: "Preview" },
          ]}
        />
        <div className="mt-4">
          {mobileTab === "analysis" && analysisPane}
          {mobileTab === "edits" && editsPane}
          {mobileTab === "preview" && (
            <ResumePreview doc={doc.data} sections={sections} edits={data.edits} />
          )}
        </div>
      </div>
      )}

      {/* One sticky primary per mobile tab. */}
      {isMobile && (
      <div className="fixed inset-x-0 bottom-[58px] z-20 flex items-center gap-3 border-t border-line bg-surface px-4 py-3 shadow-tier3">
        <span className="min-w-0 flex-1 text-[12.5px] leading-snug text-ink-muted">
          {acceptedIds.size > 0
            ? `${acceptedIds.size} pending edit${acceptedIds.size === 1 ? "" : "s"} not yet saved`
            : "Nothing is written until you accept it"}
        </span>
        {mobileTab === "preview" ? (
          <Button
            size="lg"
            onClick={() => save.mutate()}
            disabled={acceptedIds.size === 0 || save.isPending}
            reason="Accept an edit first"
          >
            Save version
          </Button>
        ) : (
          <Button size="lg" onClick={() => setMobileTab(mobileTab === "edits" ? "preview" : "edits")}>
            {mobileTab === "edits" ? "Preview" : "Review edits"} <Arrow />
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
    </div>
  );
}

/* ── Editor ─────────────────────────────────────────────────────────────── */

function orderSections(doc: ResumeDocument, order: string[] | null): ResumeSection[] {
  if (!order) return doc.sections;
  const map = new Map(doc.sections.map((s) => [s.id, s]));
  return order.map((id) => map.get(id)!).filter(Boolean);
}

/**
 * The editor states evidence health per section, so gaps are visible where they are edited.
 * Reordering works by keyboard as well as by the handle.
 */
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
      ? "sage"
      : section.health.tone === "attention"
        ? "apricot"
        : "stone";

  return (
    <li
      className={cn(
        "relative flex items-center gap-2 rounded-[12px] border px-2.5 py-2.5 transition-colors duration-100",
        selected ? "border-control bg-violet-tint" : "border-line bg-surface hover:bg-row-hover",
      )}
    >
      {selected && (
        <span aria-hidden className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-r bg-violet" />
      )}
      <PixelIcon name="g-reorder" size={16} />
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <span className="block text-[14px] font-semibold text-ink">{section.title}</span>
        <span className="block truncate text-[12.5px] text-ink-muted">{section.detail}</span>
      </button>
      <Chip tone={tone}>{section.health.label}</Chip>
      <span className="flex flex-col">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={first}
          aria-label={`Move ${section.title} up`}
          className="flex h-[22px] w-[22px] items-center justify-center rounded text-[11px] text-ink-muted hover:bg-row-hover disabled:text-ink-disabled"
        >
          ▲
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={last}
          aria-label={`Move ${section.title} down`}
          className="flex h-[22px] w-[22px] items-center justify-center rounded text-[11px] text-ink-muted hover:bg-row-hover disabled:text-ink-disabled"
        >
          ▼
        </button>
      </span>
    </li>
  );
}

/* ── Preview ────────────────────────────────────────────────────────────── */

/**
 * The ivory reading surface. Pending accepted edits are marked with a violet rule and the
 * word "pending" — nothing is written to the document until the version is saved.
 */
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
        "min-w-[300px] rounded-[14px] border border-surface-read-border bg-surface-read p-5",
        className,
      )}
    >
      <h2 className="font-display text-[20px] font-bold text-ink">{doc.name}</h2>
      <p className="mt-0.5 text-[12.5px] text-ink-body">{doc.contact}</p>

      {sections
        .filter((section) => section.body && section.body.length > 0)
        .map((section) => (
          <section key={section.id} className="mt-4">
            <h3 className="text-[11.5px] font-bold tracking-[.12em] text-ink-muted uppercase">
              {section.title}
            </h3>
            <div className="mt-1.5 border-t border-surface-read-border pt-2">
              {section.body!.map((block) => (
                <div key={block.id} className="mt-2 first:mt-0">
                  {block.heading && (
                    <p className="flex items-baseline justify-between gap-3">
                      <span className="text-[13.5px] font-semibold text-ink">{block.heading}</span>
                      {block.meta && <Mono>{block.meta}</Mono>}
                    </p>
                  )}
                  <ul className="mt-1 flex flex-col gap-1">
                    {block.lines.map((line) => {
                      const after = replacement.get(line.text);
                      return (
                        <li
                          key={line.id}
                          className={cn(
                            "text-[13px] leading-relaxed text-ink-body",
                            after && "border-l-[3px] border-violet pl-2.5",
                          )}
                        >
                          {after ?? line.text}
                          {after && (
                            <span className="ml-1.5 rounded bg-violet-tint px-1.5 py-0.5 text-[11px] font-semibold text-violet-text">
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

      <p className="mt-5 border-t border-surface-read-border pt-3 text-[12px] leading-snug text-ink-muted">
        Violet marks show pending accepted edits. Nothing is written to your file until you save
        a version.
      </p>
    </div>
  );
}

/* ── Versions & JD ──────────────────────────────────────────────────────── */

function VersionMenu({ versions }: { versions: { id: string; label: string; isCurrent: boolean }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="secondary" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        Versions ({versions.length}) ▾
      </Button>
      {open && (
        <div className="absolute top-[50px] right-0 z-30 w-[240px] rounded-[12px] border border-group bg-surface p-2 shadow-tier3">
          <ul>
            {versions.map((version) => (
              <li key={version.id}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-2.5 text-left text-[13.5px] hover:bg-row-hover"
                >
                  <span className="flex-1 font-semibold text-ink">{version.label}</span>
                  {version.isCurrent && <Chip tone="violet">Current</Chip>}
                </button>
              </li>
            ))}
          </ul>
          <p className="border-t border-hairline px-2.5 pt-2 text-[12px] leading-snug text-ink-muted">
            One version per target role. Accepting edits creates a new version, never overwrites.
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
  jobs: { id: string; role: string; company: string; verdict: keyof typeof VERDICT_TONE }[];
  onPick: (id: string) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} label="Choose a job description" height="min(660px, 90%)">
      <SheetGrip />
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-5">
        <h2 className="font-display text-[22px] font-bold text-ink">
          Measure against one posting
        </h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-body">
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
                  className="flex min-h-[48px] w-full items-center gap-3 text-left"
                >
                  <Chip tone={job.verdict === "apply-now" ? "sage" : "apricot"}>
                    {VERDICT_SHORT[job.verdict]}
                  </Chip>
                  <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink">
                    {job.role} · {job.company}
                  </span>
                  <span className="text-[13px] font-semibold text-violet-text">Use</span>
                </button>
              </li>
            ))}
        </ul>

        <div className="mt-4 border-t border-hairline pt-4">
          <Eyebrow>Or paste a job description</Eyebrow>
          <Textarea
            value={text}
            onChange={(event) => onText(event.target.value)}
            rows={5}
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
          <p className="mt-2 text-[12.5px] text-ink-muted">
            Pasted JDs produce a JD Match only — ATS Readiness is unaffected.
          </p>
        </div>
      </div>
    </Sheet>
  );
}

function ResumeSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pt-8 sm:px-8 md:px-10 xl:px-16">
      <Skeleton className="h-[30px] w-[260px]" />
      <Skeleton className="mt-3 h-[18px] w-[340px]" />
      <div className="mt-6 grid gap-5 lg:grid-cols-[320px_1fr_380px]">
        <SkeletonRows rows={6} height={54} />
        <div>
          <Skeleton className="h-[44px] w-full" />
          <Skeleton className="mt-4 h-[210px]" />
        </div>
        <Skeleton className="h-[420px]" />
      </div>
    </div>
  );
}
