"use client";

import type { Dictionary } from "@/lib/i18n/dictionaries";
import { interpolate } from "@/lib/i18n/plural";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/cn";

/**
 * Re-renders the surrounding server component on an interval.
 *
 * `router.refresh()` re-runs the page on the server and swaps in the new
 * output, so the figures come from a fresh database query every time — there
 * is no client-side cache to go stale and no counter drifting out of step.
 *
 * Refreshing pauses while the tab is hidden. A dashboard left open on a second
 * monitor overnight would otherwise issue thousands of pointless queries, and
 * the numbers nobody is looking at do not need to be current.
 */
export function AutoRefresh({
  intervalMs = 15_000,
  generatedAt,
  labels,
}: {
  intervalMs?: number;
  generatedAt: string;
  /** Server-resolved strings; see the note on CourseForm. */
  labels: Dictionary["autoRefresh"];
}) {
  const router = useRouter();
  const [paused, setPaused] = useState(false);

  const [age, tick] = useState(0);

  useEffect(() => {
    const onVisibility = () => {
      const hidden = document.visibilityState === "hidden";
      setPaused(hidden);
      // Coming back to the tab should show current numbers immediately, not
      // whatever was true when it was last focused.
      if (!hidden) router.refresh();
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [router]);

  useEffect(() => {
    if (paused) return;

    const timer = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(timer);
  }, [paused, intervalMs, router]);

  // Seconds since this render's data was fetched.
  //
  // Measured from when the effect started rather than by reading the clock
  // during render — the latter is an impure call that makes a render's output
  // depend on when it happened. `generatedAt` is the effect's key, so a
  // refreshed page restarts the count from zero.
  useEffect(() => {
    const startedAt = Date.now();

    const timer = setInterval(() => {
      tick(Math.round((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [generatedAt]);

  return (
    <span className="inline-flex items-center gap-2 text-[12px] text-ink-muted">
      <span
        aria-hidden
        className={cn(
          "size-1.5 rounded-full",
          paused ? "border border-ink-faint" : "animate-pulse bg-ink",
        )}
      />
      {paused ? labels.paused : interpolate(labels.updated, { seconds: age })}
      <button
        type="button"
        onClick={() => router.refresh()}
        className="underline decoration-line-strong underline-offset-2 transition-colors hover:text-ink hover:decoration-ink"
      >
        Refresh now
      </button>
    </span>
  );
}
