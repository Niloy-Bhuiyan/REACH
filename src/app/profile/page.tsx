"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useAssistantSubject } from "@/components/assistant/AssistantProvider";
import { AssistantEntry } from "@/components/assistant/AssistantSurface";
import { useSetStatusLine } from "@/components/shell/AppShell";
import { TargetSheet } from "@/components/shell/TargetPill";
import { Arrow, Button, ButtonLink } from "@/components/ui/Button";
import { Chip, Mono } from "@/components/ui/Chip";
import { Meter } from "@/components/ui/Meter";
import { Sheet, SheetGrip } from "@/components/ui/Overlay";
import { LetterTile, PixelIcon } from "@/components/ui/PixelIcon";
import { Card, Eyebrow, Hairline, SectionHead } from "@/components/ui/Surface";
import { Skeleton, SkeletonRows } from "@/components/ui/States";
import { connectSource, getEngines, getProfile, listSources, reconnectSource } from "@/lib/api";
import { qk } from "@/lib/api/keys";
import type { EvidenceSource, SkillRow } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { GAP_LABEL } from "@/lib/utils/verdict";

/**
 * An evidence record, not a social profile. No followers, no headline, no recruiter view.
 * Completion is stated as what it unlocks; evidence sources are separated from AI engine
 * connections; every missing item says which opportunities it is costing.
 */
const SECTIONS = [
  { id: "sources", label: "Evidence sources" },
  { id: "engines", label: "AI engine connections" },
  { id: "targets", label: "Targets & preferences" },
  { id: "eligibility", label: "Eligibility" },
  { id: "skills", label: "Skills & evidence" },
  { id: "projects", label: "Projects" },
  { id: "education", label: "Education" },
  { id: "credentials", label: "Certificates & publications" },
];

