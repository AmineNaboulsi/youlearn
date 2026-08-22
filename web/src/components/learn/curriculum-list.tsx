import Link from "next/link";

import type { CurriculumSection } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/format";

/**
 * The section-by-section contents of a course.
 *
 * Two modes from one component. On the course page it is a table of contents
 * that shows what you would get; inside the player it is the navigation, with
 * the current lesson marked. Keeping it as one component is what stops the two
 * views quietly disagreeing about what a course contains.
 *
 * Locked lessons are still listed, with their title and length. Hiding them
 * would make the course look emptier than it is, which is the opposite of what
 * a locked lesson is for.
 */
export function CurriculumList({
  sections,
  courseId,
  currentLessonId,
  compact = false,
}: {
  sections: CurriculumSection[];
  courseId: number;
  currentLessonId?: number;
  compact?: boolean;
}) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <ol className={cn("grid", compact ? "gap-4" : "gap-px overflow-hidden rounded-card border border-line bg-line")}>
      {sections.map((section, sectionIndex) => (
        <li key={section.id} className={compact ? "" : "bg-surface"}>
          <div
            className={cn(
              "flex items-baseline justify-between gap-3",
              compact ? "px-1 pb-2" : "border-b border-line px-5 py-3.5",
            )}
          >
            <h3 className={cn("font-semibold text-ink", compact ? "text-[13px]" : "text-[14px]")}>
              <span className="mr-2 text-ink-faint">{sectionIndex + 1}.</span>
              {section.title}
            </h3>
            <span className="flex-none text-[11px] text-ink-muted">
              {section.lesson_count} lesson{section.lesson_count === 1 ? "" : "s"}
              {section.duration_seconds > 0 ? ` · ${formatClock(section.duration_seconds)}` : ""}
            </span>
          </div>

          {section.summary && !compact ? (
            <p className="border-b border-line px-5 py-2.5 text-[12px] text-ink-muted">
              {section.summary}
            </p>
          ) : null}

          <ul className={compact ? "grid gap-0.5" : ""}>
            {section.lessons.map((lesson) => {
              const isCurrent = lesson.id === currentLessonId;
              const done = lesson.progress?.completed ?? false;

              const inner = (
                <>
                  <LessonMark done={done} locked={lesson.locked} current={isCurrent} />

                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block truncate text-[13px]",
                        isCurrent ? "font-semibold text-ink" : "text-ink-soft",
                      )}
                    >
                      {lesson.title}
                    </span>
                    {lesson.summary && !compact ? (
                      <span className="mt-0.5 block truncate text-[11px] text-ink-muted">
                        {lesson.summary}
                      </span>
                    ) : null}
                  </span>

                  <span className="flex flex-none items-center gap-2 text-[11px] text-ink-muted">
                    {lesson.is_preview && lesson.locked === false && currentLessonId === undefined ? (
                      <span className="rounded border border-line-strong px-1.5 py-0.5 font-medium">
                        Preview
                      </span>
                    ) : null}
                    {lesson.duration_seconds > 0 ? (
                      <span className="tabular">{formatClock(lesson.duration_seconds)}</span>
                    ) : null}
                  </span>
                </>
              );

              const className = cn(
                "flex items-center gap-3",
                compact ? "rounded-md px-2 py-2" : "px-5 py-3",
                isCurrent && "bg-surface-sunk",
                lesson.locked
                  ? "cursor-not-allowed opacity-60"
                  : "transition-colors hover:bg-surface-sunk",
              );

              return (
                <li key={lesson.id} className={compact ? "" : "border-b border-line last:border-b-0"}>
                  {lesson.locked ? (
                    // A span, not a disabled link: an anchor with no href is
                    // invisible to a keyboard, and a disabled-looking link that
                    // is still focusable is worse than one that is not there.
                    <span className={className} aria-disabled title="Enrol to unlock this lesson">
                      {inner}
                    </span>
                  ) : (
                    <Link
                      href={`/learn/${courseId}/${lesson.id}`}
                      className={className}
                      aria-current={isCurrent ? "true" : undefined}
                    >
                      {inner}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ol>
  );
}

/**
 * Status marker.
 *
 * Shape carries the meaning, not colour: a filled tick for done, a ring for
 * the current lesson, a padlock for locked, a hollow circle for untouched.
 */
function LessonMark({
  done,
  locked,
  current,
}: {
  done: boolean;
  locked: boolean;
  current: boolean;
}) {
  if (done) {
    return (
      <span
        className="grid size-4 flex-none place-items-center rounded-full bg-ink text-white"
        aria-label="Completed"
      >
        <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  if (locked) {
    return (
      <svg
        viewBox="0 0 16 16"
        className="size-4 flex-none text-ink-faint"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        aria-label="Locked"
      >
        <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
        <path d="M5.5 7V5a2.5 2.5 0 015 0v2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <span
      className={cn(
        "size-4 flex-none rounded-full border",
        current ? "border-[3px] border-ink" : "border-ink-ghost",
      )}
      aria-label={current ? "Current lesson" : "Not started"}
    />
  );
}
