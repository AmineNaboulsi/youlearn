"use client";

import { useEffect } from "react";

/**
 * Route-level error boundary.
 *
 * Renders the digest, not the message. Next replaces the real error text with a
 * digest in production precisely so internal detail does not reach a browser,
 * and printing `error.message` here would undo that in development habits that
 * then ship. The digest is enough to find the matching server log line.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[youlearn] render error", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center px-6 text-center">
      <span className="grid size-9 place-items-center rounded-md bg-ink text-[15px] font-bold text-white">
        Y
      </span>

      <h1 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-ink">
        Something went wrong
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">
        The page could not be rendered. Trying again often clears it — if it does not, the service
        may be briefly unavailable.
      </p>

      {error.digest ? (
        <p className="mt-6 rounded-md border border-line bg-surface-sunk px-3 py-1.5 font-mono text-[12px] text-ink-muted">
          Reference: {error.digest}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center rounded-lg border border-ink bg-ink px-4 text-sm font-medium text-white transition-colors hover:bg-ink-strong"
        >
          Try again
        </button>
        {/* A hard navigation, not <Link>: this boundary catches render errors,
            and the client router may be part of what went wrong. A full page
            load is the one escape hatch guaranteed to work. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="inline-flex h-10 items-center rounded-lg border border-line-strong px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-sunk"
        >
          Back to home
        </a>
      </div>
    </div>
  );
}
