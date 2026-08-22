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

type BadgeTone = "default" | "solid" | "outline" | "muted";

const badgeTones: Record<BadgeTone, string> = {
  default: "bg-surface-sunk text-ink-soft border-line",
  solid: "bg-ink text-white border-ink",
  outline: "bg-transparent text-ink border-ink",
  muted: "bg-transparent text-ink-muted border-line",
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
 * A state indicator that does not rely on colour.
 *
 * The dot is filled for the "on" state and hollow for the "off" one, so the
 * distinction survives both a monochrome palette and a colour-blind reader.
 */
export function StatusDot({ on, className }: { on: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-1.5 rounded-full",
        on ? "bg-ink" : "border border-ink-faint bg-transparent",
        className,
      )}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Messages
 * -------------------------------------------------------------------------- */

export function Alert({
  title,
  children,
  emphasis = "normal",
  className,
}: {
  title?: string;
  children?: ReactNode;
  emphasis?: "normal" | "strong";
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-lg border border-line bg-surface-sunk px-4 py-3 text-[13px] leading-relaxed text-ink-soft",
        // A left rule carries severity, since the palette has no red to spend.
        emphasis === "strong" && "border-l-[3px] border-l-ink",
        className,
      )}
    >
      {title ? <p className="mb-0.5 font-medium text-ink">{title}</p> : null}
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
