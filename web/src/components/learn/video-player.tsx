"use client";

import type { Dictionary } from "@/lib/i18n/dictionaries";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/cn";

/**
 * The lesson video player.
 *
 * Uses the browser's own `<video controls>` rather than a custom skin: native
 * controls bring keyboard support, captions, picture-in-picture, playback rate
 * and screen-reader labelling for free, and every one of those would otherwise
 * have to be rebuilt badly.
 *
 * What this component adds is the tracking:
 *
 *   - resumes from the last recorded position, once, on first load
 *   - reports position every 10s *while actually playing* — a paused tab
 *     accumulates nothing, which is what makes "watch time" mean watch time
 *   - measures elapsed time from a wall clock rather than from `currentTime`,
 *     so scrubbing forward does not register as having watched
 *   - flushes on pause, on ending, and on the page going away
 */

const REPORT_INTERVAL_MS = 10_000;

export function VideoPlayer({
  lessonId,
  src,
  mimeType,
  poster,
  resumeAt,
  nextLessonId,
  courseId,
  title,
  labels,
}: {
  lessonId: number;
  src: string;
  mimeType: string | null;
  poster?: string | null;
  resumeAt: number;
  nextLessonId: number | null;
  courseId: number;
  title: string;
  /** Server-resolved strings; see the note on CourseForm. */
  labels: Dictionary["player"];
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  /** Wall-clock ms of genuine playback not yet reported. */
  const unreportedMs = useRef(0);
  /** When the current playing stretch began, or null when not playing. */
  const playingSince = useRef<number | null>(null);
  const hasResumed = useRef(false);

  const [error, setError] = useState<string | null>(null);
  const [showResumed, setShowResumed] = useState(false);

  /** Fold any elapsed playing time into the pending total. */
  const settle = useCallback(() => {
    if (playingSince.current === null) return;
    unreportedMs.current += Date.now() - playingSince.current;
    playingSince.current = Date.now();
  }, []);

  const report = useCallback(
    (options: { beacon?: boolean } = {}) => {
      const video = videoRef.current;
      if (!video) return;

      settle();

      const deltaSeconds = Math.round(unreportedMs.current / 1000);
      unreportedMs.current -= deltaSeconds * 1000;

      const payload = JSON.stringify({
        position_seconds: Math.floor(video.currentTime),
        watched_delta_seconds: deltaSeconds,
      });

      const url = `/api/lessons/${lessonId}/progress`;

      if (options.beacon && typeof navigator.sendBeacon === "function") {
        // The only thing that survives the page being closed.
        navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
        return;
      }

      void fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {
        // A dropped report costs at most ten seconds of recorded time. Retrying
        // would risk double-counting, and interrupting playback to say so would
        // be worse than the loss.
      });
    },
    [lessonId, settle],
  );

  // --- resume ---------------------------------------------------------------
  useEffect(() => {
    const video = videoRef.current;
    if (!video || resumeAt <= 0) return;

    const onLoaded = () => {
      if (hasResumed.current) return;
      hasResumed.current = true;

      // Don't drop someone back at the very end of a lesson they finished;
      // restarting is more useful than resuming at 99%.
      if (resumeAt < video.duration - 5) {
        video.currentTime = resumeAt;
        setShowResumed(true);
      }
    };

    video.addEventListener("loadedmetadata", onLoaded);
    return () => video.removeEventListener("loadedmetadata", onLoaded);
  }, [resumeAt]);

  // --- periodic reporting ---------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      if (playingSince.current !== null) report();
    }, REPORT_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [report]);

  // --- flush when the page goes away ---------------------------------------
  useEffect(() => {
    const onHide = () => report({ beacon: true });

    // pagehide rather than beforeunload: it fires on mobile Safari and on
    // back/forward-cache navigations, which beforeunload does not.
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      report({ beacon: true });
    };
  }, [report]);

  // --- player events --------------------------------------------------------
  const onPlay = () => {
    playingSince.current = Date.now();
  };

  const onPause = () => {
    settle();
    playingSince.current = null;
    report();
  };

  const onEnded = () => {
    settle();
    playingSince.current = null;
    report();

    // Refresh so the sidebar tick and the course progress bar update without a
    // manual reload — the server is the source of truth for both.
    router.refresh();
  };

  return (
    <div className="grid gap-3">
      <div className="relative overflow-hidden rounded-card border border-line bg-ink">
        <video
          ref={videoRef}
          className="aspect-video w-full bg-ink"
          controls
          playsInline
          preload="metadata"
          poster={poster ?? undefined}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          onError={() =>
            setError(
              labels.couldNotPlay,
            )
          }
          aria-label={title}
        >
          <source src={src} type={mimeType ?? undefined} />
          Your browser cannot play this video.
        </video>
      </div>

      {error ? (
        <p className="rounded-lg border border-l-[3px] border-line border-l-ink bg-surface-sunk px-4 py-3 text-[13px] text-ink-soft">
          {error}
        </p>
      ) : null}

      {showResumed && !error ? (
        <p className={cn("text-[12px] text-ink-muted")}>
          Resumed where you left off.{" "}
          <button
            type="button"
            className="underline decoration-line-strong underline-offset-2 hover:text-ink hover:decoration-ink"
            onClick={() => {
              const video = videoRef.current;
              if (video) video.currentTime = 0;
              setShowResumed(false);
            }}
          >
            Start from the beginning
          </button>
        </p>
      ) : null}

      {nextLessonId !== null ? (
        <p className="text-[12px] text-ink-muted">
          When you finish, the next lesson is one click away in the list.{" "}
          <a
            href={`/learn/${courseId}/${nextLessonId}`}
            className="font-medium text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink"
          >
            Skip ahead
          </a>
        </p>
      ) : null}
    </div>
  );
}
