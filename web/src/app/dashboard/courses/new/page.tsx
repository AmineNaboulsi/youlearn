import type { Metadata } from "next";

import { api } from "@/lib/api/client";
import type { Category, Envelope, Tag } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import { getTranslation } from "@/lib/i18n/server";
import { PageHeading } from "@/components/ui/primitives";
import { CourseForm } from "@/components/courses/course-form";
import { createCourseAction } from "@/app/actions/courses";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslation();
  return { title: t.courseForm.newCourseTitle };
}

export default async function NewCoursePage() {
  await requireRole(["admin", "enseignant"], "/dashboard/courses/new");
  const { t } = await getTranslation();

  const [categories, tags] = await Promise.all([
    api<Envelope<Category[]>>("/categories"),
    api<Envelope<Tag[]>>("/tags"),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeading
        eyebrow={t.courses.title}
        title={t.courseForm.newCourseTitle}
        description={t.courseForm.newCourseHint}
      />

      <CourseForm
        action={createCourseAction}
        categories={categories.data}
        tags={tags.data}
        submitLabel={t.courseForm.createCourse}
        labels={t.courseForm}
        uploadLabels={t.upload}
      />
    </div>
  );
}
