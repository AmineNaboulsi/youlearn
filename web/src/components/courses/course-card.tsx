import Link from "next/link";

import type { Course } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { plural } from "@/lib/i18n/plural";
import { getTranslation } from "@/lib/i18n/server";
import { Badge, StatusDot } from "@/components/ui/primitives";
import { CourseThumb } from "./course-thumb";

/**
 * A course in a grid.
 *
 * The whole card is one link. Nested interactive elements inside a card link
 * are a common accessibility trap — a tag chip that is itself a link would be
 * unreachable inside an anchor — so tags render as plain text here and are
 * filterable from the catalogue's own controls instead.
 */
export async function CourseCard({
  course,
  href,
  showState = false,
  className,
}: {
  course: Course;
  href?: string;
  showState?: boolean;
  className?: string;
}) {
  const { locale, t } = await getTranslation();

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-card border border-line bg-surface transition-[border-color,transform] duration-200",
        "hover:-translate-y-0.5 hover:border-ink-faint",
        className,
      )}
    >
      <Link href={href ?? `/courses/${course.id}`} className="block">
        <CourseThumb
          src={course.img}
          coverPublicId={course.cover_public_id}
          title={course.title}
          contentType={course.content_type}
          className="aspect-[16/9]"
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 92vw"
        />

        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            {course.category_name ? (
              <Badge tone="muted">{course.category_name}</Badge>
            ) : null}

            {showState ? (
              <Badge tone={course.is_published ? "success" : "outline"}>
                <StatusDot on={Boolean(course.is_published)} />
                {course.is_published ? t.course.published : t.course.draft}
              </Badge>
            ) : null}
          </div>

          <h3 className="mt-3 text-pretty text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink">
            {course.title}
          </h3>

          {course.subtitle ? (
            <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-muted">
              {course.subtitle}
            </p>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3.5 text-[12px] text-ink-muted">
            <span className="min-w-0 truncate">{course.instructor_name}</span>
            <span className="flex-none">
              {plural(locale, course.enrollment_count, t.course.enrolledCount)}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
