import type { Metadata } from "next";
import { readNotice } from "@/lib/notice";
import Link from "next/link";

import { api } from "@/lib/api/client";
import type { Course, Envelope, Category, Paginated } from "@/lib/api/types";
import { primaryRole, requireRole } from "@/lib/auth/current-user";
import { formatDate } from "@/lib/format";
import { Button, ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Select } from "@/components/ui/field";
import { Alert, Badge, EmptyState, PageHeading, StatusDot } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { setPublicationAction } from "@/app/actions/courses";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Courses" };

/**
 * The authoring list.
 *
 * `/me/courses` returns exactly what the caller may edit — their own courses,
 * or every course for an administrator — so this page never has to ask "is
 * this mine?" It also includes drafts, which the public catalogue does not.
 */
export default async function DashboardCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string; notice?: string; notice_tone?: string }>;
}) {
  const params = await searchParams;
  const flash = readNotice(params);
  const session = await requireRole(["admin", "enseignant"], "/dashboard/courses");
  const isAdmin = primaryRole(session.user.roles) === "admin";

  const [courses, categories] = await Promise.all([
    api<Paginated<Course>>("/me/courses", {
      query: {
        q: params.q?.trim() || undefined,
        category: params.category || undefined,
        page: params.page,
        per_page: 20,
      },
    }),
    api<Envelope<Category[]>>("/categories"),
  ]);

  const drafts = courses.data.filter((course) => !course.is_published).length;

  return (
    <div className="grid gap-6">
      <PageHeading
        title="Courses"
        description={
          isAdmin
            ? "Every course on the platform, drafts included."
            : "The courses you author. Nobody else can edit them, and you cannot edit theirs."
        }
        actions={<ButtonLink href="/dashboard/courses/new" size="sm">New course</ButtonLink>}
      />

      {flash ? <Alert tone={flash.tone}>{flash.message}</Alert> : null}

      <form method="get" className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1">
          <label htmlFor="q" className="mb-1.5 block text-[13px] font-medium text-ink-soft">
            Search
          </label>
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={params.q ?? ""}
            placeholder="Title, description or tag"
          />
        </div>

        <div className="min-w-44">
          <label htmlFor="category" className="mb-1.5 block text-[13px] font-medium text-ink-soft">
            Category
          </label>
          <Select id="category" name="category" defaultValue={params.category ?? ""}>
            <option value="">All categories</option>
            {categories.data.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <Button type="submit" variant="secondary">
          Filter
        </Button>
        {params.q || params.category ? (
          <ButtonLink href="/dashboard/courses" variant="ghost">
            Reset
          </ButtonLink>
        ) : null}
      </form>

      {courses.data.length === 0 ? (
        <EmptyState
          title={params.q || params.category ? "Nothing matches those filters" : "No courses yet"}
          description={
            params.q || params.category
              ? "Try a broader search, or clear the category filter."
              : "Create your first course and it will appear here, in draft, until you publish it."
          }
          action={
            params.q || params.category ? (
              <ButtonLink href="/dashboard/courses" variant="secondary" size="sm">
                Clear filters
              </ButtonLink>
            ) : (
              <ButtonLink href="/dashboard/courses/new" size="sm">
                Create a course
              </ButtonLink>
            )
          }
        />
      ) : (
        <>
          {drafts > 0 ? (
            <p className="text-[13px] text-ink-muted">
              <span className="tabular font-medium text-ink">{drafts}</span> of the courses on this
              page {drafts === 1 ? "is" : "are"} still a draft and hidden from the catalogue.
            </p>
          ) : null}

          <TableWrap>
            <thead>
              <tr>
                <Th>Course</Th>
                {isAdmin ? <Th>Instructor</Th> : null}
                <Th>Category</Th>
                <Th numeric>Enrolled</Th>
                <Th>Updated</Th>
                <Th>State</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>

            <tbody>
              {courses.data.map((course) => (
                <Tr key={course.id}>
                  <Td>
                    <Link
                      href={`/dashboard/courses/${course.id}`}
                      className="font-medium text-ink hover:underline"
                    >
                      {course.title}
                    </Link>
                    {course.subtitle ? (
                      <span className="mt-0.5 block max-w-sm truncate text-[12px] text-ink-muted">
                        {course.subtitle}
                      </span>
                    ) : null}
                  </Td>

                  {isAdmin ? <Td>{course.instructor_name}</Td> : null}

                  <Td>{course.category_name ?? <span className="text-ink-faint">—</span>}</Td>
                  <Td numeric>{course.enrollment_count}</Td>
                  <Td>{formatDate(course.updated_at)}</Td>

                  <Td>
                    <Badge tone={course.is_published ? "success" : "outline"}>
                      <StatusDot on={Boolean(course.is_published)} />
                      {course.is_published ? "Published" : "Draft"}
                    </Badge>
                  </Td>

                  <Td>
                    <div className="flex justify-end gap-1.5">
                      <form action={setPublicationAction}>
                        <input type="hidden" name="id" value={course.id} />
                        <input type="hidden" name="publish" value={course.is_published ? "0" : "1"} />
                        <input type="hidden" name="returnTo" value="/dashboard/courses" />
                        <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                          {course.is_published ? "Unpublish" : "Publish"}
                        </SubmitButton>
                      </form>

                      <ButtonLink
                        href={`/dashboard/courses/${course.id}/curriculum`}
                        variant="ghost"
                        size="sm"
                      >
                        Lessons
                      </ButtonLink>

                      <ButtonLink
                        href={`/dashboard/courses/${course.id}`}
                        variant="secondary"
                        size="sm"
                      >
                        Edit
                      </ButtonLink>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </TableWrap>

          <Pagination
            page={courses.pagination.page}
            totalPages={courses.pagination.total_pages}
            total={courses.pagination.total}
            basePath="/dashboard/courses"
            params={{ q: params.q, category: params.category }}
            label="courses"
          />
        </>
      )}
    </div>
  );
}
