import type { DefaultBodyType, StrictRequest } from "msw";
import { handlers } from "./handlers";

/**
 * A service worker only registers on a secure origin, which means `localhost`
 * or HTTPS. Opening the dev server from a phone on the same network is neither,
 * so the worker never starts and every request escapes to a 404.
 *
 * This runs the same handlers against a patched `fetch` instead. It is the mock
 * layer talking to itself — `src/lib/api` and every component are untouched, and
 * deleting `src/mocks` still removes the whole thing in one step.
 */
let requestCount = 0;

export function installFetchFallback(): void {
  const original = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const request = new Request(
      input instanceof Request ? input : new URL(String(input), location.href),
      init,
    );

    // Only our own API is mocked. Everything else — assets, HMR — goes through.
    const url = new URL(request.url);
    if (url.origin !== location.origin || !url.pathname.startsWith("/api")) {
      return original(input as RequestInfo, init);
    }

    const requestId = `fallback-${++requestCount}`;
    for (const handler of handlers) {
      const result = await handler.run({
        request: request as StrictRequest<DefaultBodyType>,
        requestId,
      });
      if (result?.response) return result.response;
    }

    return original(input as RequestInfo, init);
  };
}
