import type { Metadata } from "next";
import { readNotice } from "@/lib/notice";
import Link from "next/link";
import { notFound } from "next/navigation";

import { api, apiOrNull } from "@/lib/api/client";
import type { CourseDetail, Curriculum, Envelope } from "@/lib/api/types";
import { getSession, primaryRole } from "@/lib/auth/current-user";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert, Badge, Card, CardBody, StatusDot } from "@/components/ui/primitives";
import { CourseThumb } from "@/components/courses/course-thumb";
import { CurriculumList } from "@/components/learn/curriculum-list";
import { enrollAction, leaveCourseAction } from "@/app/actions/enrollment";
import { formatClock, formatDate, formatWatchTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const course = await apiOrNull<CourseDetail>(`/courses/${id}`);

  return { title: course?.data.title ?? "Course" };
}

/**
 * A single course.
 *
 * The API decides visibility: an unpublished course comes back as a 404 unless
 * the caller may manage it. This page renders whatever it is given rather than
 * making its own judgement, so there is exactly one rule about who can see a
 * draft and it lives on the server that owns the data.
 */
export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; notice_tone?: string }>;
}) {
  const { id } = await params;
  const { notice, notice_tone } = await searchParams;
  const flash = readNotice({ notice, notice_tone });

  const response = await apiOrNull<CourseDetail>(`/courses/${id}`);
  if (!response) notFound();

  const course = response.data;
  const viewer = response.viewer;
  const session = await getSession();
  const role = primaryRole(session?.user.roles ?? []);

  // The curriculum is public; the API withholds video URLs for lessons this
  // viewer may not open, so the contents can be shown to anyone.
  const curriculum = (await api<Envelope<Curriculum>>(`/courses/${id}/curriculum`)).data;
  const progress = curriculum.progress;

  return (
    <>
      <SiteHeader />

      <main id="main" className="mx-auto max-w-6xl px-6 py-10">
        <nav aria-label="Breadcrumb" className="mb-8 text-[13px] text-ink-muted">
          <Link href="/courses" className="transition-colors hover:text-ink">
            Courses
          </Link>
          <span className="mx-2 text-ink-faint" aria-hidden>
            /
          </span>
          <span className="text-ink-soft">{course.category_name ?? "Uncategorised"}</span>
        </nav>

        {flash ? (
          <Alert tone={flash.tone} className="mb-8">
            {flash.message}
          </Alert>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* ------------------------------ main ------------------------- */}
          <article className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {course.category_name ? <Badge tone="muted">{course.category_name}</Badge> : null}
              <Badge tone="muted">{contentTypeLabel(course.content_type)}</Badge>
              {!course.is_published ? (
                <Badge tone="outline">
                  <StatusDot on={false} />
                  Draft — only visible to you
                </Badge>
              ) : null}
            </div>

            <h1 className="mt-4 text-balance text-3xl font-semibold leading-tight tracking-[-0.035em] text-ink sm:text-[38px]">
              {course.title}
            </h1>

            {course.subtitle ? (
              <p className="mt-3 max-w-2xl text-pretty text-base leading-relaxed text-ink-muted">
                {course.subtitle}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-muted">
              <span>
                Taught by <span className="font-medium text-ink-soft">{course.instructor_name}</span>
              </span>
              <span aria-hidden className="text-ink-ghost">
                ·
              </span>
              <span className="tabular">{course.enrollment_count} enrolled</span>
              <span aria-hidden className="text-ink-ghost">
                ·
              </span>
              <span>Updated {formatDate(course.updated_at)}</span>
            </div>

            <CourseThumb
              src={course.img}
              coverPublicId={course.cover_public_id}
              title={course.title}
              contentType={course.content_type}
              className="mt-8 aspect-[21/9] rounded-card border"
              sizes="(min-width: 1024px) 720px, 94vw"
            />

            {course.description ? (
              <section className="mt-10">
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                  About this course
                </h2>
                <p className="mt-3 max-w-2xl text-pretty leading-relaxed text-ink-soft">
                  {course.description}
                </p>
              </section>
            ) : null}

            <section className="mt-10">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-[-0.02em] text-ink">
                  Course content
                </h2>
                {curriculum.lesson_count > 0 ? (
                  <p className="text-[13px] text-ink-muted">
                    {curriculum.sections.length} section
                    {curriculum.sections.length === 1 ? "" : "s"} ·{" "}
                    {curriculum.lesson_count} lesson
                    {curriculum.lesson_count === 1 ? "" : "s"}
                    {curriculum.duration_seconds > 0
                      ? ` · ${formatClock(curriculum.duration_seconds)} total`
                      : ""}
                  </p>
                ) : null}
              </div>

              {curriculum.lesson_count === 0 ? (
                <Card className="mt-4">
                  <CardBody>
                    <p className="text-[13px] leading-relaxed text-ink-muted">
                      {viewer?.can_manage
                        ? "This course has no lessons yet. Add a section and upload your first video to get started."
                        : "The instructor has not published any lessons yet."}
                    </p>
                    {viewer?.can_manage ? (
                      <div className="mt-4">
                        <ButtonLink href={`/dashboard/courses/${course.id}/curriculum`} size="sm">
                          Build the curriculum
                        </ButtonLink>
                      </div>
                    ) : null}
                  </CardBody>
                </Card>
              ) : (
                <div className="mt-4">
                  <CurriculumList sections={curriculum.sections} courseId={course.id} />
                </div>
              )}

              {!curriculum.unlocked && curriculum.lesson_count > 0 ? (
                <p className="mt-4 text-[12px] leading-relaxed text-ink-muted">
                  Locked lessons open as soon as you enrol. Anything marked{" "}
                  <span className="font-medium text-ink-soft">Preview</span> can be watched right
                  now.
                </p>
              ) : null}
            </section>

            {course.tags.length > 0 ? (
              <section className="mt-10 border-t border-line pt-6">
                <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
                  Tags
                </h2>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {course.tags.map((tag) => (
                    <li key={tag.id}>
                      <Link
                        href={`/courses?tags=${tag.id}`}
                        className="inline-flex rounded-md border border-line-strong px-2 py-1 text-[12px] font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
                      >
                        {tag.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </article>

          {/* ------------------------------ aside ------------------------ */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardBody className="grid gap-4">
                <div>
                  <p className="text-[28px] font-semibold leading-none tracking-[-0.04em] text-ink">
                    {Number(course.price) > 0 ? `€${course.price}` : "Free"}
                  </p>
                  <p className="mt-1.5 text-[12px] text-ink-muted">
                    Full access, no expiry.
                  </p>
                </div>

                {!session ? (
                  <ButtonLink
                    href={`/api/auth/login?next=${encodeURIComponent(`/courses/${course.id}`)}`}
                    className="w-full"
                  >
                    Sign in to enrol
                  </ButtonLink>
                ) : viewer?.is_enrolled ? (
                  <>
                    {progress && progress.lessons > 0 ? (
                      <div className="rounded-lg border border-line bg-surface-sunk px-3 py-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[12px] font-medium text-ink-soft">Your progress</span>
                          <span className="tabular text-[13px] font-semibold text-ink">
                            {progress.percent}%
                          </span>
                        </div>
                        <div
                          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line"
                          role="progressbar"
                          aria-valuenow={progress.percent}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label="Course progress"
                        >
                          <div className="h-full bg-ink" style={{ width: `${progress.percent}%` }} />
                        </div>
                        <p className="mt-2 text-[11px] text-ink-muted">
                          {progress.completed} of {progress.lessons} lessons ·{" "}
                          {formatWatchTime(progress.watched_seconds)} watched
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-ink bg-surface-sunk px-3 py-2.5 text-[13px] font-medium text-ink">
                        <StatusDot on className="mr-2 align-middle" />
                        You are enrolled
                      </div>
                    )}

                    {curriculum.lesson_count > 0 ? (
                      <ButtonLink href={`/learn/${course.id}`} className="w-full">
                        {progress && progress.completed > 0 ? "Continue learning" : "Start learning"}
                      </ButtonLink>
                    ) : null}

                    <ButtonLink href="/learning" variant="secondary" className="w-full">
                      Go to my learning
                    </ButtonLink>
                    <form action={leaveCourseAction}>
                      <input type="hidden" name="courseId" value={course.id} />
                      <input type="hidden" name="returnTo" value={`/courses/${course.id}`} />
                      <SubmitButton
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        pendingLabel="Leaving…"
                      >
                        Leave this course
                      </SubmitButton>
                    </form>
                  </>
                ) : viewer?.can_enroll ? (
                  <form action={enrollAction}>
                    <input type="hidden" name="courseId" value={course.id} />
                    <input type="hidden" name="returnTo" value={`/courses/${course.id}`} />
                    <SubmitButton className="w-full" pendingLabel="Enrolling…">
                      {curriculum.lesson_count > 0
                        ? `Enrol — unlock ${curriculum.lesson_count} lesson${curriculum.lesson_count === 1 ? "" : "s"}`
                        : "Enrol now"}
                    </SubmitButton>
                  </form>
                ) : (
                  <Alert>
                    {role === "enseignant" || role === "admin"
                      ? "Instructor and administrator accounts do not enrol in courses."
                      : "Your account cannot enrol in courses."}
                  </Alert>
                )}

                {viewer?.can_manage ? (
                  <ButtonLink
                    href={`/dashboard/courses/${course.id}`}
                    variant="secondary"
                    className="w-full"
                  >
                    Edit this course
                  </ButtonLink>
                ) : null}
              </CardBody>
            </Card>

            <dl className="mt-4 grid gap-px overflow-hidden rounded-card border border-line bg-line text-[13px]">
              <Row label="Lessons" value={String(curriculum.lesson_count)} />
              <Row
                label="Total length"
                value={curriculum.duration_seconds > 0 ? formatClock(curriculum.duration_seconds) : "—"}
              />
              <Row label="Category" value={course.category_name ?? "Uncategorised"} />
              <Row label="Enrolled" value={String(course.enrollment_count)} />
              <Row label="Published" value={formatDate(course.created_at)} />
            </dl>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-surface px-4 py-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="truncate font-medium text-ink-soft">{value}</dd>
    </div>
  );
}

function contentTypeLabel(type: string): string {
  switch (type) {
    case "video":
      return "Video course";
    case "document":
      return "Document";
    default:
      return "Written course";
  }
}
