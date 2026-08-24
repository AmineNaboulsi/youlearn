import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { api, apiOrNull, ApiError } from "@/lib/api/client";
import type { Curriculum, Envelope, LessonDetail } from "@/lib/api/types";
import { requireSession } from "@/lib/auth/current-user";
import { interpolate } from "@/lib/i18n/plural";
import { getTranslation } from "@/lib/i18n/server";
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

  const { t } = await getTranslation();
  return { title: lesson ? lesson.data.title : t.analytics.colLesson };
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

  const { t, fmt } = await getTranslation();

  return (
    <>
      <SiteHeader />

      <main id="main" className="mx-auto max-w-7xl px-6 py-8">
        <nav
          aria-label={t.course.breadcrumb}
          className="mb-6 flex flex-wrap items-center gap-2 text-[13px] text-ink-muted"
        >
          <Link href="/learning" className="transition-colors hover:text-ink">
            {t.nav.myLearning}
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
                labels={t.player}
              />
            ) : lesson.kind === "video" ? (
              <Alert tone="warning">{t.lesson.noVideoYet}</Alert>
            ) : null}

            <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {lesson.is_preview ? (
                    <Badge tone="outline">{t.lesson.freePreview}</Badge>
                  ) : null}
                  {lesson.progress?.completed ? (
                    <Badge tone="solid">{t.lesson.completed}</Badge>
                  ) : null}
                  {lesson.duration_seconds > 0 ? (
                    <Badge tone="muted">{fmt.clock(lesson.duration_seconds)}</Badge>
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
                  {t.lesson.editCurriculum}
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
              aria-label={t.lesson.navigation}
              className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-5"
            >
              {lesson.previous_lesson_id ? (
                <ButtonLink
                  href={`/learn/${courseId}/${lesson.previous_lesson_id}`}
                  variant="secondary"
                  size="sm"
                >
                  <span aria-hidden className="rtl:hidden">
                    ←{" "}
                  </span>
                  {t.lesson.previousLesson}
                  <span aria-hidden className="hidden rtl:inline">
                    {" "}
                    →
                  </span>
                </ButtonLink>
              ) : (
                <span />
              )}

              {lesson.next_lesson_id ? (
                <ButtonLink href={`/learn/${courseId}/${lesson.next_lesson_id}`} size="sm">
                  <span aria-hidden className="hidden rtl:inline">
                    ←{" "}
                  </span>
                  {t.lesson.nextLesson}
                  <span aria-hidden className="rtl:hidden">
                    {" "}
                    →
                  </span>
                </ButtonLink>
              ) : (
                <ButtonLink href={`/courses/${courseId}`} variant="secondary" size="sm">
                  {t.lesson.backToCourse}
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
                    <p className="text-[13px] font-medium text-ink">{t.course.yourProgress}</p>
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
                    aria-label={t.course.progressLabel}
                  >
                    <div className="h-full bg-ink" style={{ width: `${progress.percent}%` }} />
                  </div>

                  <p className="mt-2.5 text-[12px] text-ink-muted">
                    {interpolate(t.course.progressDetail, {
                      completed: fmt.number(progress.completed),
                      lessons: fmt.number(progress.lessons),
                      watched: fmt.watchTime(progress.watched_seconds),
                    })}
                  </p>
                </CardBody>
              </Card>
            ) : null}

            <div className="rounded-card border border-line bg-surface p-4">
              <h2 className="mb-3 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-muted">
                {t.course.content}
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
