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
import { formatClock, formatNumber, formatRelative, formatWatchTime } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { Badge, Card, CardBody, CardHeader, CardTitle, CardDescription, EmptyState, PageHeading } from "@/components/ui/primitives";
import { TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { StatsWithNumberTicker } from "@/components/stats/stats-sections";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Engagement" };

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

  return (
    <div className="grid gap-6">
      <PageHeading
        eyebrow="Courses"
        title={course.title}
        description="Who is watching, how far they get, and where they stop."
        actions={
          <>
            <ButtonLink href={`/dashboard/courses/${id}/curriculum`} variant="secondary" size="sm">
              Curriculum
            </ButtonLink>
            <ButtonLink href={`/dashboard/courses/${id}`} variant="ghost" size="sm">
              Course details
            </ButtonLink>
          </>
        }
      />

      <div className="flex justify-end">
        <AutoRefresh generatedAt={analytics.generated_at} />
      </div>

      <StatsWithNumberTicker
        title="Engagement"
        description={`${totals.lessons} lesson${totals.lessons === 1 ? "" : "s"}${totals.duration_seconds > 0 ? ` · ${formatClock(totals.duration_seconds)} of material` : ""}. Counted live on every request.`}
        stats={[
          {
            label: "Watching now",
            value: summary.watching_now,
            hint: "Playback moved in the last 5 minutes",
          },
          {
            label: "People who watched",
            value: summary.active_learners,
            hint: `${course.enrollment_count} enrolled in total`,
          },
          {
            label: "Lessons completed",
            value: summary.completions,
            hint: "Across every learner",
          },
          {
            label: "Total watch time",
            value: Math.round(summary.total_watched_seconds / 60),
            suffix: " min",
            display: formatWatchTime(summary.total_watched_seconds),
            hint: "Real playback, not scrubbing",
          },
        ]}
      />

      {/* ------------------------------ per lesson --------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>By lesson</CardTitle>
          <CardDescription>
            The last column is the one to watch: it is how much of the lesson the average viewer
            actually got through. A sharp drop marks the point where people give up.
          </CardDescription>
        </CardHeader>

        <CardBody>
          {lessons.length === 0 ? (
            <EmptyState
              title="No lessons yet"
              description="Add lessons to this course and their engagement will appear here."
              action={
                <ButtonLink href={`/dashboard/courses/${id}/curriculum`} size="sm">
                  Build the curriculum
                </ButtonLink>
              }
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Lesson</Th>
                  <Th>Section</Th>
                  <Th numeric>Length</Th>
                  <Th numeric>Viewers</Th>
                  <Th numeric>Completed</Th>
                  <Th numeric>Avg watched</Th>
                  <Th>Avg through</Th>
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
                        <Badge tone="muted" className="ml-2">
                          Preview
                        </Badge>
                      ) : null}
                    </Td>
                    <Td className="max-w-40 truncate">{lesson.section_title}</Td>
                    <Td numeric>
                      {lesson.duration_seconds > 0 ? formatClock(lesson.duration_seconds) : "—"}
                    </Td>
                    <Td numeric className="font-medium text-ink">
                      {formatNumber(lesson.viewers)}
                    </Td>
                    <Td numeric>{formatNumber(lesson.completions)}</Td>
                    <Td numeric>
                      {lesson.avg_watched_seconds > 0
                        ? formatClock(lesson.avg_watched_seconds)
                        : "—"}
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
          <CardTitle>By learner</CardTitle>
          <CardDescription>
            Everyone enrolled, most recently active first. Someone at 0% who enrolled weeks ago
            never started.
          </CardDescription>
        </CardHeader>

        <CardBody>
          {learners.data.length === 0 ? (
            <EmptyState
              title="Nobody has enrolled yet"
              description={
                hasActivity
                  ? "Preview lessons are being watched, but nobody has enrolled."
                  : "When someone enrols, their progress will show here."
              }
            />
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <Th>Learner</Th>
                  <Th numeric>Completed</Th>
                  <Th>Progress</Th>
                  <Th numeric>Watch time</Th>
                  <Th>Last active</Th>
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
                      {learner.completed}/{learner.lessons}
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
                      {learner.watched_seconds > 0 ? formatWatchTime(learner.watched_seconds) : "—"}
                    </Td>
                    <Td className="whitespace-nowrap">
                      {learner.last_activity_at ? (
                        formatRelative(learner.last_activity_at)
                      ) : (
                        <span className="text-ink-faint">never started</span>
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
