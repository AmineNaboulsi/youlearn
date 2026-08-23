"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

/**
 * The shareable address, with a copy button.
 *
 * `navigator.clipboard` is unavailable on insecure origins and can be refused
 * by permission policy, so the URL is always shown as selectable text and the
 * button is an accelerator rather than the only way to get at it. When the copy
 * fails the input is selected instead, which leaves the person one keystroke
 * from the same result rather than looking at a button that did nothing.
 */
export function ShareLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Without this, unmounting while the "Copied" label is up leaves a timer
  // holding a setState on a component that no longer exists.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      inputRef.current?.select();
    }
  };

  return (
    <div className="grid gap-1.5">
      <span className="text-[13px] font-medium text-ink-soft">Share this link</span>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          readOnly
          value={url}
          onFocus={(event) => event.target.select()}
          aria-label="Your public profile address"
          className="min-w-0 flex-1 rounded-lg border border-line-strong bg-surface-sunk px-3 py-2 font-mono text-[12px] text-ink-soft outline-none focus:border-ink"
        />

        <button
          type="button"
          onClick={() => void copy()}
          className={cn(
            "h-auto flex-none rounded-lg border px-3 text-[13px] font-medium transition-colors",
            copied
              ? "border-ink bg-ink text-surface"
              : "border-line-strong bg-surface text-ink hover:border-ink-faint hover:bg-surface-sunk",
          )}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Announced politely so a screen reader confirms the copy without the
          visual-only label being the sole feedback. */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Link copied to the clipboard." : ""}
      </span>
    </div>
  );
}
