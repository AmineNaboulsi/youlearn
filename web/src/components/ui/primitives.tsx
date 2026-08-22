import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

/* -----------------------------------------------------------------------------
 * Surfaces
 * -------------------------------------------------------------------------- */

export function Card({
  className,
  children,
  ...props
}: { children: ReactNode } & ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface",
        // The hairline lift on hover is the only "effect" in the system; it
        // signals interactivity without introducing a second colour.
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("border-b border-line px-5 py-4", className)}>{children}</div>;
}

export function CardTitle({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <h2 className={cn("text-[15px] font-semibold tracking-[-0.01em] text-ink", className)}>
      {children}
    </h2>
  );
}

export function CardDescription({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <p className={cn("mt-1 text-[13px] leading-relaxed text-ink-muted", className)}>{children}</p>;
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

/* -----------------------------------------------------------------------------
 * Text
 * -------------------------------------------------------------------------- */

export function PageHeading({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-none flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Badges
 * -------------------------------------------------------------------------- */

type BadgeTone = "default" | "solid" | "outline" | "muted" | "success" | "danger" | "warning";

const badgeTones: Record<BadgeTone, string> = {
  default: "bg-surface-sunk text-ink-soft border-line",
  solid: "bg-ink text-white border-ink",
  outline: "bg-transparent text-ink border-ink",
  muted: "bg-transparent text-ink-muted border-line",

  // State tones. Every one of these is paired with a word ("Published",
  // "Failed") rather than standing alone, so the hue is reinforcement and
  // never the only thing carrying the meaning.
  success: "bg-positive-soft text-positive-strong border-positive/30",
  danger: "bg-danger-soft text-danger-strong border-danger/30",
  warning: "bg-warning-soft text-warning-strong border-warning/30",
};

export function Badge({
  tone = "default",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * A state indicator that reads without colour, and faster with it.
 *
 * Filled for "on" and hollow for "off", so the distinction survives greyscale
 * printing and colour blindness on its own. Green is layered on top of that
 * shape difference rather than replacing it — it is what makes a column of
 * twenty rows scannable at a glance, which is the one job the monochrome
 * palette was genuinely bad at.
 */
export function StatusDot({ on, className }: { on: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-1.5 rounded-full",
        on ? "bg-positive" : "border border-ink-faint bg-transparent",
        className,
      )}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Messages
 * -------------------------------------------------------------------------- */

type AlertTone = "neutral" | "success" | "danger" | "warning";

const alertTones: Record<AlertTone, { box: string; rule: string; title: string }> = {
  neutral: {
    box: "border-line bg-surface-sunk text-ink-soft",
    rule: "border-l-ink",
    title: "text-ink",
  },
  success: {
    box: "border-positive/25 bg-positive-soft text-positive-strong",
    rule: "border-l-positive",
    title: "text-positive-strong",
  },
  danger: {
    box: "border-danger/25 bg-danger-soft text-danger-strong",
    rule: "border-l-danger",
    title: "text-danger-strong",
  },
  warning: {
    box: "border-warning/25 bg-warning-soft text-warning-strong",
    rule: "border-l-warning",
    title: "text-warning-strong",
  },
};

/**
 * A message about what just happened.
 *
 * `tone` carries severity; `emphasis` adds the left rule that was the only
 * severity signal before there was a palette to spend. Both still work, because
 * most call sites show a notice whose success or failure is not known here —
 * those stay neutral rather than guessing and colouring a success message red.
 *
 * role="alert" for problems, so a screen reader announces them immediately
 * rather than waiting for the user to reach the text; role="status" otherwise,
 * which is polite and does not interrupt.
 */
export function Alert({
  title,
  children,
  tone = "neutral",
  emphasis = "normal",
  className,
}: {
  title?: string;
  children?: ReactNode;
  tone?: AlertTone;
  emphasis?: "normal" | "strong";
  className?: string;
}) {
  const palette = alertTones[tone];
  const urgent = tone === "danger" || tone === "warning";

  return (
    <div
      role={urgent ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-4 py-3 text-[13px] leading-relaxed",
        palette.box,
        (emphasis === "strong" || tone !== "neutral") && cn("border-l-[3px]", palette.rule),
        className,
      )}
    >
      {title ? <p className={cn("mb-0.5 font-medium", palette.title)}>{title}</p> : null}
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line-strong px-6 py-16 text-center">
      {icon ? <div className="mb-4 text-ink-faint">{icon}</div> : null}
      <p className="text-[15px] font-medium text-ink">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Decoration
 * -------------------------------------------------------------------------- */

/** The faint square grid used behind hero and stats sections. */
export function GridBackground({
  className,
  fade = true,
  dense = false,
}: {
  className?: string;
  fade?: boolean;
  dense?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0",
        dense ? "grid-bg-sm" : "grid-bg",
        fade && "mask-radial-fade",
        className,
      )}
    />
  );
}

/** A short horizontal rule used to break up long pages. */
export function Rule({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-line", className)} aria-hidden />;
}