export default function ProfilePage() {
  const client = useQueryClient();
  const [editTarget, setEditTarget] = useState(false);
  const [engineSheet, setEngineSheet] = useState(false);

  const profile = useQuery({ queryKey: qk.profile, queryFn: getProfile });
  const sources = useQuery({ queryKey: qk.sources, queryFn: listSources });
  const engines = useQuery({ queryKey: qk.engines, queryFn: getEngines });

  const connect = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "connect" | "reconnect" }) =>
      action === "connect" ? connectSource(id) : reconnectSource(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: qk.sources });
      void client.invalidateQueries({ queryKey: ["focus"] });
    },
  });

  const needsAttention = (sources.data ?? []).filter((s) => s.state === "attention").length;
  useSetStatusLine(
    needsAttention > 0 ? `${needsAttention} source needs attention` : "All sources synced",
  );
  useAssistantSubject({
    scope: "profile",
    id: null,
    label: "Ask about my evidence",
    subject: "My profile · evidence record",
  });

  if (profile.isLoading || !profile.data) return <ProfileSkeleton />;
  const data = profile.data;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-16 sm:px-8 md:px-10 xl:px-16">
      <header className="flex flex-wrap items-start gap-4 pt-6">
        <span
          aria-hidden
          className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-[14px] border border-violet-line bg-violet-tint font-display text-[20px] font-bold text-violet-text"
        >
          {data.initials}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[28px] leading-tight font-extrabold text-ink sm:text-[32px]">
            {data.name}
          </h1>
          <p className="mt-1 text-[14.5px] text-ink-body">{data.headline}</p>
        </div>
        <div className="flex items-center gap-2">
          <ButtonLink href="/profile/settings" variant="secondary">
            Settings
          </ButtonLink>
          <div className="hidden sm:block">
            <AssistantEntry />
          </div>
        </div>
      </header>

      {/* Completeness is stated as capability; the percentage supports it. */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <Card className="p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <Eyebrow>Evidence completeness</Eyebrow>
            <span className="tnum font-display text-[26px] leading-none font-extrabold text-violet-text">
              {data.completeness}%
            </span>
          </div>
          <Meter
            fill={data.completeness / 100}
            label={`${data.completeness} per cent complete`}
            className="mt-3"
          />
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-body">{data.capability}</p>
        </Card>

        <Card tint="violet" className="flex flex-col p-5">
          <Eyebrow tone="violet">Biggest evidence gap</Eyebrow>
          <h2 className="mt-1.5 font-display text-[19px] font-bold text-ink">
            {data.biggestGap.title}
          </h2>
          <p className="mt-1 text-[13.5px] text-ink-body">{data.biggestGap.cost}</p>
          <Button
            className="mt-auto self-start pt-0"
            onClick={() => connect.mutate({ id: "portfolio", action: "connect" })}
            disabled={connect.isPending}
          >
            {connect.isPending ? "Connecting…" : data.biggestGap.action}
          </Button>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
        {/* Sticky section rail — inline groups, not card soup. */}
        <nav aria-label="Profile sections" className="hidden lg:block">
          <div className="sticky top-[92px]">
            <Eyebrow>Sections</Eyebrow>
            <ul className="mt-2 flex flex-col">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex min-h-[40px] items-center rounded-lg px-2 text-[13.5px] text-ink-body transition-colors duration-100 hover:bg-row-hover hover:text-ink"
                  >
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-hairline pt-3 text-[12.5px] leading-snug text-ink-muted">
              Nothing here is public. REACH uses it only to judge fit and explain verdicts.
            </p>
          </div>
        </nav>

        <div className="min-w-0 space-y-8">
          {/* Evidence sources — what your fit is judged from. */}
          <section id="sources" className="scroll-mt-[92px]">
            <SectionHead
              glyph="px-cv"
              title="Evidence sources"
              detail="What your fit is judged from"
              action={
                <div className="hidden gap-1.5 sm:flex">
                  <Chip tone="sage">3 connected</Chip>
                  <Chip tone="apricot">1 needs attention</Chip>
                  <Chip tone="violet">1 missing</Chip>
                </div>
              }
            />
            <Card className="mt-3 overflow-hidden">
              <ul>
                {(sources.data ?? []).map((source, i) => (
                  <SourceRow
                    key={source.id}
                    source={source}
                    first={i === 0}
                    pending={connect.isPending}
                    onAction={() =>
                      connect.mutate({
                        id: source.id,
                        action: source.state === "attention" ? "reconnect" : "connect",
                      })
                    }
                  />
                ))}
              </ul>
            </Card>
          </section>

          {/* AI engine connections — who runs the analysis, never evidence. */}
          <section id="engines" className="scroll-mt-[92px]">
            <SectionHead
              glyph="g-engine"
              title="AI engine connections"
              detail="Who runs the analysis — never evidence about you"
              action={<Mono>Configured in Settings</Mono>}
            />
            <Card className="mt-3 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <PixelIcon name="g-engine" size={28} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-ink">
                    {engines.data?.engines.find((e) => e.id === engines.data?.activeId)?.name ??
                      "REACH-hosted engine"}
                    <Chip tone="violet">Default engine</Chip>
                    <Chip tone="sage">Connected</Chip>
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-body">
                    Used for matching · fix diagnosis · CV wording
                  </p>
                </div>
                <Button variant="secondary" onClick={() => setEngineSheet(true)}>
                  Configure
                </Button>
              </div>

              <ul className="mt-3 border-t border-hairline pt-2">
                {(engines.data?.engines ?? [])
                  .filter((engine) => engine.id !== engines.data?.activeId)
                  .map((engine, i) => (
                    <li key={engine.id}>
                      {i > 0 && <Hairline />}
                      <div className="flex flex-wrap items-center gap-3 py-2.5">
                        {/* Provider marks are permitted on Settings only — this is Profile. */}
                        <PixelIcon name="g-engine" size={22} />
                        <span className="min-w-0 flex-1 text-[14px] font-semibold text-ink">
                          {engine.name}
                        </span>
                        <span className="text-[13px] text-ink-muted">{engine.stateLabel}</span>
                        <Link
                          href="/profile/settings"
                          className="min-h-[44px] content-center text-[13.5px] font-semibold text-violet-text hover:underline"
                        >
                          {engine.state === "not-connected" ? "Connect" : "Configure"}
                        </Link>
                      </div>
                    </li>
                  ))}
              </ul>

              <p className="mt-2 border-t border-hairline pt-3 text-[12.5px] leading-relaxed text-ink-muted">
                Engines change who computes a verdict, never what counts as evidence. Removing one
                never removes your data.
              </p>
            </Card>
          </section>

          {/* Targets & preferences */}
          <section id="targets" className="scroll-mt-[92px]">
            <SectionHead
              glyph="px-apply"
              title="Targets & preferences"
              action={
                <Button variant="tertiary" onClick={() => setEditTarget(true)}>
                  Edit
                </Button>
              }
            />
            <Card className="mt-3 p-4">
              <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {data.targetDetail.map((row) => (
                  <div key={row.label}>
                    <dt className="text-[12.5px] font-semibold text-ink-muted">{row.label}</dt>
                    <dd className="mt-0.5 text-[14px] text-ink">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </section>

          {/* Eligibility — this is what produces Skip. */}
          <section id="eligibility" className="scroll-mt-[92px]">
            <SectionHead
              glyph="px-skip"
              title="Eligibility"
              detail="Drives every Skip verdict"
            />
            <Card className="mt-3 overflow-hidden">
              <ul>
                {data.eligibility.map((row, i) => (
                  <li key={row.label}>
                    {i > 0 && <Hairline />}
                    <div
                      className={cn(
                        "flex flex-wrap items-center gap-3 px-4 py-3",
                        row.state === "attention" && "bg-apricot-tint/60",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "h-[7px] w-[7px] shrink-0 rounded-full",
                          row.state === "clear"
                            ? "bg-sage"
                            : row.state === "attention"
                              ? "bg-apricot"
                              : "bg-terracotta",
                        )}
                      />
                      <span className="min-w-0 flex-1 text-[14px] font-semibold text-ink">
                        {row.label}
                      </span>
                      <span
                        className={cn(
                          "text-[13.5px]",
                          row.state === "attention" ? "text-apricot-text" : "text-ink-body",
                        )}
                      >
                        {row.value}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {/* Skills carry their evidence and gap type — the same vocabulary as One Fix Away. */}
          <section id="skills" className="scroll-mt-[92px]">
            <SectionHead
              glyph="px-github"
              title="Skills, and the evidence behind each"
              detail="A claim with no source is treated as unproven"
            />
            <Card className="mt-3 overflow-hidden">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-table-head">
                    {["Skill", "Evidence", "Strength", "Used in"].map((head, i) => (
                      <th
                        key={head}
                        scope="col"
                        className={cn(
                          "px-4 py-2 text-[11.5px] font-bold tracking-[.1em] text-ink-muted uppercase",
                          i === 1 && "hidden md:table-cell",
                          i === 3 && "text-right",
                        )}
                      >
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.skills.map((skill) => (
                    <SkillTableRow key={skill.name} skill={skill} />
                  ))}
                </tbody>
              </table>
            </Card>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section id="projects" className="scroll-mt-[92px]">
              <SectionHead glyph="g-repo" glyphSize={26} title="Projects" count={data.projects.length} />
              <Card className="mt-3 overflow-hidden">
                <ul>
                  {data.projects.map((project, i) => (
                    <li key={project.name}>
                      {i > 0 && <Hairline />}
                      <div className="px-4 py-3">
                        <p className="text-[14px] font-semibold text-ink">{project.name}</p>
                        <p
                          className={cn(
                            "mt-0.5 text-[13px]",
                            project.state === "attention" ? "text-apricot-text" : "text-ink-body",
                          )}
                        >
                          {project.detail}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>

            <section id="education" className="scroll-mt-[92px]">
              <SectionHead glyph="g-grad" glyphSize={26} title="Education" count={data.education.length} />
              <Card className="mt-3 overflow-hidden">
                <ul>
                  {data.education.map((row, i) => (
                    <li key={row.name}>
                      {i > 0 && <Hairline />}
                      <div className="px-4 py-3">
                        <p className="text-[14px] font-semibold text-ink">{row.name}</p>
                        <p className="mt-0.5 text-[13px] text-ink-body">{row.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          </div>

          <section id="credentials" className="scroll-mt-[92px]">
            <SectionHead glyph="g-cert-rec" glyphSize={26} title="Certificates & publications" />
            <Card className="mt-3 overflow-hidden">
              <ul>
                {[...data.certificates, ...data.publications].map((row, i) => (
                  <li key={row.name}>
                    {i > 0 && <Hairline />}
                    <div className="px-4 py-3">
                      <p className="text-[14px] font-semibold text-ink">{row.name}</p>
                      <p className="mt-0.5 text-[13px] text-ink-body">{row.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-hairline px-4 py-3">
                <ButtonLink href="/resume" variant="secondary" size="sm">
                  Add certificate
                </ButtonLink>
              </div>
            </Card>
          </section>

          <p className="text-[12.5px] leading-relaxed text-ink-muted lg:hidden">
            Nothing here is public. REACH uses it only to judge fit and explain verdicts.
          </p>

          <div className="sm:hidden">
            <AssistantEntry className="w-full justify-center" />
          </div>
        </div>
      </div>

      <TargetSheet open={editTarget} onClose={() => setEditTarget(false)} target={data.target} />
      <EngineSheet open={engineSheet} onClose={() => setEngineSheet(false)} />
    </div>
  );
}

/* ── Rows ───────────────────────────────────────────────────────────────── */

const SOURCE_STATE_TONE = {
  connected: { dot: "bg-sage", text: "text-sage-text", row: "" },
  syncing: { dot: "bg-sage", text: "text-sage-text", row: "" },
  attention: { dot: "bg-apricot", text: "text-apricot-text", row: "bg-apricot-tint/60" },
  "not-connected": { dot: "bg-ink-disabled", text: "text-ink-muted", row: "" },
  "missing-costly": { dot: "bg-violet", text: "text-violet-text", row: "bg-violet-tint/70" },
} as const;

function SourceRow({
  source,
  first,
  onAction,
  pending,
}: {
  source: EvidenceSource;
  first: boolean;
  onAction: () => void;
  pending: boolean;
}) {
  const tone = SOURCE_STATE_TONE[source.state];
  return (
    <li>
      {!first && <Hairline />}
      <div
        className={cn(
          "grid items-center gap-x-4 gap-y-1.5 px-4 py-3.5 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_minmax(0,12rem)_auto]",
          tone.row,
        )}
      >
        <div className="flex items-center gap-2.5">
          {source.icon ? <PixelIcon name={source.icon} size={24} /> : <LetterTile letter={source.name[0]} size={24} />}
          <span className="min-w-0">
            <span className="block text-[14.5px] font-semibold text-ink">{source.name}</span>
            <span className="block truncate text-[12.5px] text-ink-muted">{source.handle}</span>
          </span>
        </div>

        <p className="text-[13px] leading-snug text-ink-body">{source.contributes}</p>

        <div>
          <p className={cn("flex items-center gap-2 text-[13px] font-semibold", tone.text)}>
            <span aria-hidden className={cn("h-[7px] w-[7px] rounded-full", tone.dot)} />
            {source.stateLabel}
          </p>
          <Mono className={cn("mt-0.5 block normal-case", tone.text)}>{source.stateDetail}</Mono>
        </div>

        <Button variant="secondary" size="sm" onClick={onAction} disabled={pending}>
          {pending ? "Working…" : source.action}
        </Button>
      </div>
    </li>
  );
}

function SkillTableRow({ skill }: { skill: SkillRow }) {
  const proven = skill.strength === "proven";
  return (
    <tr className="border-t border-hairline hover:bg-row-hover">
      <td className="px-4 py-3 align-top">
        <span className="text-[14px] font-semibold text-ink">{skill.name}</span>
        <p className="mt-0.5 text-[12.5px] text-ink-body md:hidden">{skill.evidence}</p>
      </td>
      <td className="hidden px-4 py-3 align-top text-[13px] text-ink-body md:table-cell">
        {skill.evidence}
      </td>
      <td className="px-4 py-3 align-top">
        <Chip tone={proven ? "sage" : "apricot"}>
          {skill.strength === "proven" ? "Proven" : GAP_LABEL[skill.strength]}
        </Chip>
      </td>
      <td className="px-4 py-3 text-right align-top">
        <Link
          href="/discover"
          className="tnum font-mono text-[12px] text-violet-text uppercase hover:underline"
        >
          {skill.rolesAffected} roles
        </Link>
      </td>
    </tr>
  );
}

/* ── Engine sheet ───────────────────────────────────────────────────────── */

function EngineSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const engines = useQuery({ queryKey: qk.engines, queryFn: getEngines, enabled: open });

  return (
    <Sheet open={open} onClose={onClose} label="AI engine connections" height="min(680px, 88%)">
      <SheetGrip />
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-5">
        <h2 className="font-display text-[22px] font-bold text-ink">AI engine connections</h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-body">
          Engines decide who computes a verdict. They are never evidence about you, and removing
          one never removes your data.
        </p>

        <ul className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {(engines.data?.engines ?? []).map((engine, i) => (
            <li key={engine.id}>
              {i > 0 && <Hairline />}
              <div className="flex items-center gap-3 py-3">
                <PixelIcon name="g-engine" size={26} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-semibold text-ink">{engine.name}</span>
                  <span className="block text-[12.5px] text-ink-muted">{engine.stateLabel}</span>
                </span>
                <Link
                  href="/profile/settings"
                  onClick={onClose}
                  className="min-h-[44px] content-center text-[13.5px] font-semibold text-violet-text hover:underline"
                >
                  {engine.id === engines.data?.activeId ? "Configure" : "Use"}
                </Link>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-3 border-t border-hairline pt-3 text-[12.5px] leading-relaxed text-ink-muted">
          Job text and your evidence rows are shared with the engine that runs a verdict. Nothing
          is shared publicly.
        </p>
        <ButtonLink href="/profile/settings" size="lg" full className="mt-3" onClick={onClose}>
          Open Settings <Arrow />
        </ButtonLink>
      </div>
    </Sheet>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pt-8 sm:px-8 md:px-10 xl:px-16">
      <div className="flex gap-4">
        <Skeleton className="h-[56px] w-[56px] rounded-[14px]" />
        <div className="flex-1">
          <Skeleton className="h-[30px] w-[240px]" />
          <Skeleton className="mt-2 h-[16px] w-[360px]" />
        </div>
      </div>
      <Skeleton className="mt-6 h-[130px]" />
      <SkeletonRows rows={5} height={72} className="mt-6" />
    </div>
  );
}
