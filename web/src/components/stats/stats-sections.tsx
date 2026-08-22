import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import { GridBackground } from "@/components/ui/primitives";
import { NumberTicker } from "./number-ticker";

/**
 * The two stats-section layouts from the Aceternity blocks set, rebuilt for a
 * monochrome palette:
 *
 *   StatsWithGridBackground — a bordered grid of large figures over the faint
 *     square background. Used on the marketing pages, where the numbers are the
 *     argument.
 *
 *   StatsWithNumberTicker — a titled section whose figures count up as they
 *     enter the viewport. Used on the dashboard, where the numbers change and
 *     the movement draws the eye to what is new.
 *
 * Both are server components; only the ticker itself is interactive, so a page
 * full of stats ships almost no JavaScript.
 */

export interface Stat {
  label: string;
  value: number;
  /** Rendered instead of the number when the figure is not a plain count. */
  display?: string;
  suffix?: string;
  hint?: string;
  icon?: ReactNode;
}

/* -------------------------------------------------------------------------- */

export function StatsWithGridBackground({
  stats,
  className,
}: {
  stats: Stat[];
  className?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden border-y border-line", className)}>
      <GridBackground />

      <div className="relative mx-auto max-w-6xl px-6">
        <dl
          className={cn(
            "grid divide-line",
            // Dividers only appear once the columns actually sit side by side,
            // otherwise a stacked mobile layout gets vertical rules to nowhere.
            "divide-y sm:grid-cols-2 sm:divide-y-0 sm:divide-x",
            stats.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
            stats.length >= 4 ? "" : "sm:[&>*:nth-child(3)]:border-t sm:[&>*:nth-child(3)]:border-line lg:[&>*:nth-child(3)]:border-t-0",
          )}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="px-2 py-12 text-center sm:px-8">
              <dd className="text-4xl font-semibold tracking-[-0.045em] text-ink sm:text-5xl">
                {stat.display ?? (
                  <>
                    <NumberTicker value={stat.value} suffix={stat.suffix ?? ""} />
                  </>
                )}
              </dd>
              <dt className="mt-3 text-[13px] font-medium text-ink-soft">{stat.label}</dt>
              {stat.hint ? (
                <p className="mx-auto mt-1.5 max-w-[22ch] text-[12px] leading-relaxed text-ink-muted">
                  {stat.hint}
                </p>
              ) : null}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */

export function StatsWithNumberTicker({
  eyebrow,
  title,
  description,
  stats,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  stats: Stat[];
  className?: string;
}) {
  return (
    <section className={cn("relative", className)}>
      <div className="relative">
        {eyebrow ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-ink sm:text-2xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{description}</p>
        ) : null}

        <dl className="mt-8 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="relative bg-surface px-5 py-6">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-[12px] font-medium uppercase tracking-[0.1em] text-ink-muted">
                  {stat.label}
                </dt>
                {stat.icon ? <span className="text-ink-faint">{stat.icon}</span> : null}
              </div>

              <dd className="mt-3 text-[32px] font-semibold leading-none tracking-[-0.04em] text-ink">
                {stat.display ?? <NumberTicker value={stat.value} suffix={stat.suffix ?? ""} />}
              </dd>

              {stat.hint ? (
                <p className="mt-2 text-[12px] leading-relaxed text-ink-muted">{stat.hint}</p>
              ) : null}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
