import type { Metadata } from "next";
import { readNotice } from "@/lib/notice";
import { notFound } from "next/navigation";

import { api, apiOrNull } from "@/lib/api/client";
import type { Category, CourseDetail, Envelope, Tag } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import { interpolate, plural } from "@/lib/i18n/plural";
import { getTranslation } from "@/lib/i18n/server";
import { ButtonLink } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/field";
import {
  Alert,
  Badge,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeading,
  StatusDot,
} from "@/components/ui/primitives";
import { CourseForm } from "@/components/courses/course-form";
import { deleteCourseAction, setPublicationAction, updateCourseAction } from "@/app/actions/courses";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const course = await apiOrNull<CourseDetail>(`/courses/${id}`);
  const { t } = await getTranslation();
  return {
    title: course
      ? interpolate(t.courseEdit.editTitle, { title: course.data.title })
      : t.courseEdit.editFallback,
  };
}

/**
 * The course editor.
 *
 * Visibility and ownership are both decided by the API: an instructor
 * requesting a course they do not own gets a 404 here, exactly as an anonymous
 * visitor requesting a draft does. That is why this page can call notFound()
 * on a null response and be done with authorisation.
 */
export default async function EditCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string; notice_tone?: string }>;
}) {
  const { id } = await params;
  const { notice, notice_tone } = await searchParams;
  const flash = readNotice({ notice, notice_tone });

  await requireRole(["admin", "enseignant"], `/dashboard/courses/${id}`);

  const [response, categories, tags] = await Promise.all([
    apiOrNull<CourseDetail>(`/courses/${id}`),
    api<Envelope<Category[]>>("/categories"),
    api<Envelope<Tag[]>>("/tags"),
  ]);

  if (!response || !response.viewer?.can_manage) notFound();

  const course = response.data;
  const { locale, t, fmt } = await getTranslation();

  return (
    <div className="grid gap-6">
      <PageHeading
        eyebrow={t.courses.title}
        title={course.title}
        description={interpolate(t.courseEdit.meta, {
          created: fmt.date(course.created_at),
          updated: fmt.date(course.updated_at),
          enrolled: plural(locale, course.enrollment_count, t.course.enrolledCount),
        })}
        actions={
          <>
            <Badge tone={course.is_published ? "success" : "outline"}>
              <StatusDot on={Boolean(course.is_published)} />
              {course.is_published ? t.course.published : t.course.draft}
            </Badge>
            <ButtonLink href={`/dashboard/courses/${course.id}/curriculum`} size="sm">
              {t.courseEdit.curriculum}
            </ButtonLink>
            <ButtonLink
              href={`/dashboard/courses/${course.id}/analytics`}
              variant="secondary"
              size="sm"
            >
              {t.courseEdit.engagement}
            </ButtonLink>
            <ButtonLink href={`/courses/${course.id}`} variant="ghost" size="sm">
              {t.courseEdit.viewAsLearner}
            </ButtonLink>
          </>
        }
      />

      {flash ? <Alert tone={flash.tone}>{flash.message}</Alert> : null}

      <CourseForm
        action={updateCourseAction}
        course={course}
        categories={categories.data}
        tags={tags.data}
        submitLabel={t.courseEdit.saveChanges}
        labels={t.courseForm}
        uploadLabels={t.upload}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t.courseEdit.publication}</CardTitle>
          <CardDescription>
            {course.is_published ? t.courseEdit.publishedBody : t.courseEdit.draftBody}
          </CardDescription>
        </CardHeader>
        <CardBody>
          <form action={setPublicationAction}>
            <input type="hidden" name="id" value={course.id} />
            <input type="hidden" name="publish" value={course.is_published ? "0" : "1"} />
            <input type="hidden" name="returnTo" value={`/dashboard/courses/${course.id}`} />
            <SubmitButton variant="secondary" size="sm" pendingLabel={t.courseEdit.working}>
              {course.is_published ? t.courseEdit.unpublishThis : t.courseEdit.publishThis}
            </SubmitButton>
          </form>
        </CardBody>
      </Card>

      <Card className="border-ink-ghost">
        <CardHeader>
          <CardTitle>{t.courseEdit.deleteTitle}</CardTitle>
          <CardDescription>
            {course.enrollment_count > 0
              ? interpolate(t.courseEdit.deleteWithEnrolments, {
                  count: plural(locale, course.enrollment_count, t.course.enrolledCount),
                })
              : t.courseEdit.deleteEmpty}
          </CardDescription>
        </CardHeader>

        <CardBody>
          {/* The confirmation is typed rather than clicked, and it is verified
              on the server — so posting straight to the action does not skip it. */}
          <form action={deleteCourseAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="id" value={course.id} />

            <div className="min-w-56">
              <label
                htmlFor="confirm"
                className="mb-1.5 block text-[13px] font-medium text-ink-soft"
              >
                {/* The word itself is never translated — the action compares it
                    against a literal on the server. */}
                {t.courseEdit.typeToConfirm.split("{word}").map((part, index) => (
                  <span key={index}>
                    {index > 0 ? (
                      <span className="font-mono text-ink">{t.courseEdit.deleteWord}</span>
                    ) : null}
                    {part}
                  </span>
                ))}
              </label>
              <Input
                id="confirm"
                name="confirm"
                autoComplete="off"
                placeholder={t.courseEdit.deleteWord}
              />
            </div>

            <SubmitButton variant="danger" size="md" pendingLabel={t.courseEdit.deleting}>
              {t.courseEdit.deleteCourse}
            </SubmitButton>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
