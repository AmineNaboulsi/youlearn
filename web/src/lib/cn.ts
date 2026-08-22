import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names, letting later Tailwind utilities win over earlier ones.
 *
 * Without twMerge, `cn("px-4", props.className)` silently ignores a caller's
 * `px-6` depending on stylesheet order. With it, the caller always wins.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
