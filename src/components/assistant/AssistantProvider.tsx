"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AssistantScope } from "@/lib/api/types";
import { useKeyboardShortcut } from "@/lib/hooks";
import { AssistantSurface } from "./AssistantSurface";

export interface AssistantSubject {
  scope: AssistantScope;
  id: string | null;
  /** Names the object, so the entry point is the context: "Ask about this job". */
  label: string;
  /** The scope row's readable subject: "This job · Data Analyst at bKash". */
  subject: string;
}

const DEFAULT_SUBJECT: AssistantSubject = {
  scope: "profile",
  id: null,
  label: "Ask REACH",
  subject: "Your evidence record",
};

interface AssistantValue {
  open: boolean;
  subject: AssistantSubject;
  setSubject: (subject: AssistantSubject) => void;
  openAssistant: () => void;
  closeAssistant: () => void;
}

const AssistantContext = createContext<AssistantValue>({
  open: false,
  subject: DEFAULT_SUBJECT,
  setSubject: () => {},
  openAssistant: () => {},
  closeAssistant: () => {},
});

export const useAssistant = () => useContext(AssistantContext);

/**
 * Pages declare the object the assistant would be about. The assistant itself stays closed —
 * it is summoned from a page, never opened on load.
 */
export function useAssistantSubject(subject: AssistantSubject) {
  const { setSubject } = useAssistant();
  const { scope, id, label, subject: text } = subject;
  useEffect(() => {
    setSubject({ scope, id, label, subject: text });
  }, [scope, id, label, text, setSubject]);
}

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState<AssistantSubject>(DEFAULT_SUBJECT);

  /**
   * The assistant has no route of its own — it is a URL parameter, so a scoped conversation is
   * shareable and restorable without becoming a destination. Read once on mount (rather than via
   * `useSearchParams`) so the whole app is not pushed behind a Suspense boundary.
   */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a scoped conversation from the URL is an external read on mount
    if (new URLSearchParams(window.location.search).has("ask")) setOpen(true);
  }, []);

  const syncUrl = useCallback((next: boolean, scope: AssistantScope) => {
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("ask", scope);
    else url.searchParams.delete("ask");
    window.history.replaceState(null, "", url.toString());
  }, []);

  const openAssistant = useCallback(() => {
    setOpen(true);
    syncUrl(true, subject.scope);
  }, [subject.scope, syncUrl]);

  const closeAssistant = useCallback(() => {
    setOpen(false);
    syncUrl(false, subject.scope);
  }, [subject.scope, syncUrl]);

  // Cmd-K opens the assistant scoped to the current object.
  useKeyboardShortcut("k", () => (open ? closeAssistant() : openAssistant()));

  const value = useMemo(
    () => ({ open, subject, setSubject, openAssistant, closeAssistant }),
    [open, subject, openAssistant, closeAssistant],
  );

  return (
    <AssistantContext.Provider value={value}>
      {children}
      <AssistantSurface />
    </AssistantContext.Provider>
  );
}
