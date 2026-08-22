"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { api, ApiError } from "@/lib/api/client";
import { describeError } from "@/lib/api/describe";
import type { Envelope, Course } from "@/lib/api/types";
import { requireRole } from "@/lib/auth/current-user";
import type { FormState } from "@/lib/forms";

/**
 * Course authoring actions.
 *
 * The create and update actions use the useActionState shape so a failed save
 * can return field-level errors *and* the values the user typed. Losing a long
 * course outline to a validation error on the title is the kind of thing that
 * makes people stop using an editor.
 *
 * Ownership is not checked here. It is checked by the API, which is the only
 * place that knows who owns a course — duplicating the rule in the client
 * would create two versions of it that can disagree.
 */

export async function createCourseAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole(["admin", "enseignant"]);

  let created: number;

  try {
    const response = await api<Envelope<Course> & { message: string }>("/courses", {
      method: "POST",
      body: toPayload(formData),
    });
    created = response.data.id;
  } catch (error) {
    return failure(error, "The course could not be created.");
  }

  revalidatePath("/dashboard/courses");
  revalidatePath("/courses");

  redirect(`/dashboard/courses/${created}?notice=${encodeURIComponent("Course created.")}`);
}

export async function updateCourseAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole(["admin", "enseignant"]);

  const id = readId(formData.get("id"));

  try {
    await api(`/courses/${id}`, { method: "PUT", body: toPayload(formData) });
  } catch (error) {
    return failure(error, "The course could not be saved.");
  }

  revalidatePath(`/dashboard/courses/${id}`);
  revalidatePath(`/courses/${id}`);
  revalidatePath("/dashboard/courses");

  return { ok: true, message: "Saved.", fields: {} };
}

/** Publish or unpublish. A plain form post, so it works without JavaScript. */
export async function setPublicationAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "enseignant"]);

  const id = readId(formData.get("id"));
  const publish = formData.get("publish") === "1";
  const returnTo = safePath(formData.get("returnTo"), "/dashboard/courses");

  let notice = publish ? "Course published." : "Course unpublished.";

  try {
    await api(`/courses/${id}/publication`, {
      method: "PATCH",
      body: { is_published: publish },
    });
  } catch (error) {
    notice = describeError(error, "The course state could not be changed.");
  }

  revalidatePath("/dashboard/courses");
  revalidatePath(`/courses/${id}`);
  revalidatePath("/courses");

  redirect(withNotice(returnTo, notice));
}

export async function deleteCourseAction(formData: FormData): Promise<void> {
  await requireRole(["admin", "enseignant"]);

  const id = readId(formData.get("id"));

  // A destructive action guarded by a typed confirmation rather than a modal:
  // the form makes the user write the word, and the server checks it, so the
  // guard cannot be skipped by posting straight to the endpoint.
  if (String(formData.get("confirm") ?? "").trim().toLowerCase() !== "delete") {
    redirect(
      withNotice(
        `/dashboard/courses/${id}`,
        'Type "delete" in the confirmation box to remove a course.',
      ),
    );
  }

  const notice = "Course deleted.";

  try {
    await api(`/courses/${id}`, { method: "DELETE" });
  } catch (error) {
    const message = describeError(error, "The course could not be deleted.");
    redirect(withNotice(`/dashboard/courses/${id}`, message));
  }

  revalidatePath("/dashboard/courses");
  revalidatePath("/courses");

  redirect(withNotice("/dashboard/courses", notice));
}

// -----------------------------------------------------------------------------

function toPayload(formData: FormData) {
  const categoryId = String(formData.get("category_id") ?? "").trim();

  return {
    title: String(formData.get("title") ?? "").trim(),
    subtitle: String(formData.get("subtitle") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    content: String(formData.get("content") ?? ""),
    content_type: String(formData.get("content_type") ?? "text"),
    img: String(formData.get("img") ?? "").trim(),
    category_id: categoryId === "" ? null : Number(categoryId),
    is_published: formData.get("is_published") === "on",
    tags: formData
      .getAll("tags")
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0),
  };
}

function failure(error: unknown, fallback: string): FormState {
  return {
    ok: false,
    message: describeError(error, fallback),
    fields: error instanceof ApiError ? (error.fields ?? {}) : {},
  };
}

function readId(value: FormDataEntryValue | null): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid course id.");
  }
  return id;
}

function safePath(value: FormDataEntryValue | null, fallback: string): string {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") ? path : fallback;
}

function withNotice(path: string, notice: string): string {
  const [base, existing] = path.split("?");
  const search = new URLSearchParams(existing);
  search.set("notice", notice);
  return `${base}?${search.toString()}`;
}
