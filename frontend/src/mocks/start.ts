/**
 * Starting the mock network is a module-level singleton: React runs effects twice in development
 * StrictMode, and MSW refuses to configure an already-enabled network.
 *
 * The service worker is preferred — it intercepts at the network layer, so DevTools shows the
 * real requests. It needs a secure origin, so opening the dev server from a phone on the same
 * network falls back to running the same handlers against a patched `fetch`.
 */
let started: Promise<void> | null = null;

function canUseServiceWorker(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    window.isSecureContext
  );
}

export function startMocks(): Promise<void> {
  if (!started) {
    started = (async () => {
      if (canUseServiceWorker()) {
        try {
          const { worker } = await import("./browser");
          await worker.start({ onUnhandledRequest: "bypass", quiet: true });
          return;
        } catch {
          // A refused registration is not fatal — the fallback covers it.
        }
      }
      const { installFetchFallback } = await import("./fallback");
      installFetchFallback();
    })();
  }
  return started;
}
