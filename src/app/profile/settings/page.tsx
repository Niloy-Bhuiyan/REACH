"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useAssistantSubject } from "@/components/assistant/AssistantProvider";
import { useSetStatusLine } from "@/components/shell/AppShell";
import { Arrow, Button } from "@/components/ui/Button";
import { Chip, Mono } from "@/components/ui/Chip";
import { Input, Select, Toggle } from "@/components/ui/Controls";
import { Sheet, SheetGrip } from "@/components/ui/Overlay";
import { EngineGlyph, SourceGlyph } from "@/components/evidence/Marks";
import { PixelIcon } from "@/components/ui/PixelIcon";
import { Card, Eyebrow, Hairline, SectionHead } from "@/components/ui/Surface";
import { ErrorNotice, Skeleton, SkeletonRows } from "@/components/ui/States";
import {
  getEngines,
  getPrivacy,
  getProfile,
  listSources,
  removeEngineKey,
  selectEngine,
  setEngineKey,
  setPrivacy,
  testEngine,
} from "@/lib/api";
import { qk } from "@/lib/api/keys";
import type { Engine, PrivacySettings } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { clock } from "@/lib/utils/time";

const GROUPS = [
  { id: "target", label: "Target & preferences" },
  { id: "authorisation", label: "Work authorisation" },
  { id: "sources", label: "Evidence sources", count: 3 },
  { id: "engine", label: "Analysis engine" },
  { id: "alerts", label: "Discovery & alerts" },
  { id: "privacy", label: "Data & privacy" },
  { id: "account", label: "Account" },
];

/**
 * The one place engine identity is allowed to appear. Two groups that are never mixed:
 * evidence sources decide what REACH can prove about you; the analysis engine only decides
 * who runs the reasoning. Provider logos live here at row scale and nowhere else.
 */
