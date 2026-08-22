import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * The one button in the system.
 *
 * Four variants, all monochrome. Hierarchy comes from fill and border weight
 * rather than colour, which is what keeps a page with three actions on it
 * readable when none of them are allowed to be blue.
 */

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium " +
  "transition-[background-color,border-color,color,transform] duration-150 " +
  "active:translate-y-px disabled:pointer-events-none disabled:opacity-40 " +
  "whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink-strong border border-ink",
  secondary:
    "bg-surface text-ink border border-line-strong hover:bg-surface-sunk hover:border-ink-faint",
  ghost: "bg-transparent text-ink-soft hover:bg-surface-sunk hover:text-ink border border-transparent",
  // "Danger" without red: a destructive action is marked by inverting to solid
  // ink on hover, which reads as weight rather than as an error state.
  danger:
    "bg-surface text-ink border border-ink-ghost hover:bg-ink hover:text-white hover:border-ink",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: CommonProps & ComponentProps<"button">) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </Link>
  );
}
