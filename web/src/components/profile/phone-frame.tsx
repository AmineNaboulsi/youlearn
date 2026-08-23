"use client";

import { cn } from "@/lib/cn";
import type { ProfileTheme } from "@/lib/api/types";

/**
 * A phone, drawn in CSS, with a real page inside it.
 *
 * The frame is not decoration. Its inner viewport is an honest CSS width — 393
 * CSS pixels for an iPhone 15 — and the profile inside it is a container query
 * away from knowing that. So what an instructor sees here is the layout a
 * visitor on that handset gets, produced by the same component and the same
 * breakpoints, not a narrowed-down approximation of it.
 *
 * Deliberately not an iframe. An iframe would need a route to point at, which
 * means the preview could only ever show *saved* state — and the whole point is
 * to see an unsaved change immediately. Rendering the component in place costs
 * nothing and stays live as the form is typed into.
 *
 * The chrome is drawn in the platform's own tokens rather than mimicking iOS or
 * Android. A pixel-accurate replica of somebody else's operating system would
 * be a claim this preview cannot honour — fonts, safe areas and system UI all
 * differ — and it would date badly. This says "phone", and is truthful about
 * the one thing that matters, which is the width.
 */

export const DEVICES = {
  "iphone-15": { label: "iPhone 15", width: 393, height: 720, radius: 44, island: true },
  "iphone-se": { label: "iPhone SE", width: 375, height: 667, radius: 30, island: false },
  "pixel-8": { label: "Pixel 8", width: 412, height: 730, radius: 34, island: false },
} as const;

export type DeviceKey = keyof typeof DEVICES;

export function PhoneFrame({
  device,
  theme,
  /** Shown in the fake address bar, so the share URL is visible in context. */
  addressLabel,
  children,
  className,
}: {
  device: DeviceKey;
  theme: ProfileTheme;
  addressLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const spec = DEVICES[device];

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div
        // The bezel. `p-[10px]` is the physical border; the ring is the glass edge.
        className="relative bg-ink p-[10px] shadow-[0_24px_60px_-24px_rgba(10,10,10,0.45)]"
        style={{ borderRadius: spec.radius, width: spec.width + 20 }}
      >
        {/* Side buttons, purely so the shape reads as a handset rather than a box. */}
        <span
          aria-hidden
          className="absolute -left-[3px] top-[110px] h-14 w-[3px] rounded-l-sm bg-ink-soft"
        />
        <span
          aria-hidden
          className="absolute -right-[3px] top-[92px] h-9 w-[3px] rounded-r-sm bg-ink-soft"
        />

        <div
          // Everything below inherits the profile palette from this attribute.
          // The editor page around it stays light regardless of what is chosen.
          data-profile-theme={theme}
          className="relative flex flex-col overflow-hidden bg-surface"
          style={{ borderRadius: spec.radius - 10, width: spec.width, height: spec.height }}
        >
          <StatusBar island={spec.island} />

          {addressLabel ? <AddressBar label={addressLabel} /> : null}

          {/* The viewport. Sized by flex rather than by subtracting the chrome's
              height from the device's: the chrome is text, text reflows, and a
              hardcoded offset would be wrong the first time a font changed.
              It scrolls exactly as the real page would, which is how an
              instructor finds out their bio is three screens long. */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-10">
            {children}
          </div>

          <HomeIndicator />
        </div>
      </div>

      <p className="text-[11px] text-ink-muted">
        {spec.label} · {spec.width} × {spec.height}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function StatusBar({ island }: { island: boolean }) {
  return (
    <div className="relative flex h-[38px] items-center justify-between px-5 text-ink">
      <span className="text-[12px] font-semibold tabular">9:41</span>

      {island ? (
        // A literal rather than a token, and the one place in this file that
        // gets one: the cutout is a hole in the hardware, not part of the page,
        // so it must not invert with the theme. On the dark palette it
        // disappears into the screen — which is exactly what the real one does.
        <span
          aria-hidden
          className="absolute left-1/2 top-2 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-[#0a0a0a]"
        />
      ) : null}

      <span aria-hidden className="flex items-center gap-1">
        <SignalBars />
        <Battery />
      </span>
    </div>
  );
}

function AddressBar({ label }: { label: string }) {
  return (
    <div className="border-b border-line px-3 pb-2">
      <div className="flex items-center gap-1.5 rounded-lg bg-surface-sunk px-2.5 py-1.5">
        <LockIcon />
        <span className="truncate text-[11px] text-ink-muted" dir="ltr">
          {label}
        </span>
      </div>
    </div>
  );
}

function HomeIndicator() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-ink opacity-30"
    />
  );
}

function SignalBars() {
  return (
    <svg viewBox="0 0 18 12" className="h-2.5 w-4 text-ink" fill="currentColor" aria-hidden>
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
      <rect x="10" y="3" width="3" height="9" rx="1" />
      <rect x="15" y="0" width="3" height="12" rx="1" opacity="0.35" />
    </svg>
  );
}

function Battery() {
  return (
    <svg viewBox="0 0 26 12" className="h-2.5 w-5 text-ink" aria-hidden>
      <rect
        x="0.5"
        y="0.5"
        width="21"
        height="11"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.4"
      />
      <rect x="2" y="2" width="15" height="8" rx="1.5" fill="currentColor" />
      <path d="M23.5 4v4a2 2 0 0 0 0-4Z" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 12 14"
      aria-hidden
      className="size-2.5 flex-none text-ink-faint"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <rect x="1" y="6" width="10" height="7" rx="2" />
      <path d="M3.5 6V4a2.5 2.5 0 0 1 5 0v2" strokeLinecap="round" />
    </svg>
  );
}
