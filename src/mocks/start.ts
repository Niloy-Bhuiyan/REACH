/**
 * Starting the worker is a module-level singleton: React runs effects twice in development
 * StrictMode, and MSW refuses to configure an already-enabled network.
 */
let started: Promise<void> | null = null;

export function startMocks(): Promise<void> {
  if (!started) {
    started = import("./browser").then(({ worker }) =>
      worker.start({ onUnhandledRequest: "bypass", quiet: true }).then(() => undefined),
    );
  }
  return started;
}
