/**
 * Locale configuration.
 *
 * Deliberately dependency-free and free of "server-only": proxy.ts runs on the
 * edge runtime and imports from here, as do client components that need to
 * render a language name. Anything that touches cookies() or headers() lives
 * in ./server.ts instead.
 *
 * The locale is carried in a cookie rather than a URL segment. Every page here
 * is per-user, server-rendered and marked no-store, so there is no shared
 * cache to vary and no crawler to serve — the two things a /ar/... prefix
 * would buy. Keeping it out of the URL means none of the app's internal links
 * or the proxy's PROTECTED prefixes have to know a locale exists.
 */

export const LOCALES = ["ar", "fr", "en"] as const;

export type Locale = (typeof LOCALES)[number];

/** Arabic is the platform's primary language, not a fallback. */
export const DEFAULT_LOCALE: Locale = "ar";

export const LOCALE_COOKIE = "locale";

/** A year. The choice is the user's and should outlive the session cookie. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

export function direction(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

/**
 * Language names written in their own language — a switcher that labels Arabic
 * as "Arabic" is only useful to someone who already reads English.
 */
export const LOCALE_LABELS: Record<Locale, string> = {
  ar: "العربية",
  fr: "Français",
  en: "English",
};

/**
 * The BCP 47 tags handed to Intl. Distinct from our own two-letter keys
 * because the regional variant decides the date order and the numbering
 * system, and "ar" alone leaves both to the engine's discretion.
 *
 * ar-MA (Morocco) formats dates day-first and — unlike ar-EG — uses Western
 * digits, which is what the rest of the platform's tabular figures assume.
 */
export const INTL_LOCALE: Record<Locale, string> = {
  ar: "ar-MA",
  fr: "fr-FR",
  en: "en-GB",
};
