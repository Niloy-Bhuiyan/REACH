"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useAssistantSubject } from "@/components/assistant/AssistantProvider";
import { AssistantEntry } from "@/components/assistant/AssistantSurface";
import { IntegrationRow } from "@/components/evidence/EvidenceRow";
import { useSetStatusLine } from "@/components/shell/AppShell";
import { TargetSheet } from "@/components/shell/TargetPill";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Meta, Mono } from "@/components/ui/Chip";
import { Disclosure } from "@/components/ui/Disclosure";
import { Meter } from "@/components/ui/Meter";
import { Hairline, Page, Stack } from "@/components/ui/Surface";
import { Skeleton, SkeletonRows } from "@/components/ui/States";
import { connectSource, getProfile, listSources, reconnectSource } from "@/lib/api";
import { qk } from "@/lib/api/keys";
import type { SkillRow } from "@/lib/api/types";
import { GAP_LABEL } from "@/lib/utils/verdict";

/**
 * An evidence record, not a social profile and not a dashboard. Completeness is
 * stated as what it lets REACH judge; the costly gap is named once; engines are
 * configured in Settings, which is where they belong.
 */
export default function ProfilePage() {
  const client = useQueryClient();
  const [editTarget, setEditTarget] = useState(false);

  const profile = useQuery({ queryKey: qk.profile, queryFn: getProfile });
  const sources = useQuery({ queryKey: qk.sources, queryFn: listSources });

  const connect = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "connect" | "reconnect" }) =>
      action === "connect" ? connectSource(id) : reconnectSource(id),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: qk.sources });
      void client.invalidateQueries({ queryKey: ["focus"] });
    },
  });

  const needsAttention = (sources.data ?? []).filter((s) => s.state === "attention").length;
  useSetStatusLine(needsAttention > 0 ? `${needsAttention} source needs attention` : null);
  useAssistantSubject({
    scope: "profile",
    id: null,
    label: "Ask about my evidence",
    subject: "My profile · evidence record",
  });

  if (profile.isLoading || !profile.data) return <ProfileSkeleton />;
  const data = profile.data;

  return (
    <Page width="reading" className="pt-8 pb-20 sm:pt-12">
      <Stack gap="md">
        <header>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <h1 className="text-title text-ink">{data.name}</h1>
            <div className="ml-auto flex items-center gap-2">
              <ButtonLink href="/profile/settings" variant="secondary">
                Settings
              </ButtonLink>
              <div className="hidden sm:block">
                <AssistantEntry />
              </div>
            </div>
          </div>
          <p className="mt-1">
            <Meta>{data.headline}</Meta>
          </p>
        </header>

        {/* Completeness as capability. The percentage supports the sentence. */}
        <section>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-section text-ink">Evidence</h2>
            <span className="tnum text-body font-medium text-ink">{data.completeness}%</span>
          </div>
          <Meter
            fill={data.completeness / 100}
            label={`${data.completeness} per cent complete`}
            className="mt-2.5"
          />
          <p className="mt-3 max-w-[58ch] text-body text-ink-body">{data.capability}</p>

          {/* The costly gap, named once, with one action. */}
          <p className="mt-4 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="text-body font-medium text-violet-text">{data.biggestGap.title}</span>
            <Meta>{data.biggestGap.cost}</Meta>
            <Button
              variant="link"
              onClick={() => connect.mutate({ id: "portfolio", action: "connect" })}
              disabled={connect.isPending}
            >
              {connect.isPending ? "Connecting…" : data.biggestGap.action}
            </Button>
          </p>
        </section>

        <section>
          <h2 className="border-b border-line pb-2 text-section text-ink">Sources</h2>
          <div className="mt-1">
            {(sources.data ?? []).map((source) => (
              <IntegrationRow
                key={source.id}
                source={source}
                pending={connect.isPending}
                onAction={() =>
                  connect.mutate({
                    id: source.id,
                    action: source.state === "attention" ? "reconnect" : "connect",
                  })
                }
              />
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-muted">
            Nothing here is public. REACH uses it only to judge fit and explain verdicts.
          </p>
        </section>

        <section>
          <h2 className="border-b border-line pb-2 text-section text-ink">Skills</h2>
          <ul className="mt-1">
            {data.skills.map((skill) => (
              <SkillLine key={skill.name} skill={skill} />
            ))}
          </ul>
        </section>

        <section>
          <h2 className="border-b border-line pb-2 text-section text-ink">Projects</h2>
          <ul className="mt-1">
            {data.projects.map((project) => (
              <li
                key={project.name}
                className="flex items-baseline justify-between gap-4 border-b border-hairline py-2.5 last:border-b-0"
              >
                <span className="text-body text-ink">{project.name}</span>
                <span
                  className={`text-sm ${
                    project.state === "attention" ? "text-apricot-text" : "text-ink-muted"
                  }`}
                >
                  {project.detail}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Preferences and the rest, on demand. */}
        <section>
          <Disclosure
            label="Targets and preferences"
            detail={`${data.target.role} · ${data.target.location}`}
          >
            <dl className="grid gap-x-8 gap-y-2 pt-1 sm:grid-cols-2">
              {data.targetDetail.map((row) => (
                <div key={row.label}>
                  <dt className="text-sm text-ink-muted">{row.label}</dt>
                  <dd className="text-body text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
            <Button variant="link" className="mt-3" onClick={() => setEditTarget(true)}>
              Edit target
            </Button>
          </Disclosure>

          <Disclosure label="Eligibility" detail="Drives every Skip verdict">
            <ul className="pt-1">
              {data.eligibility.map((row, i) => (
                <li key={row.label}>
                  {i > 0 && <Hairline />}
                  <div className="flex items-baseline justify-between gap-3 py-2">
                    <span className="text-sm text-ink-body">{row.label}</span>
                    <span
                      className={`text-sm ${
                        row.state === "attention" ? "text-apricot-text" : "text-ink"
                      }`}
                    >
                      {row.value}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Disclosure>

          <Disclosure
            label="Education and credentials"
            detail={data.education.map((e) => e.name).join(" · ")}
          >
            <ul className="pt-1">
              {[...data.education, ...data.certificates, ...data.publications].map((row, i) => (
                <li key={row.name}>
                  {i > 0 && <Hairline />}
                  <div className="flex items-baseline justify-between gap-3 py-2">
                    <span className="text-sm text-ink">{row.name}</span>
                    <Meta>{row.detail}</Meta>
                  </div>
                </li>
              ))}
            </ul>
          </Disclosure>

          {/* Engines live in Settings; Profile only points there. */}
          <Link
            href="/profile/settings"
            className="flex min-h-[48px] items-center gap-3 border-t border-line transition-colors duration-100 hover:bg-surface-sunken"
          >
            <span className="text-sm font-medium text-ink">Analysis engine</span>
            <span className="min-w-0 flex-1 truncate text-sm text-ink-muted">
              Who runs the reasoning — configured in Settings
            </span>
            <span className="text-sm font-medium text-violet-text">Open</span>
          </Link>
        </section>
      </Stack>

      <TargetSheet open={editTarget} onClose={() => setEditTarget(false)} target={data.target} />
    </Page>
  );
}

/** A skill is a claim, its receipt, and what it costs when unproven. */
function SkillLine({ skill }: { skill: SkillRow }) {
  const proven = skill.strength === "proven";
  return (
    <li className="grid gap-x-6 gap-y-0.5 border-b border-hairline py-2.5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]">
      <div className="min-w-0">
        <span className="text-body text-ink">{skill.name}</span>
        <p className="mt-0.5">
          <Meta>{skill.evidence}</Meta>
        </p>
      </div>
      <p className="flex items-baseline gap-3 sm:justify-end">
        <span className={`text-sm ${proven ? "text-sage-text" : "text-apricot-text"}`}>
          {skill.strength === "proven" ? "Proven" : GAP_LABEL[skill.strength]}
        </span>
        <Mono>{skill.rolesAffected} roles</Mono>
      </p>
    </li>
  );
}

function ProfileSkeleton() {
  return (
    <Page width="reading" className="pt-10">
      <Skeleton className="h-[30px] w-[220px]" />
      <Skeleton className="mt-3 h-[16px] w-[320px]" />
      <Skeleton className="mt-10 h-[70px]" />
      <SkeletonRows rows={5} height={52} className="mt-10" />
    </Page>
  );
}
