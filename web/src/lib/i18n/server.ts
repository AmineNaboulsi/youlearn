import "server-only";

import { cookies, headers } from "next/headers";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  type Locale,
  direction,
} from "./config";
import { getDictionary, type Dictionary } from "./dictionaries";
import { makeFormatters, type Formatters } from "@/lib/format";

/**
 * Reading the active locale inside a server component.
 *
 * The proxy has already resolved it — cookie, then Accept-Language, then the
 * default — and stamped the answer on the request as `x-locale`. Reading that
 * header rather than re-deriving it here keeps one source of truth, and means
 * a first-time visitor sees their negotiated language on the very first render
 * instead of the default followed by a flip on the next request.
 *
 * The cookie is still consulted as a fallback, because a route that the proxy
 * matcher skips would otherwise always report the default.
 */
export async function getLocale(): Promise<Locale> {
  const header = (await headers()).get("x-locale");
  if (isLocale(header)) return header;

  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;

  return DEFAULT_LOCALE;
}

export type Translation = {
  locale: Locale;
  dir: "rtl" | "ltr";
  t: Dictionary;
  fmt: Formatters;
};

/**
 * The one call a page makes to become translatable.
 *
 * Returns the whole dictionary rather than a lookup function: the keys are
 * typed, so `t.account.title` is checked at build time and a typo is a
 * compile error rather than a string like "account.titel" rendered to a user.
 */
export async function getTranslation(): Promise<Translation> {
  const locale = await getLocale();
  const dictionary = getDictionary(locale);

  return {
    locale,
    dir: direction(locale),
    t: dictionary,
    fmt: makeFormatters(locale, dictionary.units),
  };
}
