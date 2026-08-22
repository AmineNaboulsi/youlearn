import "server-only";

import { env } from "@/lib/env";
import { getSession } from "@/lib/auth/current-user";

/**
 * Server-side client for the YouLearn API.
 *
 * Two properties this module exists to guarantee:
 *
 *   - The access token never leaves the server. Every call originates from a
 *     server component or a server action, so the browser never holds a
 *     credential and there is no token for an XSS to steal.
 *
 *   - Nothing is cached. `cache: "no-store"` on every request, and callers
 *     render on demand. Course data is cheap; serving one user a page built
 *     from another user's response is not.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isRateLimited() {
    return this.status === 429;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Send the caller's bearer token. Defaults to true when a session exists. */
  authenticated?: boolean;
  /** Return null instead of throwing on 404 — for optional lookups. */
  nullOn404?: boolean;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { response, payload } = await call(path, options);

  if (!response.ok) {
    throw toError(response, payload);
  }

  return payload as T;
}

/** As api(), but resolves to null on a 404 rather than throwing. */
export async function apiOrNull<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
  const { response, payload } = await call(path, options);

  if (response.status === 404) return null;
  if (!response.ok) throw toError(response, payload);

  return payload as T;
}

/**
 * Fetch a CSV export and hand back the bytes plus the metadata headers the API
 * uses to describe it (row count, truncation, whether personal data was masked).
 */
export async function apiCsv(
  path: string,
  query?: RequestOptions["query"],
): Promise<{ csv: string; rows: number; truncated: boolean; masked: boolean; filename: string }> {
  const session = await getSession();

  const response = await fetch(buildUrl(path, query), {
    headers: {
      Accept: "text/csv",
      ...(session ? { Authorization: `Bearer ${session.accessToken}` } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw toError(response, payload);
  }

  const disposition = response.headers.get("content-disposition") ?? "";
  const match = /filename="([^"]+)"/.exec(disposition);

  return {
    csv: await response.text(),
    rows: Number(response.headers.get("x-export-rows") ?? "0"),
    truncated: response.headers.get("x-export-truncated") === "true",
    masked: response.headers.get("x-export-masked") !== "false",
    filename: match?.[1] ?? "youlearn-export.csv",
  };
}

// -----------------------------------------------------------------------------

async function call(path: string, options: RequestOptions) {
  const { method = "GET", body, query, authenticated } = options;

  const session = authenticated === false ? null : await getSession();

  const headers: Record<string, string> = { Accept: "application/json" };
  if (session) headers.Authorization = `Bearer ${session.accessToken}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      // A slow API should surface as an error page, not a request that hangs
      // until the platform's own timeout kills it with no explanation.
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    // Network failure, DNS failure or the 15s timeout above. The caller gets a
    // 503 either way; the underlying reason is never useful to an end user and
    // could disclose internal hostnames.
    throw new ApiError(
      503,
      "api_unreachable",
      "The service is not responding. Please try again in a moment.",
    );
  }

  const payload =
    response.status === 204 ? null : await response.json().catch(() => null);

  return { response, payload };
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${env.apiUrl}${path.startsWith("/") ? path : `/${path}`}`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function toError(response: Response, payload: unknown): ApiError {
  const body = (payload ?? {}) as {
    error?: string;
    message?: string;
    fields?: Record<string, string>;
    retry_after_seconds?: number;
  };

  return new ApiError(
    response.status,
    body.error ?? "request_failed",
    body.message ?? "Something went wrong.",
    body.fields,
    body.retry_after_seconds,
  );
}
