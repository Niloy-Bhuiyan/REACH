"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Controls";
import { Drawer, Sheet, SheetGrip } from "@/components/ui/Overlay";
import { Eyebrow } from "@/components/ui/Surface";
import { Skeleton } from "@/components/ui/States";
import { askAssistant, getAssistantSuggestions } from "@/lib/api";
import { qk } from "@/lib/api/keys";
import type { AssistantAnswer, AssistantMessage } from "@/lib/api/types";
import { useIsMobile } from "@/lib/hooks";
import { cn } from "@/lib/utils/cn";
import { useAssistant } from "./AssistantProvider";

/**
 * Secondary infrastructure, not a product of its own. Closed by default, summoned from a page,
 * scoped to the object you are looking at, answering with the same evidence rows the rest of
 * REACH uses. No mascot, no avatar, no presence indicator, no hero.
 */
export function AssistantSurface() {
  const { open, subject, closeAssistant } = useAssistant();
  const isMobile = useIsMobile();
  const [thread, setThread] = useState<AssistantMessage[]>([]);
  const [error, setError] = useState<AssistantAnswer["error"] | null>(null);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const suggestions = useQuery({
    queryKey: qk.assistantSuggestions(subject.scope),
    queryFn: () => getAssistantSuggestions(subject.scope),
    enabled: open,
  });

  const ask = useMutation({
    mutationFn: (question: string) => askAssistant(subject.scope, subject.id, question),
    onSuccess: (answer) => {
      if (answer.error) {
        setError(answer.error);
        return;
      }
      setError(null);
      setThread((prev) => [...prev, answer.message]);
    },
  });

  // A change of object clears the thread — an answer is always about one thing.
  // Adjusted during render rather than in an effect, so no cascading re-render.
  const subjectKey = `${subject.scope}:${subject.id ?? "-"}`;
  const [lastSubjectKey, setLastSubjectKey] = useState(subjectKey);
  if (subjectKey !== lastSubjectKey) {
    setLastSubjectKey(subjectKey);
    setThread([]);
    setError(null);
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length, ask.isPending]);

  const submit = (question: string) => {
    const text = question.trim();
    if (!text || ask.isPending) return;
    setThread((prev) => [
      ...prev,
      {
        id: `u${Date.now()}`,
        role: "user",
        at: new Date().toISOString(),
        text,
      },
    ]);
    setDraft("");
    ask.mutate(text);
  };

  const body = (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-line px-5 py-4">
        <span className="text-section text-ink">Ask REACH</span>
        <div className="flex items-center gap-1">
          {thread.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setThread([]);
                setError(null);
              }}
              className="px-2"
            >
              Clear
            </Button>
          )}
          <button
            type="button"
            onClick={closeAssistant}
            aria-label="Close the assistant"
            className="flex h-[44px] w-[44px] items-center justify-center rounded-[9px] text-ink-body transition-colors duration-100 hover:bg-row-hover"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Scope is stated and changeable, so the user always knows what the answer is about. */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-line px-6 py-2.5">
        <Eyebrow tone="brand">Scope</Eyebrow>
        <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">{subject.subject}</span>
        <Link
          href="/profile"
          onClick={closeAssistant}
          className="text-[13px] font-semibold text-brand-text hover:underline"
        >
          Change
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {thread.length === 0 && !ask.isPending && !error && (
          <p className="text-[14px] leading-relaxed text-ink-body">
            Answers use your connected evidence and this object only. The assistant can suggest
            changes but cannot write them.
          </p>
        )}

        <div className="flex flex-col gap-5">
          {thread.map((message) =>
            message.role === "user" ? (
              <div key={message.id}>
                <Eyebrow>You</Eyebrow>
                <p className="mt-1.5 text-[15px] leading-relaxed font-semibold text-ink">
                  {message.text}
                </p>
              </div>
            ) : (
              <div key={message.id}>
                <Eyebrow>REACH</Eyebrow>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-body">
                  {message.text}
                </p>

                {message.citations && message.citations.length > 0 && (
                  <div className="mt-3">
                    <Eyebrow tone="sage">Based on</Eyebrow>
                    <ul className="mt-1.5 flex flex-col gap-1.5">
                      {message.citations.map((citation, i) => (
                        <li key={i} className="border-b border-hairline py-2 last:border-b-0">
                          <span className="text-sm text-ink-body">
                            <span className="font-medium text-sage-text">{citation.title}</span>
                            {" · "}
                            {citation.detail}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Answers end in product actions, not more conversation. */}
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.actions.map((action) => (
                      <Link
                        key={action.label}
                        href={action.href}
                        onClick={closeAssistant}
                        className={cn(
                          "inline-flex min-h-[46px] items-center rounded-[10px] px-4 text-[14px] font-semibold",
                          action.tone === "primary"
                            ? "bg-brand text-surface hover:bg-brand-hover"
                            : "border-[1.5px] border-control bg-surface text-brand-text hover:bg-brand-tint",
                        )}
                      >
                        {action.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ),
          )}

          {/* Loading is a skeleton at answer geometry plus a mono status naming what it reads. */}
          {ask.isPending && (
            <div>
              <span className="tnum font-mono text-meta text-ink-muted">
                Reading your evidence · 3 sources
              </span>
              <div className="mt-2.5 flex flex-col gap-2">
                <Skeleton className="h-[13px] w-full" />
                <Skeleton className="h-[13px] w-[92%]" />
                <Skeleton className="h-[13px] w-[76%]" />
              </div>
            </div>
          )}

          {/* Errors name the engine, confirm nothing changed, and offer the fallback. */}
          {error && (
            <div
              role="alert"
              className="rounded-[12px] border-2 border-terracotta-line bg-terracotta-tint p-4"
            >
              <p className="text-[14px] leading-relaxed text-ink-body">
                Could not reach the engine.{" "}
                <span className="font-semibold text-terracotta-text">{error.engine}</span>{" "}
                {error.detail}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => submit(thread[thread.length - 1]?.text ?? "")}
                >
                  Retry
                </Button>
                <Button size="sm" variant="ghost" className="px-2">
                  Use {error.fallback} instead
                </Button>
              </div>
            </div>
          )}
        </div>

        {!ask.isPending && suggestions.data && suggestions.data.length > 0 && (
          <div className="mt-6">
            <Eyebrow>Suggested for this page</Eyebrow>
            <ul className="mt-2 flex flex-col gap-1.5">
              {suggestions.data.map((question) => (
                <li key={question}>
                  <button
                    type="button"
                    onClick={() => submit(question)}
                    className="flex min-h-[44px] w-full items-center rounded-[10px] border border-line bg-canvas px-3.5 text-left text-[13.5px] leading-snug text-ink-body transition-colors duration-100 hover:bg-row-hover hover:text-ink"
                  >
                    {question}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <footer className="shrink-0 border-t border-line px-5 py-3.5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit(draft);
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Ask about ${subject.label.replace(/^Ask about /, "")}…`}
            aria-label="Ask REACH about this object"
          />
          <Button
            type="submit"
            aria-label="Send"
            disabled={!draft.trim() || ask.isPending}
            reason="Type a question first"
            className="w-[46px] px-0"
          >
            →
          </Button>
        </form>
        <p className="mt-2 text-[12px] leading-snug text-ink-muted">
          Suggested CV changes still go through accept / reject.
        </p>
      </footer>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onClose={closeAssistant} label="Ask REACH" height="78%">
        <SheetGrip />
        {body}
      </Sheet>
    );
  }

  return (
    <Drawer open={open} onClose={closeAssistant} label="Ask REACH">
      {body}
    </Drawer>
  );
}

/**
 * The entry point is a labelled control in the page's action row, never a floating bubble
 * and never open on load. Its label names the current object.
 */
export function AssistantEntry({ className }: { className?: string }) {
  const { openAssistant, subject } = useAssistant();
  return (
    <button
      type="button"
      onClick={openAssistant}
      className={cn(
        "inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-control bg-surface px-3 text-sm font-medium text-ink-body transition-colors duration-100 hover:bg-surface-sunken hover:text-ink",
        className,
      )}
    >
      {subject.label}
      <kbd className="tnum hidden font-mono text-meta text-ink-disabled sm:inline">⌘K</kbd>
    </button>
  );
}
