import Link from "next/link";

import { cn } from "@/lib/cn";

/** The wordmark. A glyph tile plus the name — no image asset to load. */
export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2 text-ink", className)}
      aria-label="YouLearn home"
    >
      <span className="grid size-7 place-items-center rounded-md bg-ink text-[13px] font-bold tracking-[-0.02em] text-white">
        Y
      </span>
      <span className="text-[15px] font-semibold tracking-[-0.02em]">YouLearn</span>
    </Link>
  );
}
