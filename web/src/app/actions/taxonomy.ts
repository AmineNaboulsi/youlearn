"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { api } from "@/lib/api/client";
import { describeError } from "@/lib/api/describe";
import { requireRole } from "@/lib/auth/current-user";

/**
 * Category and tag administration.
 *
 * Deletion is refused by the API while an entry is still in use, and that
 * refusal surfaces here as a plain message. It is deliberately not overridable
 * from the UI: silently un-categorising a dozen courses because someone tidied
 * up a list is the kind of change nobody notices until it is hard to undo.
 */

export async function saveCategoryAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const id = optionalId(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();

  if (name.length < 2) {
    finish("A category needs a name of at least two characters.");
  }

  let notice = id ? "Category renamed." : "Category created.";

  try {
    await api(id ? `/categories/${id}` : "/categories", {
      method: id ? "PUT" : "POST",
      body: { name },
    });
  } catch (error) {
    notice = describeError(error, "That category could not be saved.");
  }

  finish(notice);
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const id = requireIdValue(formData.get("id"));
  let notice = "Category deleted.";

  try {
    await api(`/categories/${id}`, { method: "DELETE" });
  } catch (error) {
    notice = describeError(error, "That category could not be deleted.");
  }

  finish(notice);
}

export async function saveTagAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const id = optionalId(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();

  if (title.length < 2) {
    finish("A tag needs a name of at least two characters.");
  }

  let notice = id ? "Tag renamed." : "Tag created.";

  try {
    await api(id ? `/tags/${id}` : "/tags", {
      method: id ? "PUT" : "POST",
      body: { title },
    });
  } catch (error) {
    notice = describeError(error, "That tag could not be saved.");
  }

  finish(notice);
}

export async function deleteTagAction(formData: FormData): Promise<void> {
  await requireRole(["admin"]);

  const id = requireIdValue(formData.get("id"));
  let notice = "Tag deleted.";

  try {
    await api(`/tags/${id}`, { method: "DELETE" });
  } catch (error) {
    notice = describeError(error, "That tag could not be deleted.");
  }

  finish(notice);
}

// -----------------------------------------------------------------------------

function finish(notice: string): never {
  revalidatePath("/dashboard/taxonomy");
  revalidatePath("/courses");
  redirect(`/dashboard/taxonomy?notice=${encodeURIComponent(notice)}`);
}

function optionalId(value: FormDataEntryValue | null): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function requireIdValue(value: FormDataEntryValue | null): number {
  const id = optionalId(value);
  if (id === null) {
    throw new Error("Invalid id.");
  }
  return id;
}
