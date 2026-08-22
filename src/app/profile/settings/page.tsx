"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useAssistantSubject } from "@/components/assistant/AssistantProvider";
import { useSetStatusLine } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Meta, Mono } from "@/components/ui/Chip";
import { Input, Select, Toggle } from "@/components/ui/Controls";
import { Disclosure } from "@/components/ui/Disclosure";
import { EngineMark, SourceMark } from "@/components/evidence/SourceMark";
import { Icon } from "@/components/ui/Icon";
import { Hairline, Page, Stack } from "@/components/ui/Surface";
import { ErrorNotice, Skeleton, SkeletonRows } from "@/components/ui/States";
import {
  getEngines,
  getPrivacy,
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

/**
 * The one screen where engine identity appears. Two groups that never mix:
 * evidence sources decide what REACH can prove about you; the analysis engine
 * only decides who runs the reasoning.
 */
export default function SettingsPage() {
  const client = useQueryClient();
  const [keyDraft, setKeyDraft] = useState("");
  const [showKeyField, setShowKeyField] = useState(false);

  const engines = useQuery({ queryKey: qk.engines, queryFn: getEngines });
  const sources = useQuery({ queryKey: qk.sources, queryFn: listSources });
  const privacy = useQuery({ queryKey: qk.privacy, queryFn: getPrivacy });

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

  useSetStatusLine(null);
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
    <Page width="reading" className="pt-8 pb-20 sm:pt-12">
      <Stack gap="md">
        <header>
          <Link
            href="/profile"
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
            Profile
          </Link>
          <h1 className="font-display mt-1 text-display text-ink">Settings</h1>
          <p className="mt-1.5 max-w-[58ch] text-body text-ink-body">
            What changes how REACH judges you — not what it knows about you. Evidence is edited in
            Profile.
          </p>
        </header>

        {/* 12F — an invalid key shows that the fallback already took over. */}
        {invalid && (
          <ErrorNotice
            title={`Your ${invalid.name} key was rejected`}
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
            Anthropic returned <Mono className="text-terracotta-text">{invalid.keyError?.code}</Mono>{" "}
            at {invalid.keyError ? clock(invalid.keyError.at) : ""}. {invalid.keyError?.note}
            <span className="mt-2 block text-sage-text">
              REACH-hosted is running your analyses in the meantime. Nothing is blocked.
            </span>
          </ErrorNotice>
        )}

        {/* Who runs the reasoning. */}
        <section>
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <h2 className="text-section text-ink">Analysis engine</h2>
            <Meta>{active?.name}</Meta>
          </div>
          <ul className="mt-1">
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

          <p className="mt-3 max-w-[62ch] text-sm text-ink-muted">{data.fallbackNote}</p>

          <Disclosure label="What the engine cannot do" className="mt-3">
            <ul className="pt-1">
              {data.guarantees.map((line, i) => (
                <li key={line}>
                  {i > 0 && <Hairline />}
                  <p className="py-2 text-sm text-ink-body">{line}</p>
                </li>
              ))}
            </ul>
          </Disclosure>
        </section>

        {/* What REACH can prove — kept visually apart from the engine. */}
        <section>
          <div className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
            <h2 className="text-section text-ink">Evidence sources</h2>
            <Link
              href="/profile"
              className="inline-flex min-h-[36px] items-center text-sm font-medium text-brand-text hover:underline"
            >
              Manage in Profile
            </Link>
          </div>
          <ul className="mt-1">
            {(sources.data ?? []).map((source, i) => (
              <li key={source.id}>
                {i > 0 && <Hairline />}
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <SourceMark id={source.id} size={17} className="text-ink-muted" />
                    <span className="truncate text-body text-ink">{source.name}</span>
                  </span>
                  <Meta>{source.shortNote}</Meta>
                </div>
              </li>
            ))}
          </ul>
          {invalid && (
            <p className="mt-3 text-sm text-sage-text">
              Unaffected — an engine problem never touches your evidence.
            </p>
          )}
        </section>

        <section>
          <h2 className="border-b border-line pb-2 text-section text-ink">Data and privacy</h2>
          {privacy.data && (
            <div className="divide-y divide-hairline">
              <Toggle
                label="Share anonymised fit outcomes"
                detail="Improves ranking for students like you"
                checked={privacy.data.shareAnonymisedOutcomes}
                onChange={(v) => patchPrivacy.mutate({ shareAnonymisedOutcomes: v })}
              />
              <Toggle
                label="Keep analysed JD text"
                detail="Needed to re-check a posting later"
                checked={privacy.data.keepAnalysedJd}
                onChange={(v) => patchPrivacy.mutate({ keepAnalysedJd: v })}
              />
              <Toggle
                label="Let engines see contact details"
                detail="Never needed for fit analysis"
                checked={privacy.data.enginesSeeContactDetails}
                onChange={(v) => patchPrivacy.mutate({ enginesSeeContactDetails: v })}
              />
              <div className="flex items-center justify-between gap-4 py-3.5">
                <span className="text-body font-medium text-ink">Re-verify your target</span>
                <Select
                  value={privacy.data.discoveryFrequency}
                  onChange={(value) =>
                    patchPrivacy.mutate({
                      discoveryFrequency: value as PrivacySettings["discoveryFrequency"],
                    })
                  }
                  neutralValue="daily"
                  options={[
                    { value: "daily", label: "Daily" },
                    { value: "weekly", label: "Weekly" },
                    { value: "manual", label: "Manual only" },
                  ]}
                />
              </div>
            </div>
          )}
          <p className="mt-3 text-sm text-ink-muted">
            Deleting your account removes evidence, runs and roadmaps within 30 days.
          </p>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => {
              const blob = new Blob(
                [JSON.stringify({ engines: data, privacy: privacy.data }, null, 2)],
                { type: "application/json" },
              );
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
        </section>

        {/* Attention, not error. */}
        <p className="flex items-start gap-2.5 text-sm text-apricot-text">
          <Icon name="alert" size={17} className="mt-px text-apricot" />
          {data.consequenceNote}
        </p>
      </Stack>
    </Page>
  );
}

/**
 * Engines are rows with radios. Selection, health, quota and what each engine can
 * see all live on the row, so choosing is informed rather than a brand preference.
 * Provider marks appear here at row scale — and only here.
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
    <li className="border-b border-hairline py-3.5 last:border-b-0">
      <div className="flex flex-wrap items-start gap-2">
        <label className="-mt-1 -ml-2 flex size-[44px] shrink-0 cursor-pointer items-center justify-center">
          <input
            type="radio"
            name="engine"
            checked={active}
            onChange={onSelect}
            disabled={pending || engine.state === "not-connected" || invalid}
            aria-label={`Use ${engine.name}`}
            className="size-[16px] accent-brand"
          />
        </label>

        {engine.isProviderMark && (
          <EngineMark id={engine.id} size={20} className="mt-0.5 text-ink-body" />
        )}

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2.5">
            <span className={cn("text-body text-ink", active && "font-medium")}>{engine.name}</span>
            <span
              className={cn(
                "text-sm",
                active ? "text-sage-text" : invalid ? "text-terracotta-text" : "text-ink-muted",
              )}
            >
              {active ? "Active" : engine.stateLabel}
            </span>
            {engine.quota && (
              <Mono>
                {engine.quota.used} / {engine.quota.of} today
              </Mono>
            )}
          </p>
          <p className="mt-0.5 max-w-[54ch] text-sm text-ink-muted">{engine.blurb}</p>

          {showKeyField && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Input
                value={keyDraft}
                onChange={(event) => onKeyDraft(event.target.value)}
                placeholder="sk-ant-…"
                aria-label="Replacement API key"
                className="max-w-[300px]"
              />
              <Button size="md" onClick={onSaveKey}>
                Save key
              </Button>
            </div>
          )}

          {/* Every engine declares its exposure, on demand. */}
          <Disclosure label="What this engine can see" className="mt-2">
            <dl className="grid gap-x-8 gap-y-1.5 pt-1 sm:grid-cols-3">
              {[
                { label: "Sees", value: engine.exposure.sees },
                { label: "Never sees", value: engine.exposure.neverSees },
                { label: "Retention", value: engine.exposure.retention },
              ].map((row) => (
                <div key={row.label}>
                  <dt className="text-meta font-medium text-ink-muted">{row.label}</dt>
                  <dd className="mt-0.5 text-sm text-ink-body">{row.value}</dd>
                </div>
              ))}
            </dl>
            {engine.keyMasked && !invalid && <Mono className="mt-2 block">{engine.keyMasked}</Mono>}
            {engine.endpoint && <Mono className="mt-2 block">{engine.endpoint}</Mono>}
          </Disclosure>
        </div>

        <div className="flex w-full flex-wrap gap-2 pl-11 sm:w-auto sm:shrink-0 sm:justify-end sm:pl-0">
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
              <Button size="sm" variant="ghost" onClick={onReplaceKey}>
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
    </li>
  );
}

function SettingsSkeleton() {
  return (
    <Page width="reading" className="pt-10">
      <Skeleton className="h-[30px] w-[160px]" />
      <Skeleton className="mt-3 h-[16px] w-[70%]" />
      <SkeletonRows rows={4} height={72} className="mt-10" />
    </Page>
  );
}
