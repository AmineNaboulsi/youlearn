"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { api } from "@/lib/api/client";
import { describeError } from "@/lib/api/describe";
import { requireRole } from "@/lib/auth/current-user";
import { getTranslation } from "@/lib/i18n/server";

/**
 * Account administration actions.
 *
 * Each is a thin carrier: the API decides whether the caller may do it, refuses
 * self-suspension and self-deletion, and mirrors the change into Keycloak
 * before touching the local row. Re-implementing any of that here would create
 * a second set of rules that can disagree with the first.
 */

const ROLES = new Set(["admin", "enseignant", "etudiant"]);

export async function setAccountStatusAction(formData: FormData): Promise<void> {
  const { locale, t } = await getTranslation();
  await requireRole(["admin"]);

  const userId = readId(formData.get("userId"));
  const active = formData.get("active") === "1";

  let notice = active
    ? t.notices.accountRestored
    : t.notices.accountSuspendedEverywhere;

  try {
    await api(`/users/${userId}/status`, { method: "PATCH", body: { is_active: active } });
  } catch (error) {
    notice = describeError(t, locale, error, t.notices.accountUpdateFailed);
  }

  finish(notice);
}

export async function setAccountRoleAction(formData: FormData): Promise<void> {
  const { locale, t } = await getTranslation();
  await requireRole(["admin"]);

  const userId = readId(formData.get("userId"));
  const role = String(formData.get("role") ?? "");

  if (!ROLES.has(role)) {
    finish(t.notices.roleDoesNotExist);
  }

  let notice = t.notices.roleUpdated;

  try {
    await api(`/users/${userId}/role`, { method: "PATCH", body: { role } });
  } catch (error) {
    notice = describeError(t, locale, error, t.notices.roleChangeFailed);
  }

  finish(notice);
}

export async function deleteAccountAction(formData: FormData): Promise<void> {
  const { locale, t } = await getTranslation();
  await requireRole(["admin"]);

  const userId = readId(formData.get("userId"));

  // Typed confirmation, checked on the server so posting directly cannot skip it.
  if (String(formData.get("confirm") ?? "").trim().toLowerCase() !== "delete") {
    finish('Type "delete" to confirm removing an account.');
  }

  let notice = t.notices.accountDeleted;

  try {
    await api(`/users/${userId}`, { method: "DELETE" });
  } catch (error) {
    notice = describeError(t, locale, error, t.notices.accountDeleteFailed);
  }

  finish(notice);
}

// -----------------------------------------------------------------------------

function finish(notice: string): never {
  revalidatePath("/dashboard/people");
  redirect(`/dashboard/people?notice=${encodeURIComponent(notice)}`);
}

function readId(value: FormDataEntryValue | null): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Invalid account id.");
  }
  return id;
}
