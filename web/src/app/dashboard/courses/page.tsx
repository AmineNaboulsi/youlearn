import type { Metadata } from "next";
import { readNotice } from "@/lib/notice";
import Link from "next/link";

import { api } from "@/lib/api/client";
import type { Course, Envelope, Category, Paginated } from "@/lib/api/types";
import { primaryRole, requireRole } from "@/lib/auth/current-user";
import { interpolate, plural } from "@/lib/i18n/plural";
import { getTranslation } from "@/lib/i18n/server";
import { Button, ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input, Select } from "@/components/ui/field";
import { Alert, Badge, EmptyState, PageHeading, StatusDot } from "@/components/ui/primitives";
import { Pagination } from "@/components/ui/pagination";
import { TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { setPublicationAction } from "@/app/actions/courses";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return { title: t.courses.title };
}

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
  const { locale, t, fmt } = await getTranslation();

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
        title={t.courses.title}
        description={
          isAdmin ? t.dashCourses.descriptionAdmin : t.dashCourses.descriptionOwn
        }
        actions={
          <ButtonLink href="/dashboard/courses/new" size="sm">
            {t.dashCourses.newCourse}
          </ButtonLink>
        }
      />

      {flash ? <Alert tone={flash.tone}>{flash.message}</Alert> : null}

      <form method="get" className="flex flex-wrap items-end gap-2">
        <div className="min-w-48 flex-1">
          <label htmlFor="q" className="mb-1.5 block text-[13px] font-medium text-ink-soft">
            {t.dashCourses.search}
          </label>
          <Input
            id="q"
            name="q"
            type="search"
            defaultValue={params.q ?? ""}
            placeholder={t.dashCourses.searchPlaceholder}
          />
        </div>

        <div className="min-w-44">
          <label htmlFor="category" className="mb-1.5 block text-[13px] font-medium text-ink-soft">
            {t.dashCourses.category}
          </label>
          <Select id="category" name="category" defaultValue={params.category ?? ""}>
            <option value="">{t.dashCourses.allCategories}</option>
            {categories.data.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <Button type="submit" variant="secondary">
          {t.dashCourses.filter}
        </Button>
        {params.q || params.category ? (
          <ButtonLink href="/dashboard/courses" variant="ghost">
            {t.dashCourses.reset}
          </ButtonLink>
        ) : null}
      </form>

      {courses.data.length === 0 ? (
        <EmptyState
          title={
            params.q || params.category
              ? t.dashCourses.emptyFilteredTitle
              : t.dashCourses.emptyTitle
          }
          description={
            params.q || params.category
              ? t.dashCourses.emptyFilteredBody
              : t.dashCourses.emptyBody
          }
          action={
            params.q || params.category ? (
              <ButtonLink href="/dashboard/courses" variant="secondary" size="sm">
                {t.common.clearFilters}
              </ButtonLink>
            ) : (
              <ButtonLink href="/dashboard/courses/new" size="sm">
                {t.dashboard.createCourse}
              </ButtonLink>
            )
          }
        />
      ) : (
        <>
          {drafts > 0 ? (
            <p className="text-[13px] text-ink-muted">
              {interpolate(t.dashCourses.draftsNotice, {
                count: plural(locale, drafts, t.dashCourses.draftCount),
              })}
            </p>
          ) : null}

          <TableWrap>
            <thead>
              <tr>
                <Th>{t.dashCourses.colCourse}</Th>
                {isAdmin ? <Th>{t.dashCourses.colInstructor}</Th> : null}
                <Th>{t.dashCourses.colCategory}</Th>
                <Th numeric>{t.dashCourses.colEnrolled}</Th>
                <Th>{t.dashCourses.colUpdated}</Th>
                <Th>{t.dashCourses.colState}</Th>
                <Th>
                  <span className="sr-only">{t.dashCourses.colActions}</span>
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

                  <Td>
                    {course.category_name ?? (
                      <span className="text-ink-faint">{t.common.none}</span>
                    )}
                  </Td>
                  <Td numeric>{fmt.number(course.enrollment_count)}</Td>
                  <Td>{fmt.date(course.updated_at)}</Td>

                  <Td>
                    <Badge tone={course.is_published ? "success" : "outline"}>
                      <StatusDot on={Boolean(course.is_published)} />
                      {course.is_published ? t.course.published : t.course.draft}
                    </Badge>
                  </Td>

                  <Td>
                    <div className="flex justify-end gap-1.5">
                      <form action={setPublicationAction}>
                        <input type="hidden" name="id" value={course.id} />
                        <input type="hidden" name="publish" value={course.is_published ? "0" : "1"} />
                        <input type="hidden" name="returnTo" value="/dashboard/courses" />
                        <SubmitButton variant="ghost" size="sm" pendingLabel="…">
                          {course.is_published ? t.dashCourses.unpublish : t.dashCourses.publish}
                        </SubmitButton>
                      </form>

                      <ButtonLink
                        href={`/dashboard/courses/${course.id}/curriculum`}
                        variant="ghost"
                        size="sm"
                      >
                        {t.dashCourses.lessons}
                      </ButtonLink>

                      <ButtonLink
                        href={`/dashboard/courses/${course.id}`}
                        variant="secondary"
                        size="sm"
                      >
                        {t.dashCourses.edit}
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
            label={t.courses.paginationLabel}
          />
        </>
      )}
    </div>
  );
}
