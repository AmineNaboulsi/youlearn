"use server";

import { revalidatePath } from "next/cache";
import { withNotice, type NoticeTone } from "@/lib/notice";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { api } from "@/lib/api/client";
import { describeError } from "@/lib/api/describe";
import { requireSession } from "@/lib/auth/current-user";
import { getTranslation } from "@/lib/i18n/server";
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
  const { locale, t } = await getTranslation();
  await requireSession();

  const sessionId = String(formData.get("sessionId") ?? "");
  const returnTo = safePath(formData.get("returnTo"), "/account/sessions");

  if (!/^[A-Za-z0-9-]{8,64}$/.test(sessionId)) {
    redirect(withNotice(returnTo, t.notices.sessionUnidentified, "danger"));
  }

  let notice = t.notices.sessionSignedOut;
  let tone: NoticeTone = "success";
  let endedOwn = false;

  try {
    const result = await api<RevokeResponse>(`/sessions/${sessionId}`, { method: "DELETE" });
    notice = result.message;
    endedOwn = Boolean(result.was_current_session);
  } catch (error) {
    notice = describeError(t, locale, error, t.notices.sessionSignOutFailed);
    tone = "danger";
  }

  if (endedOwn) {
    // The tokens in our cookie belong to the session that was just closed, so
    // the cookie is now worthless. A server action can write cookies, which is
    // why the local sign-out happens here rather than via a separate endpoint.
    await dropSessionCookie();
    redirect("/?signed-out=1");
  }

  revalidatePath(returnTo);
  redirect(withNotice(returnTo, notice, tone));
}

export async function revokeOtherSessionsAction(formData: FormData): Promise<void> {
  const { locale, t } = await getTranslation();
  await requireSession();

  const returnTo = safePath(formData.get("returnTo"), "/account/sessions");
  let notice = t.notices.otherSessionsSignedOut;
  let tone: NoticeTone = "success";

  try {
    const result = await api<RevokeResponse>("/me/sessions", {
      method: "DELETE",
      query: { keep_current: "1" },
    });
    notice = result.message;
  } catch (error) {
    notice = describeError(t, locale, error, t.notices.otherSessionsFailed);
    tone = "danger";
  }

  revalidatePath(returnTo);
  redirect(withNotice(returnTo, notice, tone));
}

/** Sign out everywhere, this device included. */
export async function revokeAllSessionsAction(): Promise<void> {
  const { locale, t } = await getTranslation();
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
  const { locale, t } = await getTranslation();
  await requireSession();

  const userId = Number(formData.get("userId"));
  const returnTo = safePath(formData.get("returnTo"), "/dashboard/people");

  if (!Number.isInteger(userId) || userId <= 0) {
    redirect(withNotice(returnTo, "That account could not be identified.", "danger"));
  }

  let notice = "That account has been signed out everywhere.";
  let tone: NoticeTone = "success";

  try {
    const result = await api<RevokeResponse>(`/users/${userId}/sessions`, { method: "DELETE" });
    notice = result.message;
  } catch (error) {
    notice = describeError(t, locale, error, t.notices.otherSessionsFailed);
    tone = "danger";
  }

  revalidatePath(returnTo);
  redirect(withNotice(returnTo, notice, tone));
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

