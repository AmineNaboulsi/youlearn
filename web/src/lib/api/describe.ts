import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { interpolate, plural } from "@/lib/i18n/plural";

import { ApiError } from "./client";

/**
 * Turn a thrown API error into something worth showing a person.
 *
 * The API's own message is preferred, because it is written for an end user
 * ("You are already enrolled in this course.") rather than for a log. Anything
 * that is not an ApiError is a bug on our side, and gets the generic fallback
 * so an internal stack message never reaches a page.
 *
 * Deliberately not in a "use server" module: every export from one of those
 * becomes a callable server action, and a string formatter has no business
 * being a network endpoint.
 *
 * The API's messages arrive in whatever language the API speaks and are passed
 * through untouched; only the strings we author here are localised.
 */
export function describeError(
  t: Dictionary,
  locale: Locale,
  error: unknown,
  fallback: string,
): string {
  if (!(error instanceof ApiError)) {
    return fallback;
  }

  if (error.isRateLimited) {
    const seconds = error.retryAfterSeconds ?? 0;
    if (seconds > 0) {
      const minutes = Math.ceil(seconds / 60);
      return interpolate(t.notices.rateLimited, {
        minutes: plural(locale, minutes, t.notices.minutesCount),
      });
    }
    return t.notices.rateLimitedGeneric;
  }

  if (error.fields) {
    const first = Object.values(error.fields)[0];
    if (first) return first;
  }

  return error.message || fallback;
}
