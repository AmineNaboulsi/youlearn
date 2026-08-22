import type { Metadata } from "next";
import Link from "next/link";

import { api } from "@/lib/api/client";
import type { DashboardStats, Envelope } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";
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

export const metadata: Metadata = { title: "Dashboard" };

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

  const busiest = Math.max(0, ...stats.daily.map((day) => day.count));

  return (
    <div className="grid gap-10">
      <StatsWithNumberTicker
        eyebrow={platform ? "Whole platform" : "Your courses"}
        title={platform ? "How the platform is doing" : "How your courses are doing"}
        description={
          platform
            ? "Every course and enrolment across YouLearn, counted live on each request."
            : "Counted across the courses you author. Nobody else's numbers are included."
        }
        stats={[
          {
            label: "Courses",
            value: stats.summary.courses,
            hint: `${formatNumber(stats.summary.published_courses)} published, ${formatNumber(
              stats.summary.courses - stats.summary.published_courses,
            )} in draft`,
          },
          {
            label: "Enrolments",
            value: stats.summary.enrollments,
            hint: "Total, all time",
          },
          {
            label: "Learners",
            value: stats.summary.learners,
            hint: "Distinct people, not enrolments",
          },
          {
            label: "Last 30 days",
            value: stats.summary.enrollments_last_30_days,
            hint: "New enrolments this month",
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Enrolments over the last 30 days</CardTitle>
          <CardDescription>
            {busiest === 0
              ? "No enrolments in this period yet."
              : `Busiest day had ${formatNumber(busiest)} enrolment${busiest === 1 ? "" : "s"}.`}
          </CardDescription>
        </CardHeader>
        <CardBody>
          <Sparkline
            points={stats.daily}
            label="Daily enrolments over the last 30 days"
          />
          <div className="mt-2 flex justify-between text-[11px] text-ink-muted">
            <span>{stats.daily[0]?.date}</span>
            <span>{stats.daily[stats.daily.length - 1]?.date}</span>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Most enrolled courses</CardTitle>
            <CardDescription>
              {platform ? "Across the platform." : "Across the courses you author."}
            </CardDescription>
          </CardHeader>
          <CardBody>
            {stats.top_courses.length === 0 ? (
              <EmptyState
                title="No courses yet"
                description="Publish a course and it will start appearing here."
                action={<ButtonLink href="/dashboard/courses/new" size="sm">Create a course</ButtonLink>}
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
                          {course.is_published ? "Published" : "Draft"}
                        </span>
                      </span>
                      <span className="tabular flex-none text-[13px] font-medium text-ink">
                        {formatNumber(course.enrollment_count)}
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
              <CardTitle>People on the platform</CardTitle>
              <CardDescription>Accounts by role, mirrored from Keycloak.</CardDescription>
            </CardHeader>
            <CardBody>
              <dl className="grid grid-cols-2 gap-5">
                <PeopleStat label="Administrators" value={stats.people.admin} />
                <PeopleStat label="Instructors" value={stats.people.enseignant} />
                <PeopleStat label="Learners" value={stats.people.etudiant} />
                <PeopleStat
                  label="Suspended"
                  value={stats.people.suspended}
                  note={stats.people.suspended > 0 ? "Cannot sign in" : undefined}
                />
              </dl>

              <div className="mt-6 border-t border-line pt-4">
                <ButtonLink href="/dashboard/people" variant="secondary" size="sm">
                  Manage accounts
                </ButtonLink>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Next steps</CardTitle>
              <CardDescription>Common things to do from here.</CardDescription>
            </CardHeader>
            <CardBody className="grid gap-2">
              <QuickLink href="/dashboard/courses/new" label="Create a course" />
              <QuickLink href="/dashboard/courses" label="Review your drafts" />
              <QuickLink href="/dashboard/learners" label="See who is enrolled" />
              <QuickLink href="/dashboard/exports" label="Export your enrolment data" />
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}

function PeopleStat({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-[0.1em] text-ink-muted">{label}</dt>
      <dd className="tabular mt-1 text-2xl font-semibold tracking-[-0.03em] text-ink">
        {formatNumber(value)}
      </dd>
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
        className="size-4 text-ink-faint transition-transform group-hover:translate-x-0.5"
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
