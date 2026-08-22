import type { Metadata } from "next";

import { api } from "@/lib/api/client";
import type { Category, Envelope, Tag } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import { PageHeading } from "@/components/ui/primitives";
import { CourseForm } from "@/components/courses/course-form";
import { createCourseAction } from "@/app/actions/courses";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New course" };

export default async function NewCoursePage() {
  await requireRole(["admin", "enseignant"], "/dashboard/courses/new");

  const [categories, tags] = await Promise.all([
    api<Envelope<Category[]>>("/categories"),
    api<Envelope<Tag[]>>("/tags"),
  ]);

  return (
    <div className="grid gap-6">
      <PageHeading
        eyebrow="Courses"
        title="New course"
        description="Everything here can be changed later. A course stays a draft until you publish it, so it is safe to save early."
      />

      <CourseForm
        action={createCourseAction}
        categories={categories.data}
        tags={tags.data}
        submitLabel="Create course"
      />
    </div>
  );
}
