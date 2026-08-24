import type { Metadata } from "next";
import { readNotice } from "@/lib/notice";
import Link from "next/link";

import { api } from "@/lib/api/client";
import type { EnrolledCourse, Paginated } from "@/lib/api/types";
import { requireSession } from "@/lib/auth/current-user";
import { interpolate } from "@/lib/i18n/plural";
import { getTranslation } from "@/lib/i18n/server";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert, Badge, EmptyState, PageHeading, StatusDot } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { CourseThumb } from "@/components/courses/course-thumb";
import { leaveCourseAction } from "@/app/actions/enrollment";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return { title: t.learning.title };
}

/**
 * The learner's own shelf.
 *
 * A course can be unpublished after someone enrolled. Rather than hiding it —
 * which would look like the enrolment vanished — it stays listed and is marked
 * as withdrawn by the instructor.
 */
export default async function LearningPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; notice?: string; notice_tone?: string }>;
}) {
  const params = await searchParams;
  const flash = readNotice(params);
  await requireSession("/learning");

  const { t, fmt } = await getTranslation();

  const enrollments = await api<Paginated<EnrolledCourse>>("/me/enrollments", {
    query: { page: params.page, per_page: 12 },
  });

  return (
    <>
      <SiteHeader />

      <main id="main" className="mx-auto max-w-6xl px-6 py-12">
        <PageHeading
          eyebrow={t.learning.eyebrow}
          title={t.learning.title}
          description={t.learning.description}
          actions={
            <ButtonLink href="/courses" variant="secondary" size="sm">
              {t.learning.findMore}
            </ButtonLink>
          }
        />

        {flash ? (
          <Alert tone={flash.tone} className="mt-6">
            {flash.message}
          </Alert>
        ) : null}

        {enrollments.data.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title={t.learning.emptyTitle}
              description={t.learning.emptyBody}
              action={<ButtonLink href="/courses">{t.common.browseCourses}</ButtonLink>}
            />
          </div>
        ) : (
          <>
            <ul className="mt-8 grid gap-px overflow-hidden rounded-card border border-line bg-line">
              {enrollments.data.map((course) => (
                <li
                  key={course.id}
                  className="flex flex-col gap-4 bg-surface p-4 sm:flex-row sm:items-center"
                >
                  <Link
                    href={`/courses/${course.id}`}
                    className="group flex min-w-0 flex-1 items-center gap-4"
                  >
                    <CourseThumb
                      src={course.img}
                      coverPublicId={course.cover_public_id}
                      title={course.title}
                      contentType={course.content_type}
                      className="hidden size-16 flex-none rounded-lg border sm:block"
                      sizes="64px"
                    />

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {course.category_name ? (
                          <Badge tone="muted">{course.category_name}</Badge>
                        ) : null}
                        {!course.is_published ? (
                          <Badge tone="outline">
                            <StatusDot on={false} />
                            {t.learning.withdrawn}
                          </Badge>
                        ) : null}
                      </div>

                      <p className="mt-1.5 truncate text-[15px] font-medium text-ink">
                        {course.title}
                      </p>
                      <p className="mt-0.5 truncate text-[12px] text-ink-muted">
                        {course.instructor_name} ·{" "}
                        {interpolate(t.learning.enrolledOn, {
                          date: fmt.date(course.enrolled_at),
                        })}
                      </p>
                    </div>
                  </Link>

                  <div className="flex flex-none items-center gap-2 sm:justify-end">
                    <ButtonLink href={`/courses/${course.id}`} variant="secondary" size="sm">
                      {t.common.continueLabel}
                    </ButtonLink>

                    <form action={leaveCourseAction}>
                      <input type="hidden" name="courseId" value={course.id} />
                      <input type="hidden" name="returnTo" value="/learning" />
                      <SubmitButton variant="ghost" size="sm" pendingLabel={t.common.leaving}>
                        {t.common.leave}
                      </SubmitButton>
                    </form>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <Pagination
                page={enrollments.pagination.page}
                totalPages={enrollments.pagination.total_pages}
                total={enrollments.pagination.total}
                basePath="/learning"
                label={t.learning.paginationLabel}
              />
            </div>
          </>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
