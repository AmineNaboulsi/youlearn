"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { api } from "@/lib/api/client";
import { describeError } from "@/lib/api/describe";
import { requireSession } from "@/lib/auth/current-user";
import { clearSessionCookie } from "@/lib/auth/session";

/**
 * Session management actions.
 *
 * Revoking the session you are currently using is allowed, and is handled
 * specially: the API reports whether the session it just closed was ours, and
 * if so the local cookie is dropped and the user is sent home. Without that
 * they would be redirected back to a page whose tokens no longer work.
 */

interface RevokeResponse {
  status: true;
  message: string;
  was_current_session?: boolean;
  signed_out_current?: boolean;
}

export async function revokeSessionAction(formData: FormData): Promise<void> {
  await requireSession();

  const sessionId = String(formData.get("sessionId") ?? "");
  const returnTo = safePath(formData.get("returnTo"), "/account/sessions");

  if (!/^[A-Za-z0-9-]{8,64}$/.test(sessionId)) {
    redirect(withNotice(returnTo, "That session could not be identified."));
  }

  let notice = "Session signed out.";
  let endedOwn = false;

  try {
    const result = await api<RevokeResponse>(`/sessions/${sessionId}`, { method: "DELETE" });
    notice = result.message;
    endedOwn = Boolean(result.was_current_session);
  } catch (error) {
    notice = describeError(error, "That session could not be signed out.");
  }

  if (endedOwn) {
    // The tokens in our cookie belong to the session that was just closed, so
    // the cookie is now worthless. A server action can write cookies, which is
    // why the local sign-out happens here rather than via a separate endpoint.
    await dropSessionCookie();
    redirect("/?signed-out=1");
  }

  revalidatePath(returnTo);
  redirect(withNotice(returnTo, notice));
}

export async function revokeOtherSessionsAction(formData: FormData): Promise<void> {
  await requireSession();

  const returnTo = safePath(formData.get("returnTo"), "/account/sessions");
  let notice = "Other sessions signed out.";

  try {
    const result = await api<RevokeResponse>("/me/sessions", {
      method: "DELETE",
      query: { keep_current: "1" },
    });
    notice = result.message;
  } catch (error) {
    notice = describeError(error, "Those sessions could not be signed out.");
  }

  revalidatePath(returnTo);
  redirect(withNotice(returnTo, notice));
}

/** Sign out everywhere, this device included. */
export async function revokeAllSessionsAction(): Promise<void> {
  await requireSession();

  try {
    await api("/me/sessions", { method: "DELETE" });
  } catch {
    // Even if the call failed, continuing to the local sign-out is the right
    // outcome: the user asked to be signed out and must end up signed out.
  }

  await dropSessionCookie();
  redirect("/?signed-out=1");
}

/** Admin: end every session belonging to another account. */
export async function revokeUserSessionsAction(formData: FormData): Promise<void> {
  await requireSession();

  const userId = Number(formData.get("userId"));
  const returnTo = safePath(formData.get("returnTo"), "/dashboard/people");

  if (!Number.isInteger(userId) || userId <= 0) {
    redirect(withNotice(returnTo, "That account could not be identified."));
  }

  let notice = "That account has been signed out everywhere.";

  try {
    const result = await api<RevokeResponse>(`/users/${userId}/sessions`, { method: "DELETE" });
    notice = result.message;
  } catch (error) {
    notice = describeError(error, "Those sessions could not be signed out.");
  }

  revalidatePath(returnTo);
  redirect(withNotice(returnTo, notice));
}

// -----------------------------------------------------------------------------

async function dropSessionCookie(): Promise<void> {
  const store = await cookies();
  clearSessionCookie(store);
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
