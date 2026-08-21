"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { useEffect, useState } from "react";
import { AssistantProvider } from "@/components/assistant/AssistantProvider";
import { AppShell } from "@/components/shell/AppShell";

/**
 * The one place the mock layer is wired. Deleting `src/mocks` and pointing
 * `NEXT_PUBLIC_API_BASE` at a real server is the whole migration — no component changes.
 */
const USE_MOCKS = !process.env.NEXT_PUBLIC_API_BASE;

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(makeClient);
  const [ready, setReady] = useState(!USE_MOCKS);

  useEffect(() => {
    if (!USE_MOCKS) return;
    let cancelled = false;
    void import("@/mocks/start").then(({ startMocks }) =>
      startMocks().then(() => {
        if (!cancelled) setReady(true);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing queries until the network is intercepted, so no request escapes to a 404.
  if (!ready) return null;

  return (
    <QueryClientProvider client={client}>
      {/* Reduced motion is honoured globally, not per component. */}
      <MotionConfig reducedMotion="user">
        <AssistantProvider>
          <AppShell>{children}</AppShell>
        </AssistantProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
