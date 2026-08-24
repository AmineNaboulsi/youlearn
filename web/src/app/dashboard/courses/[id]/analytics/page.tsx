import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { api, apiOrNull } from "@/lib/api/client";
import type {
  CourseAnalytics,
  CourseDetail,
  Envelope,
  LearnerProgressRow,
  Paginated,
} from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import { interpolate, plural } from "@/lib/i18n/plural";
import { getTranslation } from "@/lib/i18n/server";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, CardBody, CardHeader, CardTitle, CardDescription, EmptyState, PageHeading } from "@/components/ui/primitives";
import { TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { StatsWithNumberTicker } from "@/components/stats/stats-sections";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return { title: t.courseEdit.engagement };
}

/**
 * How many people watched, and how far they got.
 *
 * Every figure is a fresh query — nothing is cached at any layer — and the page
 * re-renders itself every fifteen seconds, so "watching now" genuinely means
 * people whose playback moved in the last five minutes.
 */
export default async function CourseAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole(["admin", "enseignant"], `/dashboard/courses/${id}/analytics`);

  const [courseResponse, analyticsResponse, learners] = await Promise.all([
    apiOrNull<CourseDetail>(`/courses/${id}`),
    api<Envelope<CourseAnalytics>>(`/courses/${id}/analytics`),
    api<Paginated<LearnerProgressRow>>(`/courses/${id}/analytics/learners`, {
      query: { per_page: 25 },
    }),
  ]);

  if (!courseResponse) notFound();

  const course = courseResponse.data;
  const analytics = analyticsResponse.data;
  const { summary, lessons, totals } = analytics;

  const hasActivity = summary.active_learners > 0;
  const { locale, t, fmt } = await getTranslation();

  return (
    <div className="grid gap-6">
      <PageHeading
        eyebrow={t.courses.title}
        title={course.title}
        description={t.analytics.description}
        actions={
          <>
            <ButtonLink href={`/dashboard/courses/${id}/curriculum`} variant="secondary" size="sm">
              {t.courseEdit.curriculum}
            </ButtonLink>
            <ButtonLink href={`/dashboard/courses/${id}`} variant="ghost" size="sm">
              {t.analytics.courseDetails}
            </ButtonLink>
          </>
        }
      />

      <div className="flex justify-end">
        <AutoRefresh generatedAt={analytics.generated_at} labels={t.autoRefresh} />
      </div>

      <StatsWithNumberTicker
        title={t.analytics.title}
        description={interpolate(t.analytics.materialSummary, {
          lessons: plural(locale, totals.lessons, t.course.lessonCount),
          duration:
            totals.duration_seconds > 0
              ? interpolate(t.analytics.materialDuration, {
                  clock: fmt.clock(totals.duration_seconds),
                })
              : "",
        })}
        stats={[
          {
            label: t.analytics.watchingNow,
            value: summary.watching_now,
            hint: t.analytics.watchingNowHint,
          },
          {
            label: t.analytics.peopleWatched,
            value: summary.active_learners,
            hint: interpolate(t.analytics.peopleWatchedHint, {
              count: plural(locale, course.enrollment_count, t.course.enrolledCount),
            }),
          },
          {
            label: t.analytics.lessonsCompleted,
            value: summary.completions,
            hint: t.analytics.lessonsCompletedHint,
          },
          {
            label: t.analytics.totalWatchTime,
            value: Math.round(summary.total_watched_seconds / 60),
            display: fmt.watchTime(summary.total_watched_seconds),
            hint: t.analytics.totalWatchTimeHint,
          },
        ]}
      />

      {/* ------------------------------ per lesson --------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>{t.analytics.byLesson}</CardTitle>
          <CardDescription>{t.analytics.byLessonHint}</CardDescription>
        </CardHeader>

        <CardBody>
          {lessons.length === 0 ? (
            <EmptyState
              title={t.analytics.noLessonsTitle}
              description={t.analytics.noLessonsBody}
              action={
                <ButtonLink href={`/dashboard/courses/${id}/curriculum`} size="sm">
                  {t.course.buildCurriculum}
                </ButtonLink>
              }
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>{t.analytics.colLesson}</Th>
                  <Th>{t.analytics.colSection}</Th>
                  <Th numeric>{t.analytics.colLength}</Th>
                  <Th numeric>{t.analytics.colViewers}</Th>
                  <Th numeric>{t.analytics.colCompleted}</Th>
                  <Th numeric>{t.analytics.colAvgWatched}</Th>
                  <Th>{t.analytics.colAvgThrough}</Th>
                </tr>
              </thead>

              <tbody>
                {lessons.map((lesson) => (
                  <Tr key={lesson.id}>
                    <Td>
                      <Link
                        href={`/learn/${id}/${lesson.id}`}
                        className="font-medium text-ink hover:underline"
                      >
                        {lesson.title}
                      </Link>
                      {lesson.is_preview ? (
                        <Badge tone="muted" className="ms-2">
                          {t.course.preview}
                        </Badge>
                      ) : null}
                    </Td>
                    <Td className="max-w-40 truncate">{lesson.section_title}</Td>
                    <Td numeric>
                      {lesson.duration_seconds > 0
                        ? fmt.clock(lesson.duration_seconds)
                        : t.common.none}
                    </Td>
                    <Td numeric className="font-medium text-ink">
                      {fmt.number(lesson.viewers)}
                    </Td>
                    <Td numeric>{fmt.number(lesson.completions)}</Td>
                    <Td numeric>
                      {lesson.avg_watched_seconds > 0
                        ? fmt.clock(lesson.avg_watched_seconds)
                        : t.common.none}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 flex-none overflow-hidden rounded-full bg-line">
                          <div
                            className="h-full bg-ink"
                            style={{ width: `${lesson.avg_completion_percent}%` }}
                          />
                        </div>
                        <span className="tabular text-[12px] text-ink-soft">
                          {lesson.avg_completion_percent}%
                        </span>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </CardBody>
      </Card>

      {/* ------------------------------ per learner -------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>{t.analytics.byLearner}</CardTitle>
          <CardDescription>{t.analytics.byLearnerHint}</CardDescription>
        </CardHeader>

        <CardBody>
          {learners.data.length === 0 ? (
            <EmptyState
              title={t.analytics.noLearnersTitle}
              description={
                hasActivity ? t.analytics.noLearnersActivity : t.analytics.noLearnersBody
              }
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>{t.learners.colLearner}</Th>
                  <Th numeric>{t.analytics.colCompleted}</Th>
                  <Th>{t.analytics.colProgress}</Th>
                  <Th numeric>{t.analytics.colWatchTime}</Th>
                  <Th>{t.sessions.lastActive}</Th>
                </tr>
              </thead>

              <tbody>
                {learners.data.map((learner) => (
                  <Tr key={learner.user_id}>
                    <Td>
                      <span className="block font-medium text-ink">{learner.name}</span>
                      <span className="mt-0.5 block text-[11px] text-ink-muted">
                        {learner.email}
                      </span>
                    </Td>
                    <Td numeric>
                      {fmt.number(learner.completed)}/{fmt.number(learner.lessons)}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 flex-none overflow-hidden rounded-full bg-line">
                          <div className="h-full bg-ink" style={{ width: `${learner.percent}%` }} />
                        </div>
                        <span className="tabular text-[12px] text-ink-soft">{learner.percent}%</span>
                      </div>
                    </Td>
                    <Td numeric>
                      {learner.watched_seconds > 0
                        ? fmt.watchTime(learner.watched_seconds)
                        : t.common.none}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {learner.last_activity_at ? (
                        fmt.relative(learner.last_activity_at)
                      ) : (
                        <span className="text-ink-faint">{t.analytics.neverStarted}</span>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </TableWrap>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
