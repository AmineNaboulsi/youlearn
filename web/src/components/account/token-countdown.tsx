"use client";

import { useEffect, useState } from "react";

import { interpolate } from "@/lib/i18n/plural";

/**
 * Time until the access token renews.
 *
 * A client component because it is a *live* value: rendering it once on the
 * server would show a number that is already stale by the time it is read, and
 * calling Date.now() during a render is exactly the impurity the React
 * compiler warns about. Here it ticks, which is what a countdown should do.
 *
 * Renders nothing until mounted, so the server and the first client render
 * agree and there is no hydration mismatch.
 *
 * Its three strings arrive as props. The dictionary is server-side only, and
 * shipping a lookup here would mean sending all three languages to the browser
 * to render one line.
 */
export function TokenCountdown({
  expiresAt,
  labels,
}: {
  expiresAt: string;
  labels: { renewingNow: string; seconds: string; minutesSeconds: string };
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(expiresAt).getTime();

    const tick = () => setRemaining(Math.max(0, Math.floor((target - Date.now()) / 1000)));

    tick();
    const timer = setInterval(tick, 15_000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  if (remaining === null) {
    return <span className="text-ink-muted">—</span>;
  }

  return <span className="tabular">{describe(remaining, labels)}</span>;
}

function describe(
  seconds: number,
  labels: { renewingNow: string; seconds: string; minutesSeconds: string },
): string {
  if (seconds <= 0) return labels.renewingNow;
  if (seconds < 60) return interpolate(labels.seconds, { count: seconds });

  return interpolate(labels.minutesSeconds, {
    minutes: Math.floor(seconds / 60),
    seconds: seconds % 60,
  });
}
