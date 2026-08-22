import type { Metadata } from "next";
import Link from "next/link";

import { api } from "@/lib/api/client";
import type { Course, Paginated, RosterRow } from "@/lib/api/types";
import { primaryRole, requireRole } from "@/lib/auth/current-user";
import { formatDate } from "@/lib/format";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { Badge, EmptyState, PageHeading, StatusDot } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { TableWrap, Td, Th, Tr } from "@/components/ui/table";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Learners" };

/**
 * Who is enrolled.
 *
 * Scoping is the API's job: an instructor's request returns only enrolments on
 * their own courses. Email addresses appear in full here because an instructor
 * legitimately needs to contact the people on their course — the masking rules
 * apply to *bulk export*, where the data leaves the platform and stops being
 * subject to any later access-control decision.
 */
export default async function LearnersPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; page?: string }>;
}) {
  const params = await searchParams;
  const session = await requireRole(["admin", "enseignant"], "/dashboard/learners");
  const isAdmin = primaryRole(session.user.roles) === "admin";

  const [roster, courses] = await Promise.all([
    api<Paginated<RosterRow>>("/enrollments", {
      query: { course: params.course || undefined, page: params.page, per_page: 25 },
    }),
    api<Paginated<Course>>("/me/courses", { query: { per_page: 48 } }),
  ]);

  const selectedCourse = courses.data.find((course) => String(course.id) === params.course);

  return (
    <div className="grid gap-6">
      <PageHeading
        title="Learners"
        description={
          isAdmin
            ? "Every enrolment on the platform, newest first."
            : "People enrolled on the courses you author. Only your courses are included."
        }
        actions={
          <ButtonLink href="/dashboard/exports" variant="secondary" size="sm">
            Export as CSV
          </ButtonLink>
        }
      />

      <form method="get" className="flex flex-wrap items-end gap-2">
        <div className="min-w-64">
          <label htmlFor="course" className="mb-1.5 block text-[13px] font-medium text-ink-soft">
            Course
          </label>
          <Select id="course" name="course" defaultValue={params.course ?? ""}>
            <option value="">All courses</option>
            {courses.data.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </Select>
        </div>

        <Button type="submit" variant="secondary">
          Filter
        </Button>
        {params.course ? (
          <ButtonLink href="/dashboard/learners" variant="ghost">
            Reset
          </ButtonLink>
        ) : null}
      </form>

      {selectedCourse ? (
        <p className="text-[13px] text-ink-muted">
          Showing enrolments on{" "}
          <Link
            href={`/dashboard/courses/${selectedCourse.id}`}
            className="font-medium text-ink underline decoration-line-strong underline-offset-2 hover:decoration-ink"
          >
            {selectedCourse.title}
          </Link>
          .
        </p>
      ) : null}

      {roster.data.length === 0 ? (
        <EmptyState
          title="No enrolments yet"
          description={
            params.course
              ? "Nobody has enrolled on this course yet."
              : "When someone enrols on one of your courses they will appear here."
          }
          action={
            params.course ? (
              <ButtonLink href="/dashboard/learners" variant="secondary" size="sm">
                Show all courses
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>Learner</Th>
                <Th>Email</Th>
                <Th>Course</Th>
                <Th>Enrolled</Th>
                <Th>Account</Th>
              </tr>
            </thead>

            <tbody>
              {roster.data.map((row) => (
                <Tr key={`${row.learner_id}-${row.course_id}`}>
                  <Td className="font-medium text-ink">{row.learner_name}</Td>
                  <Td>
                    <a
                      href={`mailto:${row.learner_email}`}
                      className="underline decoration-line-strong underline-offset-2 hover:decoration-ink"
                    >
                      {row.learner_email}
                    </a>
                  </Td>
                  <Td>
                    <Link
                      href={`/dashboard/courses/${row.course_id}`}
                      className="hover:text-ink hover:underline"
                    >
                      {row.course_title}
                    </Link>
                  </Td>
                  <Td>{formatDate(row.enrolled_at)}</Td>
                  <Td>
                    <Badge tone={row.learner_active ? "success" : "danger"}>
                      <StatusDot on={Boolean(row.learner_active)} />
                      {row.learner_active ? "Active" : "Suspended"}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>

          <Pagination
            page={roster.pagination.page}
            totalPages={roster.pagination.total_pages}
            total={roster.pagination.total}
            basePath="/dashboard/learners"
            params={{ course: params.course }}
            label="enrolments"
          />
        </>
      )}
    </div>
  );
}
