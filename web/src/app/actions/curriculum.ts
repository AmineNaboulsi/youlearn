"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { api, ApiError } from "@/lib/api/client";
import { describeError } from "@/lib/api/describe";
import { requireRole } from "@/lib/auth/current-user";
import { getTranslation } from "@/lib/i18n/server";
import type { FormState } from "@/lib/forms";

/**
 * Curriculum authoring actions.
 *
 * Section operations are plain form posts that redirect — they are small, and
 * keeping them JavaScript-free means an instructor can reorder a course on a
 * bad connection. The lesson form uses useActionState instead, because it sits
 * next to an upload widget and losing a half-filled form to a validation error
 * would mean re-uploading the video.
 *
 * Ownership is enforced by the API on every one of these; none of it is
 * re-implemented here.
 */

// ------------------------------------------------------------------ sections

export async function createSectionAction(formData: FormData): Promise<void> {
  const { locale, t } = await getTranslation();
  await requireRole(["admin", "enseignant"]);

  const courseId = readId(formData.get("courseId"));
  const title = String(formData.get("title") ?? "").trim();

  if (title.length < 2) {
    finish(courseId, "A section needs a name.");
  }

  let notice = t.notices.sectionAdded;

  try {
    await api(`/courses/${courseId}/sections`, {
      method: "POST",
      body: { title, summary: String(formData.get("summary") ?? "").trim() },
    });
  } catch (error) {
    notice = describeError(t, locale, error, t.notices.sectionAddFailed);
  }

  finish(courseId, notice);
}

export async function renameSectionAction(formData: FormData): Promise<void> {
  const { locale, t } = await getTranslation();
  await requireRole(["admin", "enseignant"]);

  const courseId = readId(formData.get("courseId"));
  const sectionId = readId(formData.get("sectionId"));
  const title = String(formData.get("title") ?? "").trim();

  let notice = t.notices.sectionRenamed;

  try {
    await api(`/courses/${courseId}/sections/${sectionId}`, {
      method: "PUT",
      body: { title, summary: String(formData.get("summary") ?? "").trim() },
    });
  } catch (error) {
    notice = describeError(t, locale, error, t.notices.sectionRenameFailed);
  }

  finish(courseId, notice);
}

export async function deleteSectionAction(formData: FormData): Promise<void> {
  const { locale, t } = await getTranslation();
  await requireRole(["admin", "enseignant"]);

  const courseId = readId(formData.get("courseId"));
  const sectionId = readId(formData.get("sectionId"));

  // Deleting a section takes its lessons and everybody's watch history with
  // it, so the confirmation is typed and checked server-side.
  if (String(formData.get("confirm") ?? "").trim().toLowerCase() !== "delete") {
    finish(courseId, 'Type "delete" to remove a section and its lessons.');
  }

  let notice = t.notices.sectionDeleted;

  try {
    const result = await api<{ message: string }>(
      `/courses/${courseId}/sections/${sectionId}`,
      { method: "DELETE" },
    );
    notice = result.message;
  } catch (error) {
    notice = describeError(t, locale, error, t.notices.sectionDeleteFailed);
  }

  finish(courseId, notice);
}

export async function moveSectionAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "enseignant"]);

  const courseId = readId(formData.get("courseId"));
  const sectionId = readId(formData.get("sectionId"));
  const direction = String(formData.get("direction") ?? "");

  try {
    await api(`/courses/${courseId}/sections/${sectionId}/position`, {
      method: "PATCH",
      body: { direction },
    });
  } catch {
    // Reordering is low-stakes and the result is visible immediately; a failure
    // needs no banner, the order simply will not have changed.
  }

  finish(courseId, null);
}

// ------------------------------------------------------------------- lessons

export async function saveLessonAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const { locale, t } = await getTranslation();
  await requireRole(["admin", "enseignant"]);

  const courseId = readId(formData.get("courseId"));
  const sectionId = readId(formData.get("sectionId"));
  const lessonId = Number(formData.get("lessonId")) || null;

  const kind = String(formData.get("kind") ?? "video");

  const body = {
    title: String(formData.get("title") ?? "").trim(),
    summary: String(formData.get("summary") ?? "").trim(),
    kind,
    video_public_id: String(formData.get("video_public_id") ?? "").trim(),
    document_public_id: String(formData.get("document_public_id") ?? "").trim(),
    text_content: String(formData.get("text_content") ?? ""),
    duration_seconds: Number(formData.get("duration_seconds")) || 0,
    is_preview: formData.get("is_preview") === "on",
  };

  try {
    if (lessonId) {
      await api(`/courses/${courseId}/lessons/${lessonId}`, { method: "PUT", body });
    } else {
      await api(`/courses/${courseId}/sections/${sectionId}/lessons`, { method: "POST", body });
    }
  } catch (error) {
    return {
      ok: false,
      message: describeError(t, locale, error, t.notices.lessonSaveFailed),
      fields: error instanceof ApiError ? (error.fields ?? {}) : {},
    };
  }

  revalidatePath(`/dashboard/courses/${courseId}/curriculum`);
  revalidatePath(`/courses/${courseId}`);

  redirect(
    `/dashboard/courses/${courseId}/curriculum?notice=${encodeURIComponent(
      lessonId ? "Lesson saved." : "Lesson added.",
    )}`,
  );
}

export async function deleteLessonAction(formData: FormData): Promise<void> {
  const { locale, t } = await getTranslation();
  await requireRole(["admin", "enseignant"]);

  const courseId = readId(formData.get("courseId"));
  const lessonId = readId(formData.get("lessonId"));

  let notice = t.notices.lessonDeleted;

  try {
    const result = await api<{ message: string }>(`/courses/${courseId}/lessons/${lessonId}`, {
      method: "DELETE",
    });
    notice = result.message;
  } catch (error) {
    notice = describeError(t, locale, error, t.notices.lessonDeleteFailed);
  }

  finish(courseId, notice);
}

export async function moveLessonAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "enseignant"]);

  const courseId = readId(formData.get("courseId"));
  const lessonId = readId(formData.get("lessonId"));
  const direction = String(formData.get("direction") ?? "");

  try {
    await api(`/courses/${courseId}/lessons/${lessonId}/position`, {
      method: "PATCH",
      body: { direction },
    });
  } catch {
    // As with sections: the outcome is self-evident on screen.
  }

  finish(courseId, null);
}

// -----------------------------------------------------------------------------

function finish(courseId: number, notice: string | null): never {
  revalidatePath(`/dashboard/courses/${courseId}/curriculum`);
  revalidatePath(`/courses/${courseId}`);

  const suffix = notice === null ? "" : `?notice=${encodeURIComponent(notice)}`;
  redirect(`/dashboard/courses/${courseId}/curriculum${suffix}`);
}

function readId(value: FormDataEntryValue | null): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid id.");
  }
  return id;
}
