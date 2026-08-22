"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring } from "motion/react";

import { cn } from "@/lib/cn";

/**
 * A counter that animates from zero to its value when it scrolls into view.
 *
 * The rendered text is written straight to the DOM node rather than through
 * React state, so sixty frames a second of animation do not cause sixty
 * renders. The element also carries the final value as its accessible label,
 * so a screen reader announces "1,284" once instead of narrating the count.
 *
 * The value is server-rendered into the node's initial text, which means it is
 * correct before hydration and correct forever if JavaScript never arrives.
 */
export function NumberTicker({
  value,
  suffix = "",
  prefix = "",
  className,
  durationMs = 1400,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  durationMs?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-15% 0px" });

  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    // Tuned so the last digits settle rather than snap; damping is high enough
    // that the number never overshoots past its real value, which would read
    // as wrong data for a frame.
    damping: 38,
    stiffness: 90,
    duration: durationMs,
  });

  useEffect(() => {
    if (!inView) return;

    // Read the preference here rather than holding it in state: it is an
    // external system, and mirroring it into React would mean a setState
    // inside an effect for a value the render output never depends on.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const unsubscribe = spring.on("change", (latest) => {
      if (!ref.current) return;
      ref.current.textContent = prefix + format(Math.round(latest)) + suffix;
    });

    motionValue.set(value);

    return unsubscribe;
  }, [inView, motionValue, spring, value, prefix, suffix]);

  return (
    <span
      ref={ref}
      className={cn("tabular", className)}
      aria-label={`${prefix}${format(value)}${suffix}`}
    >
      {prefix}
      {format(value)}
      {suffix}
    </span>
  );
}

function format(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
