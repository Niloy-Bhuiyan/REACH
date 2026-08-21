/**
 * The one place the frontend talks to a network.
 *
 * Components never call `fetch`. Swapping MSW for the production backend is a change to
 * `NEXT_PUBLIC_API_BASE` and nothing else.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Json = Record<string, unknown> | unknown[];

async function request<T>(
  method: string,
  path: string,
  body?: Json,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let code = "unknown";
    let message = res.statusText || "Request failed";
    try {
      const payload = (await res.json()) as { code?: string; message?: string };
      code = payload.code ?? code;
      message = payload.message ?? message;
    } catch {
      /* body was not JSON — keep the status text */
    }
    throw new ApiError(res.status, code, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const http = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: Json) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: Json) => request<T>("PATCH", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
};

/** Build a query string, dropping empty values so URLs stay readable in DevTools. */
export function qs(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === "all") continue;
    search.set(key, String(value));
  }
  const out = search.toString();
  return out ? `?${out}` : "";
}
