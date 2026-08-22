import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { api, apiOrNull, ApiError } from "@/lib/api/client";
import type { Curriculum, Envelope, LessonDetail } from "@/lib/api/types";
import { requireSession } from "@/lib/auth/current-user";
import { formatClock, formatWatchTime } from "@/lib/format";
import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { Alert, Badge, Card, CardBody } from "@/components/ui/primitives";
import { VideoPlayer } from "@/components/learn/video-player";
import { CurriculumList } from "@/components/learn/curriculum-list";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = await apiOrNull<Envelope<LessonDetail>>(`/lessons/${lessonId}`);

  return { title: lesson ? lesson.data.title : "Lesson" };
}

/**
 * The player.
 *
 * This is the page that makes enrolling worth something: the video, the place
 * you got to, and the rest of the course beside it.
 *
 * Access is the API's decision. A locked lesson comes back 403 and a lesson on
 * an unpublished course comes back 404, so this page renders what it is given
 * and never second-guesses the rules.
 */
export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  await requireSession(`/learn/${courseId}/${lessonId}`);

  let lesson: LessonDetail;

  try {
    const response = await api<Envelope<LessonDetail>>(`/lessons/${lessonId}`);
    lesson = response.data;
  } catch (error) {
    if (error instanceof ApiError && error.isForbidden) {
      // Not enrolled. Send them where they can do something about it.
      redirect(`/courses/${courseId}?notice=${encodeURIComponent(error.message)}&notice_tone=danger`);
    }
    if (error instanceof ApiError && error.isNotFound) notFound();
    throw error;
  }

  // A lesson id from another course in the URL would otherwise render happily
  // under the wrong breadcrumb.
  if (String(lesson.course_id) !== courseId) {
    redirect(`/learn/${lesson.course_id}/${lesson.id}`);
  }

  const curriculum = await api<Envelope<Curriculum>>(`/courses/${courseId}/curriculum`);
  const progress = curriculum.data.progress;

  const mediaUrl = lesson.video_url
    ? `/api/media/${lesson.video_url.split("/").pop()}`
    : null;

  return (
    <>
      <SiteHeader />

      <main id="main" className="mx-auto max-w-7xl px-6 py-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-[13px] text-ink-muted">
          <Link href="/learning" className="transition-colors hover:text-ink">
            My learning
          </Link>
          <span aria-hidden className="text-ink-ghost">/</span>
          <Link href={`/courses/${courseId}`} className="transition-colors hover:text-ink">
            {lesson.course_title}
          </Link>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          {/* ------------------------------- player -------------------- */}
          <div className="min-w-0">
            {lesson.kind === "video" && mediaUrl ? (
              <VideoPlayer
                lessonId={lesson.id}
                courseId={lesson.course_id}
                src={mediaUrl}
                mimeType={lesson.video_mime}
                resumeAt={lesson.progress?.last_position_seconds ?? 0}
                nextLessonId={lesson.next_lesson_id}
                title={lesson.title}
              />
            ) : lesson.kind === "video" ? (
              <Alert tone="warning">
                This lesson does not have a video yet. The instructor may still be uploading it.
              </Alert>
            ) : null}

            <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {lesson.is_preview ? <Badge tone="outline">Free preview</Badge> : null}
                  {lesson.progress?.completed ? <Badge tone="solid">Completed</Badge> : null}
                  {lesson.duration_seconds > 0 ? (
                    <Badge tone="muted">{formatClock(lesson.duration_seconds)}</Badge>
                  ) : null}
                </div>

                <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-ink">
                  {lesson.title}
                </h1>

                {lesson.summary ? (
                  <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
                    {lesson.summary}
                  </p>
                ) : null}
              </div>

              {lesson.can_manage ? (
                <ButtonLink
                  href={`/dashboard/courses/${courseId}/curriculum`}
                  variant="secondary"
                  size="sm"
                >
                  Edit curriculum
                </ButtonLink>
              ) : null}
            </div>

            {lesson.kind === "text" && lesson.text_content ? (
              <div className="mt-6 rounded-card border border-line bg-surface-sunk p-6">
                <div className="prose-mono text-[14px]">{lesson.text_content}</div>
              </div>
            ) : null}

            {/* ---------------------------- pager ---------------------- */}
            <nav
              aria-label="Lesson navigation"
              className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-5"
            >
              {lesson.previous_lesson_id ? (
                <ButtonLink
                  href={`/learn/${courseId}/${lesson.previous_lesson_id}`}
                  variant="secondary"
                  size="sm"
                >
                  ← Previous lesson
                </ButtonLink>
              ) : (
                <span />
              )}

              {lesson.next_lesson_id ? (
                <ButtonLink href={`/learn/${courseId}/${lesson.next_lesson_id}`} size="sm">
                  Next lesson →
                </ButtonLink>
              ) : (
                <ButtonLink href={`/courses/${courseId}`} variant="secondary" size="sm">
                  Back to the course
                </ButtonLink>
              )}
            </nav>
          </div>

          {/* ------------------------------ sidebar -------------------- */}
          <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-8rem)] lg:self-start lg:overflow-y-auto">
            {progress ? (
              <Card className="mb-4">
                <CardBody>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[13px] font-medium text-ink">Your progress</p>
                    <p className="tabular text-[13px] font-semibold text-ink">{progress.percent}%</p>
                  </div>

                  {/* A plain meter: the filled portion is ink, the rest is the
                      hairline. No colour needed to read it. */}
                  <div
                    className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-line"
                    role="progressbar"
                    aria-valuenow={progress.percent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Course progress"
                  >
                    <div className="h-full bg-ink" style={{ width: `${progress.percent}%` }} />
                  </div>

                  <p className="mt-2.5 text-[12px] text-ink-muted">
                    {progress.completed} of {progress.lessons} lessons ·{" "}
                    {formatWatchTime(progress.watched_seconds)} watched
                  </p>
                </CardBody>
              </Card>
            ) : null}

            <div className="rounded-card border border-line bg-surface p-4">
              <h2 className="mb-3 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
                Course content
              </h2>
              <CurriculumList
                sections={curriculum.data.sections}
                courseId={lesson.course_id}
                currentLessonId={lesson.id}
                compact
              />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
