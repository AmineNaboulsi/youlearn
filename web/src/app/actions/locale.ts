"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
  DEFAULT_LOCALE,
} from "@/lib/i18n/config";

/**
 * Switch the display language.
 *
 * A server action rather than a client handler, so the switcher is a plain
 * form that works with JavaScript disabled — the same reason sign-out is a
 * form. The cookie is written here (an action may set cookies; a server
 * component may not) and the redirect re-renders the page from scratch in the
 * new language, which is what the direction flip on <html> needs anyway.
 */
export async function setLocaleAction(formData: FormData): Promise<void> {
  const requested = formData.get("locale");
  const locale = isLocale(typeof requested === "string" ? requested : null)
    ? (requested as string)
    : DEFAULT_LOCALE;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect(safePath(formData.get("returnTo")));
}

/**
 * Only same-site absolute paths are honoured, so a crafted form cannot turn
 * the switcher into an open redirect.
 */
function safePath(value: FormDataEntryValue | null): string {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}
