import type { Metadata } from "next";
import Link from "next/link";

import { api } from "@/lib/api/client";
import type { DashboardStats, Envelope } from "@/lib/api/types";
import { interpolate, plural } from "@/lib/i18n/plural";
import { getTranslation } from "@/lib/i18n/server";
import { ButtonLink } from "@/components/ui/button";
import {
  Badge,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  StatusDot,
} from "@/components/ui/primitives";
import { StatsWithNumberTicker } from "@/components/stats/stats-sections";
import { Sparkline } from "@/components/stats/sparkline";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return { title: t.nav.dashboard };
}

/**
 * Overview.
 *
 * The API scopes every figure to the caller — an instructor's numbers cover
 * only their own courses — so this page renders what it is given and does no
 * filtering of its own. `scope` says which it got, and the copy adapts.
 */
export default async function DashboardPage() {
  const response = await api<Envelope<DashboardStats>>("/stats/dashboard");
  const stats = response.data;
  const platform = stats.scope === "platform";

  const { locale, t, fmt } = await getTranslation();
  const busiest = Math.max(0, ...stats.daily.map((day) => day.count));

  return (
    <div className="grid gap-10">
      <StatsWithNumberTicker
        eyebrow={platform ? t.dashboard.eyebrowPlatform : t.dashboard.eyebrowOwn}
        title={platform ? t.dashboard.titlePlatform : t.dashboard.titleOwn}
        description={
          platform ? t.dashboard.descriptionPlatform : t.dashboard.descriptionOwn
        }
        stats={[
          {
            label: t.dashboard.statCourses,
            value: stats.summary.courses,
            hint: interpolate(t.dashboard.statCoursesHint, {
              published: fmt.number(stats.summary.published_courses),
              drafts: fmt.number(stats.summary.courses - stats.summary.published_courses),
            }),
          },
          {
            label: t.dashboard.statEnrolments,
            value: stats.summary.enrollments,
            hint: t.dashboard.statEnrolmentsHint,
          },
          {
            label: t.dashboard.statLearners,
            value: stats.summary.learners,
            hint: t.dashboard.statLearnersHint,
          },
          {
            label: t.dashboard.statLast30,
            value: stats.summary.enrollments_last_30_days,
            hint: t.dashboard.statLast30Hint,
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t.dashboard.enrolmentsChart}</CardTitle>
          <CardDescription>
            {busiest === 0
              ? t.dashboard.noEnrolmentsPeriod
              : interpolate(t.dashboard.busiestDay, {
                  count: plural(locale, busiest, t.dashboard.busiestDayCount),
                })}
          </CardDescription>
        </CardHeader>
        <CardBody>
          <Sparkline points={stats.daily} label={t.dashboard.sparklineLabel} />
          <div className="mt-2 flex justify-between text-[11px] text-ink-muted">
            <span>{stats.daily[0]?.date}</span>
            <span>{stats.daily[stats.daily.length - 1]?.date}</span>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.dashboard.topCourses}</CardTitle>
            <CardDescription>
              {platform ? t.dashboard.topCoursesPlatform : t.dashboard.topCoursesOwn}
            </CardDescription>
          </CardHeader>
          <CardBody>
            {stats.top_courses.length === 0 ? (
              <EmptyState
                title={t.dashboard.noCoursesTitle}
                description={t.dashboard.noCoursesBody}
                action={
                  <ButtonLink href="/dashboard/courses/new" size="sm">
                    {t.dashboard.createCourse}
                  </ButtonLink>
                }
              />
            ) : (
              <ol className="grid gap-1">
                {stats.top_courses.map((course, index) => (
                  <li key={course.id}>
                    <Link
                      href={`/dashboard/courses/${course.id}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-surface-sunk"
                    >
                      <span className="tabular w-5 flex-none text-[12px] text-ink-faint">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-ink">
                          {course.title}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-muted">
                          <StatusDot on={Boolean(course.is_published)} />
                          {course.is_published ? t.course.published : t.course.draft}
                        </span>
                      </span>
                      <span className="tabular flex-none text-[13px] font-medium text-ink">
                        {fmt.number(course.enrollment_count)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>

        {stats.people ? (
          <Card>
            <CardHeader>
              <CardTitle>{t.dashboard.people}</CardTitle>
              <CardDescription>{t.dashboard.peopleHint}</CardDescription>
            </CardHeader>
            <CardBody>
              <dl className="grid grid-cols-2 gap-5">
                <PeopleStat
                  label={t.dashboard.peopleAdmins}
                  value={fmt.number(stats.people.admin)}
                />
                <PeopleStat
                  label={t.dashboard.peopleInstructors}
                  value={fmt.number(stats.people.enseignant)}
                />
                <PeopleStat
                  label={t.dashboard.peopleLearners}
                  value={fmt.number(stats.people.etudiant)}
                />
                <PeopleStat
                  label={t.dashboard.peopleSuspended}
                  value={fmt.number(stats.people.suspended)}
                  note={stats.people.suspended > 0 ? t.dashboard.cannotSignIn : undefined}
                />
              </dl>

              <div className="mt-6 border-t border-line pt-4">
                <ButtonLink href="/dashboard/people" variant="secondary" size="sm">
                  {t.dashboard.manageAccounts}
                </ButtonLink>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t.dashboard.nextSteps}</CardTitle>
              <CardDescription>{t.dashboard.nextStepsHint}</CardDescription>
            </CardHeader>
            <CardBody className="grid gap-2">
              <QuickLink href="/dashboard/courses/new" label={t.dashboard.createCourse} />
              <QuickLink href="/dashboard/courses" label={t.dashboard.reviewDrafts} />
              <QuickLink href="/dashboard/learners" label={t.dashboard.seeEnrolled} />
              <QuickLink href="/dashboard/exports" label={t.dashboard.exportData} />
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

function PeopleStat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-muted">{label}</dt>
      <dd className="tabular mt-1 text-2xl font-semibold tracking-[-0.03em] text-ink">{value}</dd>
      {note ? (
        <p className="mt-1">
          <Badge tone="outline">{note}</Badge>
        </p>
      ) : null}
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between rounded-lg border border-line px-3.5 py-2.5 text-[13px] font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
    >
      {label}
      <svg
        viewBox="0 0 20 20"
        className="size-4 text-ink-faint transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path d="M7 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
