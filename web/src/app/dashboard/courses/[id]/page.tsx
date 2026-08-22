import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { api, apiOrNull } from "@/lib/api/client";
import type { Category, CourseDetail, Envelope, Tag } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import { formatDate } from "@/lib/format";
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
  return { title: course ? `Edit ${course.data.title}` : "Edit course" };
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
  searchParams: Promise<{ notice?: string }>;
}) {
  const { id } = await params;
  const { notice } = await searchParams;

  await requireRole(["admin", "enseignant"], `/dashboard/courses/${id}`);

  const [response, categories, tags] = await Promise.all([
    apiOrNull<CourseDetail>(`/courses/${id}`),
    api<Envelope<Category[]>>("/categories"),
    api<Envelope<Tag[]>>("/tags"),
  ]);

  if (!response || !response.viewer?.can_manage) notFound();

  const course = response.data;

  return (
    <div className="grid gap-6">
      <PageHeading
        eyebrow="Courses"
        title={course.title}
        description={`Created ${formatDate(course.created_at)} · last updated ${formatDate(course.updated_at)} · ${course.enrollment_count} enrolled`}
        actions={
          <>
            <Badge tone={course.is_published ? "muted" : "outline"}>
              <StatusDot on={Boolean(course.is_published)} />
              {course.is_published ? "Published" : "Draft"}
            </Badge>
            <ButtonLink href={`/dashboard/courses/${course.id}/curriculum`} size="sm">
              Curriculum
            </ButtonLink>
            <ButtonLink href={`/dashboard/courses/${course.id}/analytics`} variant="secondary" size="sm">
              Engagement
            </ButtonLink>
            <ButtonLink href={`/courses/${course.id}`} variant="ghost" size="sm">
              View as learner
            </ButtonLink>
          </>
        }
      />

      {notice ? <Alert emphasis="strong">{notice}</Alert> : null}

      <CourseForm
        action={updateCourseAction}
        course={course}
        categories={categories.data}
        tags={tags.data}
        submitLabel="Save changes"
      />

      <Card>
        <CardHeader>
          <CardTitle>Publication</CardTitle>
          <CardDescription>
            {course.is_published
              ? "This course is in the public catalogue. Unpublishing hides it from new learners; anybody already enrolled keeps it in their list, marked as withdrawn."
              : "This course is a draft. Only you can see it until it is published."}
          </CardDescription>
        </CardHeader>
        <CardBody>
          <form action={setPublicationAction}>
            <input type="hidden" name="id" value={course.id} />
            <input type="hidden" name="publish" value={course.is_published ? "0" : "1"} />
            <input type="hidden" name="returnTo" value={`/dashboard/courses/${course.id}`} />
            <SubmitButton variant="secondary" size="sm" pendingLabel="Working…">
              {course.is_published ? "Unpublish this course" : "Publish this course"}
            </SubmitButton>
          </form>
        </CardBody>
      </Card>

      <Card className="border-ink-ghost">
        <CardHeader>
          <CardTitle>Delete this course</CardTitle>
          <CardDescription>
            {course.enrollment_count > 0
              ? `${course.enrollment_count} ${course.enrollment_count === 1 ? "person is" : "people are"} enrolled. Deleting removes the course and every enrolment record with it, permanently.`
              : "This removes the course and its tags permanently. There is no undo."}
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
                Type <span className="font-mono text-ink">delete</span> to confirm
              </label>
              <Input id="confirm" name="confirm" autoComplete="off" placeholder="delete" />
            </div>

            <SubmitButton variant="danger" size="md" pendingLabel="Deleting…">
              Delete course
            </SubmitButton>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
