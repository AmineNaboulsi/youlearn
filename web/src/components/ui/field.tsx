import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Form controls.
 *
 * Errors are rendered as text tied to the input by aria-describedby and marked
 * with aria-invalid, never as a colour change — the palette has no red, and a
 * colour-only error is unreadable to a good share of users regardless.
 */

const controlBase =
  "w-full rounded-lg border bg-surface text-sm text-ink placeholder:text-ink-faint " +
  "transition-colors duration-150 outline-none " +
  "hover:border-ink-faint focus:border-ink " +
  "disabled:cursor-not-allowed disabled:bg-surface-sunk disabled:text-ink-muted";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-soft">
        {label}
        {required ? (
          <span className="ml-1 text-ink-muted" aria-hidden>
            *
          </span>
        ) : null}
      </label>

      {children}

      {error ? (
        <p id={`${htmlFor}-error`} className="text-[12px] font-medium text-ink">
          <span className="text-ink-muted">— </span>
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[12px] leading-relaxed text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Input({ className, error, ...props }: ComponentProps<"input"> & { error?: boolean }) {
  return (
    <input
      className={cn(
        controlBase,
        "h-10 px-3",
        error ? "border-ink bg-surface-sunk" : "border-line-strong",
        className,
      )}
      aria-invalid={error || undefined}
      {...props}
    />
  );
}

export function Textarea({
  className,
  error,
  ...props
}: ComponentProps<"textarea"> & { error?: boolean }) {
  return (
    <textarea
      className={cn(
        controlBase,
        "min-h-28 resize-y px-3 py-2.5 leading-relaxed",
        error ? "border-ink bg-surface-sunk" : "border-line-strong",
        className,
      )}
      aria-invalid={error || undefined}
      {...props}
    />
  );
}

export function Select({
  className,
  error,
  children,
  ...props
}: ComponentProps<"select"> & { error?: boolean }) {
  return (
    <div className="relative">
      <select
        className={cn(
          controlBase,
          "h-10 appearance-none px-3 pr-9",
          error ? "border-ink bg-surface-sunk" : "border-line-strong",
          className,
        )}
        aria-invalid={error || undefined}
        {...props}
      >
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function Checkbox({
  label,
  description,
  className,
  ...props
}: ComponentProps<"input"> & { label: string; description?: string }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2.5", className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-4 flex-none rounded border-line-strong accent-ink"
        {...props}
      />
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-ink">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-muted">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  );
}
