"use server";

import { revalidatePath } from "next/cache";
import { withNotice, type NoticeTone } from "@/lib/notice";
import { redirect } from "next/navigation";

import { api } from "@/lib/api/client";
import { describeError } from "@/lib/api/describe";
import { requireSession } from "@/lib/auth/current-user";
import { getTranslation } from "@/lib/i18n/server";

/**
 * Enrolment actions.
 *
 * Each takes FormData and finishes with a redirect, so the pages that use them
 * are plain HTML forms that work with JavaScript disabled — and so a refresh
 * after enrolling does not re-submit.
 *
 * Both re-establish the session server-side before calling the API. A server
 * action is a public HTTP endpoint; it gets checked exactly as carefully as a
 * route handler would. The API then checks the permission again — neither
 * layer trusts the other to have done it.
 */

export async function enrollAction(formData: FormData): Promise<void> {
  const { locale, t } = await getTranslation();
  await requireSession();

  const courseId = readId(formData.get("courseId"));
  const returnTo = safePath(formData.get("returnTo"), `/courses/${courseId}`);

  let notice = t.notices.enrolled;
  let tone: NoticeTone = "success";

  try {
    await api(`/courses/${courseId}/enroll`, { method: "POST" });
  } catch (error) {
    notice = describeError(t, locale, error, t.notices.enrolFailed);
    tone = "danger";
  }

  // Nothing is cached on the server, but the client router keeps its own copy
  // of the RSC payload; this is what makes the page reflect the change at once.
  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/learning");

  redirect(withNotice(returnTo, notice, tone));
}

export async function leaveCourseAction(formData: FormData): Promise<void> {
  const { locale, t } = await getTranslation();
  await requireSession();

  const courseId = readId(formData.get("courseId"));
  const returnTo = safePath(formData.get("returnTo"), `/courses/${courseId}`);

  let notice = t.notices.leftCourse;
  let tone: NoticeTone = "success";

  try {
    await api(`/courses/${courseId}/enroll`, { method: "DELETE" });
  } catch (error) {
    notice = describeError(t, locale, error, t.notices.leaveFailed);
    tone = "danger";
  }

  revalidatePath(`/courses/${courseId}`);
  revalidatePath("/learning");

  redirect(withNotice(returnTo, notice, tone));
}

// -----------------------------------------------------------------------------

function readId(value: FormDataEntryValue | null): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid course id.");
  }
  return id;
}

/**
 * Only same-site absolute paths are honoured, so a crafted form cannot turn an
 * action into an open redirect.
 */
function safePath(value: FormDataEntryValue | null, fallback: string): string {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

