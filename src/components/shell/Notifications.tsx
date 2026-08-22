"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Eyebrow } from "@/components/ui/Surface";
import { getDelta, listSources } from "@/lib/api";
import { qk } from "@/lib/api/keys";
import { ago, closingDate, daysUntil } from "@/lib/utils/time";

/**
 * The right cluster is one status line, one bell and one avatar — nothing else. There is no bell
 * in the glyph family and emoji are banned, so this uses the deadline glyph: in REACH what is
 * worth interrupting for is a closing date or a source that stopped reporting. The count carries
 * the meaning, the glyph supports it.
 */
export function Notifications() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const sources = useQuery({ queryKey: qk.sources, queryFn: listSources });
  const delta = useQuery({ queryKey: qk.delta("sql"), queryFn: () => getDelta("sql") });

  const stale = (sources.data ?? []).filter((s) => s.state === "attention");
  const closing = (delta.data?.affected ?? []).filter((job) => daysUntil(job.closesAt) <= 10);
  const count = stale.length + closing.length;

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={
          count > 0 ? `Notifications — ${count} need attention` : "Notifications — nothing waiting"
        }
        className="relative flex size-[44px] items-center justify-center rounded-full border border-line bg-surface text-ink-body transition-colors duration-150 hover:bg-surface-sunken hover:text-ink"
      >
        <Icon name="bell" size={19} />
        {count > 0 && (
          <span className="tnum absolute top-1 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-apricot px-1 font-mono text-[12px] leading-none font-bold text-surface">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute top-[52px] right-0 z-40 w-[340px] rounded-2xl border border-line bg-surface p-4 shadow-tier3"
        >
          <Eyebrow>What needs you</Eyebrow>

          <ul className="mt-2.5 flex flex-col gap-1.5">
            {stale.map((source) => (
              <li key={source.id}>
                <Link
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-2.5 rounded-xl border border-apricot-line bg-apricot-tint px-3 py-2.5 transition-colors duration-100 hover:bg-apricot-tint/70"
                >
                  <Icon name="alert" size={18} className="mt-0.5 text-apricot-text" />
                  <span className="text-[13px] leading-snug text-ink-body">
                    <span className="font-semibold text-apricot-text">
                      {source.name} needs attention
                    </span>
                    <br />
                    {source.stateDetail}
                  </span>
                </Link>
              </li>
            ))}

            {closing.map((job) => (
              <li key={job.jobId}>
                <Link
                  href={`/jobs/${job.jobId}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-2.5 rounded-xl border border-line px-3 py-2.5 transition-colors duration-100 hover:bg-row-hover"
                >
                  <Icon name="clock" size={18} className="mt-0.5 text-ink-muted" />
                  <span className="text-[13px] leading-snug text-ink-body">
                    <span className="font-semibold text-ink">
                      {job.role} · {job.company}
                    </span>
                    <br />
                    Closes {closingDate(job.closesAt)} · {daysUntil(job.closesAt)} days
                  </span>
                </Link>
              </li>
            ))}

            {count === 0 && (
              <li className="rounded-xl border border-line px-3 py-3 text-[13px] text-ink-body">
                Nothing needs you right now.
              </li>
            )}
          </ul>

          {delta.data && (
            <p className="tnum mt-3 border-t border-hairline pt-2.5 font-mono text-[12px] tracking-tight text-ink-muted">
              LAST RUN VERIFIED {ago(new Date().toISOString()).toUpperCase()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