export default function SettingsPage() {
  const client = useQueryClient();
  const [engineSheet, setEngineSheet] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [showKeyField, setShowKeyField] = useState(false);

  const engines = useQuery({ queryKey: qk.engines, queryFn: getEngines });
  const sources = useQuery({ queryKey: qk.sources, queryFn: listSources });
  const privacy = useQuery({ queryKey: qk.privacy, queryFn: getPrivacy });
  const profile = useQuery({ queryKey: qk.profile, queryFn: getProfile });

  const select = useMutation({
    mutationFn: selectEngine,
    onSuccess: (next) => {
      client.setQueryData(qk.engines, next);
      void client.invalidateQueries({ queryKey: ["focus"] });
    },
  });

  const test = useMutation({
    mutationFn: testEngine,
    onSuccess: (next) => client.setQueryData(qk.engines, next),
  });

  const saveKey = useMutation({
    mutationFn: (key: string) => setEngineKey("claude", key),
    onSuccess: (next) => {
      client.setQueryData(qk.engines, next);
      setShowKeyField(false);
      setKeyDraft("");
    },
  });

  const removeKey = useMutation({
    mutationFn: () => removeEngineKey("claude"),
    onSuccess: (next) => client.setQueryData(qk.engines, next),
  });

  const patchPrivacy = useMutation({
    mutationFn: (patch: Partial<PrivacySettings>) => setPrivacy(patch),
    onSuccess: (next) => client.setQueryData(qk.privacy, next),
  });

  useSetStatusLine(
    profile.data ? `Profile ${profile.data.completeness}% · 2 gaps` : null,
  );
  useAssistantSubject({
    scope: "profile",
    id: null,
    label: "Ask about settings",
    subject: "Settings · engines and data",
  });

  if (engines.isLoading || !engines.data) return <SettingsSkeleton />;
  const data = engines.data;
  const active = data.engines.find((e) => e.id === data.activeId);
  const invalid = data.engines.find((e) => e.state === "key-invalid");

  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pb-16 sm:px-8 md:px-10 xl:px-16">
      <header className="flex flex-wrap items-start gap-4 pt-6">
        <PixelIcon name="g-engine" size={44} className="mt-1" />
        <div className="min-w-0 flex-1">
          <Link
            href="/profile"
            className="inline-flex min-h-[44px] items-center text-[13.5px] font-semibold text-violet-text hover:underline"
          >
            ← Profile
          </Link>
          <h1 className="mt-1 font-display text-[28px] leading-tight font-extrabold text-ink sm:text-[32px]">
            Settings
          </h1>
          <p className="mt-1.5 max-w-[80ch] text-[14.5px] leading-relaxed text-ink-body">
            Everything that changes how REACH judges you, and nothing that changes what it knows
            about you. Evidence is edited in Profile; this page governs targets, eligibility,
            engines and data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              const blob = new Blob([JSON.stringify({ engines: data, privacy: privacy.data }, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "reach-export.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export my data
          </Button>
        </div>
      </header>

      {/* 12F — an invalid key shows that the fallback already took over. */}
      {invalid && (
        <ErrorNotice
          title={`Your ${invalid.name} key was rejected`}
          className="mt-5"
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={() => removeKey.mutate()}>
                Remove key
              </Button>
              <Button size="sm" onClick={() => setShowKeyField(true)}>
                Replace key
              </Button>
            </>
          }
        >
          Anthropic returned{" "}
          <Mono className="normal-case">{invalid.keyError?.code}</Mono> at{" "}
          {invalid.keyError ? clock(invalid.keyError.at) : ""}. {invalid.keyError?.note}
          <span className="mt-2 flex items-center gap-2 rounded-[10px] border border-sage-line bg-sage-tint px-3 py-2 text-[13px] text-sage-text">
            <PixelIcon name="g-engine" size={18} />
            REACH-hosted is running your analyses in the meantime. Nothing is blocked.
          </span>
        </ErrorNotice>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="hidden lg:block">
          <div className="sticky top-[92px]">
            <Eyebrow>Settings</Eyebrow>
            <ul className="mt-2 flex flex-col">
              {GROUPS.map((group) => (
                <li key={group.id}>
                  <a
                    href={`#${group.id}`}
                    className="flex min-h-[40px] items-center gap-2 rounded-lg px-2 text-[13.5px] text-ink-body transition-colors duration-100 hover:bg-row-hover hover:text-ink"
                  >
                    {group.label}
                    {group.count && <Mono className="ml-auto">{group.count}</Mono>}
                  </a>
                </li>
              ))}
            </ul>

            <Card className="mt-4 p-3.5">
              <Eyebrow>Current engine</Eyebrow>
              <p className="mt-1 text-[14px] font-semibold text-ink">{active?.name}</p>
              <Mono className="mt-0.5 block text-sage-text">
                {data.fallbackActiveId ? "Active via fallback" : active?.health ?? "Healthy"}
              </Mono>
            </Card>
          </div>
        </nav>

        <div className="min-w-0 space-y-8">
          {/* Analysis engine — violet-labelled: who runs the reasoning. */}
          <section id="engine" className="scroll-mt-[92px]">
            <SectionHead
              glyph="g-engine"
              title="Analysis engine"
              detail="Who runs the reasoning · one active, one fallback"
            />
            <ul className="mt-3 flex flex-col gap-2">
              {data.engines.map((engine) => (
                <EngineRow
                  key={engine.id}
                  engine={engine}
                  active={engine.id === data.activeId}
                  pending={select.isPending || test.isPending}
                  onSelect={() => select.mutate(engine.id)}
                  onTest={() => test.mutate(engine.id)}
                  onReplaceKey={() => setShowKeyField(true)}
                  showKeyField={showKeyField && engine.id === "claude"}
                  keyDraft={keyDraft}
                  onKeyDraft={setKeyDraft}
                  onSaveKey={() => saveKey.mutate(keyDraft || "sk-ant-replacement-key")}
                />
              ))}
            </ul>

            <Card className="mt-3 flex flex-wrap items-center gap-3 p-4">
              <Eyebrow tone="violet">Fallback</Eyebrow>
              <p className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-ink-body">
                {data.fallbackNote}
              </p>
              <Button variant="tertiary" onClick={() => setEngineSheet(true)}>
                Change order
              </Button>
            </Card>
          </section>

          {/* Evidence sources — sage-labelled, kept separate, and edited in Profile. */}
          <section id="sources" className="scroll-mt-[92px]">
            <SectionHead
              glyph="px-cv"
              title="Evidence sources"
              detail="What REACH can prove about you · never confused with engines"
              action={
                <Link
                  href="/profile"
                  className="min-h-[44px] content-center text-[13.5px] font-semibold text-violet-text hover:underline"
                >
                  Manage in Profile
                </Link>
              }
            />
            <Card className="mt-3 overflow-hidden">
              <ul>
                {(sources.data ?? []).slice(0, 4).map((source, i) => (
                  <li key={source.id}>
                    {i > 0 && <Hairline />}
                    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <SourceGlyph id={source.id} icon={source.icon} name={source.name} size={24} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-semibold text-ink">
                          {source.name}
                        </span>
                        <Mono className="block normal-case">{source.shortNote}</Mono>
                      </span>
                      <span className="flex items-center gap-1.5">
                        {source.state === "connected" || source.state === "syncing" ? (
                          <>
                            <PixelIcon name="g-verified" size={18} />
                            <span className="text-[13px] font-semibold text-sage-text">
                              {source.stateDetail}
                            </span>
                          </>
                        ) : (
                          <Link
                            href="/profile"
                            className="min-h-[44px] content-center text-[13.5px] font-semibold text-violet-text hover:underline"
                          >
                            {source.action}
                          </Link>
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
            {invalid && (
              <p className="mt-2.5 flex items-center gap-2 text-[13px] font-semibold text-sage-text">
                <PixelIcon name="g-verified" size={18} />
                Unaffected — an engine problem never touches your evidence.
              </p>
            )}
          </section>

          {/* The guarantees the rest of the product relies on. */}
          <section className="scroll-mt-[92px]">
            <Card className="p-4">
              <div className="flex items-center gap-2.5">
                <PixelIcon name="g-citation" size={26} />
                <h2 className="font-display text-[19px] font-bold text-ink">
                  What the engine cannot do
                </h2>
              </div>
              <ul className="mt-3 flex flex-col gap-2">
                {data.guarantees.map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <span aria-hidden className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-ink-disabled" />
                    <span className="text-[13.5px] leading-relaxed text-ink-body">{line}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>

          {/* Data & privacy */}
          <section id="privacy" className="scroll-mt-[92px]">
            <SectionHead glyph="g-key" title="Data & privacy" />
            <Card className="mt-3 px-4">
              {privacy.data && (
                <>
                  <Toggle
                    label="Share anonymised fit outcomes"
                    detail="Improves ranking for students like you"
                    checked={privacy.data.shareAnonymisedOutcomes}
                    onChange={(v) => patchPrivacy.mutate({ shareAnonymisedOutcomes: v })}
                  />
                  <Hairline />
                  <Toggle
                    label="Keep analysed JD text"
                    detail="Needed to re-check a posting later"
                    checked={privacy.data.keepAnalysedJd}
                    onChange={(v) => patchPrivacy.mutate({ keepAnalysedJd: v })}
                  />
                  <Hairline />
                  <Toggle
                    label="Let engines see contact details"
                    detail="Off — never needed for fit analysis"
                    checked={privacy.data.enginesSeeContactDetails}
                    onChange={(v) => patchPrivacy.mutate({ enginesSeeContactDetails: v })}
                  />
                </>
              )}
            </Card>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-muted">
              Deleting your account removes evidence, runs and roadmaps within 30 days. Exports
              are JSON plus your CV files.
            </p>
          </section>

          <section id="alerts" className="scroll-mt-[92px]">
            <SectionHead glyph="g-fresh" title="Discovery & alerts" />
            <Card className="mt-3 flex flex-wrap items-center gap-3 p-4">
              <span className="min-w-0 flex-1 text-[14px] font-semibold text-ink">
                How often REACH re-verifies your target
              </span>
              {privacy.data && (
                <Select
                  value={privacy.data.discoveryFrequency}
                  onChange={(value) =>
                    patchPrivacy.mutate({
                      discoveryFrequency: value as PrivacySettings["discoveryFrequency"],
                    })
                  }
                  options={[
                    { value: "daily", label: "Daily" },
                    { value: "weekly", label: "Weekly" },
                    { value: "manual", label: "Manual only" },
                  ]}
                />
              )}
            </Card>
          </section>

          {/* Attention, not error — apricot. */}
          <Card tint="apricot" className="flex items-start gap-3 p-4">
            <PixelIcon name="g-stale" size={26} />
            <div>
              <p className="text-[14.5px] font-bold text-apricot-text">
                One setting affects your results
              </p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-body">
                {data.consequenceNote}
              </p>
            </div>
          </Card>
        </div>
      </div>

      <EngineChoiceSheet
        open={engineSheet}
        onClose={() => setEngineSheet(false)}
        engines={data.engines}
        activeId={data.activeId}
        fallbackNote={data.fallbackNote}
        onSelect={(id) => {
          select.mutate(id);
          setEngineSheet(false);
        }}
      />
    </div>
  );
}

/* ── Engine row ─────────────────────────────────────────────────────────── */

/**
 * Engines are rows with radios, not cards. Selection, health, quota, and what each engine can
 * and cannot see all live on the same row, so choosing is an informed act rather than a brand
 * preference. Provider marks appear at 24–30px inside the row — and only here.
 */
function EngineRow({
  engine,
  active,
  pending,
  onSelect,
  onTest,
  onReplaceKey,
  showKeyField,
  keyDraft,
  onKeyDraft,
  onSaveKey,
}: {
  engine: Engine;
  active: boolean;
  pending: boolean;
  onSelect: () => void;
  onTest: () => void;
  onReplaceKey: () => void;
  showKeyField: boolean;
  keyDraft: string;
  onKeyDraft: (value: string) => void;
  onSaveKey: () => void;
}) {
  const invalid = engine.state === "key-invalid";

  return (
    <li
      className={cn(
        "rounded-[14px] border p-4",
        active
          ? "border-control bg-violet-tint"
          : invalid
            ? "border-terracotta-line bg-terracotta-tint"
            : "border-line bg-surface",
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        {/* The radio stays 18px; the label around it carries the 44px target. */}
        <label className="-mt-1 -ml-1 flex h-[44px] w-[44px] shrink-0 cursor-pointer items-center justify-center">
          <input
            type="radio"
            name="engine"
            checked={active}
            onChange={onSelect}
            disabled={pending || engine.state === "not-connected" || invalid}
            aria-label={`Use ${engine.name}`}
            className="h-[18px] w-[18px] accent-[#6C63D8]"
          />
        </label>
        <EngineGlyph id={engine.id} icon={engine.icon} size={28} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-ink">
            {engine.name}
            {engine.badge && <Chip tone="violet">{engine.badge}</Chip>}
            <Chip
              tone={
                active ? "sage" : invalid ? "terracotta" : engine.state === "available" ? "sage" : "stone"
              }
            >
              {active ? "Active" : engine.stateLabel}
            </Chip>
          </p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-ink-body">{engine.blurb}</p>

          {/* Every engine declares its exposure. */}
          <dl className="mt-2.5 grid gap-x-6 gap-y-1.5 sm:grid-cols-3">
            {[
              { label: "Sees", value: engine.exposure.sees },
              { label: "Never sees", value: engine.exposure.neverSees },
              { label: "Retention", value: engine.exposure.retention },
            ].map((row) => (
              <div key={row.label}>
                <dt className="text-[11.5px] font-bold tracking-[.1em] text-ink-muted uppercase">
                  {row.label}
                </dt>
                <dd className="mt-0.5 text-[12.5px] leading-snug text-ink-body">{row.value}</dd>
              </div>
            ))}
          </dl>

          {engine.keyMasked && !invalid && (
            <p className="mt-2.5 flex items-center gap-2">
              <PixelIcon name="g-key" size={18} />
              <Mono className="normal-case">{engine.keyMasked}</Mono>
            </p>
          )}

          {engine.endpoint && (
            <p className="mt-2.5">
              <Mono className="normal-case">{engine.endpoint}</Mono>
            </p>
          )}

          {showKeyField && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Input
                value={keyDraft}
                onChange={(event) => onKeyDraft(event.target.value)}
                placeholder="sk-ant-…"
                aria-label="Replacement API key"
                className="max-w-[320px]"
              />
              <Button size="md" onClick={onSaveKey}>
                Save key
              </Button>
            </div>
          )}
        </div>

        <div className="flex w-full shrink-0 flex-col items-start gap-1.5 sm:w-auto sm:items-end">
          {engine.quota && (
            <Mono>
              {engine.quota.used} / {engine.quota.of} today
            </Mono>
          )}
          {engine.health && !active && <Mono>{engine.health}</Mono>}
          <div className="flex flex-wrap gap-2 sm:justify-end">
            {!active && !invalid && engine.state !== "not-connected" && (
              <Button size="sm" onClick={onSelect} disabled={pending}>
                Use this engine
              </Button>
            )}
            {engine.state === "not-connected" && (
              <Button size="sm" variant="secondary" onClick={onTest} disabled={pending}>
                {engine.id === "local" ? "Detect" : "Connect"}
              </Button>
            )}
            {engine.id === "claude" && !invalid && (
              <>
                <Button size="sm" variant="secondary" onClick={onReplaceKey}>
                  Replace
                </Button>
                <Button size="sm" variant="secondary" onClick={onTest} disabled={pending}>
                  {pending ? "Testing…" : "Test connection"}
                </Button>
              </>
            )}
            {invalid && (
              <Button size="sm" onClick={onReplaceKey}>
                Fix
              </Button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/* ── Engine sheet ───────────────────────────────────────────────────────── */

function EngineChoiceSheet({
  open,
  onClose,
  engines,
  activeId,
  fallbackNote,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  engines: Engine[];
  activeId: string;
  fallbackNote: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} label="Choose an analysis engine" height="min(700px, 90%)">
      <SheetGrip />
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-5">
        <h2 className="font-display text-[22px] font-bold text-ink">
          Choose an analysis engine
        </h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-body">
          This changes who does the reasoning, not what REACH knows about you.
        </p>

        <ul className="mt-4 min-h-0 flex-1 overflow-y-auto">
          {engines.map((engine, i) => (
            <li key={engine.id}>
              {i > 0 && <Hairline />}
              <div className="flex items-center gap-3 py-3">
                <EngineGlyph id={engine.id} icon={engine.icon} size={26} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-semibold text-ink">{engine.name}</span>
                  <span className="block text-[12.5px] text-ink-muted">
                    {engine.exposure.sees} · {engine.exposure.retention}
                  </span>
                </span>
                {engine.id === activeId ? (
                  <Chip tone="sage">Active</Chip>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => onSelect(engine.id)}>
                    Use
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-3 rounded-[12px] border border-line bg-canvas p-3">
          <Eyebrow>Fallback</Eyebrow>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-body">{fallbackNote}</p>
        </div>
        <p className="mt-2.5 text-[12.5px] text-ink-muted">
          Takes effect on your next discovery run.
        </p>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" size="lg" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button size="lg" onClick={onClose} className="flex-[1.6]">
            Keep {engines.find((e) => e.id === activeId)?.name} <Arrow />
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

function SettingsSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-5 pt-8 sm:px-8 md:px-10 xl:px-16">
      <Skeleton className="h-[32px] w-[220px]" />
      <Skeleton className="mt-3 h-[16px] w-[70%]" />
      <SkeletonRows rows={4} height={140} className="mt-8" />
    </div>
  );
}
