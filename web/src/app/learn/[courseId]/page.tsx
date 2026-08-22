import { redirect } from "next/navigation";

import { api, ApiError } from "@/lib/api/client";
import type { Curriculum, Envelope } from "@/lib/api/types";
import { requireSession } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

/**
 * "Continue learning" — resolves to wherever the learner should actually be.
 *
 * A redirect rather than a page, so the button on the course card, the one in
 * the learning list and a bookmarked /learn/12 all land on the same lesson:
 * the first one not yet completed, or the first lesson for someone starting.
 */
export default async function ContinueLearningPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  await requireSession(`/learn/${courseId}`);

  let curriculum: Curriculum;

  try {
    const response = await api<Envelope<Curriculum>>(`/courses/${courseId}/curriculum`);
    curriculum = response.data;
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.isForbidden)) {
      redirect(`/courses/${courseId}`);
    }
    throw error;
  }

  const next = curriculum.progress?.next_lesson_id;
  if (next) {
    redirect(`/learn/${courseId}/${next}`);
  }

  // No progress record yet, or the viewer is not enrolled: fall back to the
  // first lesson they are allowed to open.
  const firstOpen = curriculum.sections
    .flatMap((section) => section.lessons)
    .find((lesson) => !lesson.locked);

  if (firstOpen) {
    redirect(`/learn/${courseId}/${firstOpen.id}`);
  }

  // Nothing playable — an empty course, or one where everything is locked.
  redirect(`/courses/${courseId}`);
}
