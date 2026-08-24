import { INTL_LOCALE, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { interpolate } from "@/lib/i18n/plural";

/**
 * Date and number formatting.
 *
 * Everything is rendered on the server, so the formatters are built from the
 * request's locale rather than the visitor's browser. A server-formatted date
 * that disagrees with what the client would produce is the classic source of
 * hydration mismatches, and deriving both from the same server-side locale
 * removes the whole category.
 *
 * The API returns MySQL datetimes ("2026-08-21 20:10:56") in UTC and ISO-8601
 * strings from Keycloak. Both are handled.
 */

const TIME_ZONE = "UTC";

function parse(value: string | null | undefined): Date | null {
  if (!value) return null;

  // "2026-08-21 20:10:56" is not a format every engine parses; make it ISO and
  // mark it UTC, which is what the API stores.
  const normalised = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? `${value.replace(" ", "T")}Z`
    : value;

  const date = new Date(normalised);
  return Number.isNaN(date.getTime()) ? null : date;
}

export type Formatters = ReturnType<typeof makeFormatters>;

/**
 * Build the formatter set for one request's locale.
 *
 * A factory rather than free functions taking a locale: a page destructures it
 * once from getTranslation() and every call site below stays as short as it
 * was, which is what keeps the locale from being quietly forgotten on one of
 * the fifty-odd call sites.
 */
export function makeFormatters(locale: Locale) {
  const intl = INTL_LOCALE[locale];
  const units = getDictionary(locale).units;

  function date(value: string | null | undefined, fallback = "—"): string {
    const parsed = parse(value);
    if (!parsed) return fallback;

    return new Intl.DateTimeFormat(intl, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: TIME_ZONE,
    }).format(parsed);
  }

  function dateTime(value: string | null | undefined, fallback = "—"): string {
    const parsed = parse(value);
    if (!parsed) return fallback;

    return new Intl.DateTimeFormat(intl, {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: TIME_ZONE,
    }).format(parsed);
  }

  /**
   * "3 days ago" / "in 2 hours".
   *
   * Computed against the render time, which is honest for a server-rendered
   * page that is never cached — every request recomputes it.
   */
  function relative(value: string | null | undefined, fallback = "—"): string {
    const parsed = parse(value);
    if (!parsed) return fallback;

    const seconds = Math.round((parsed.getTime() - Date.now()) / 1000);
    const formatter = new Intl.RelativeTimeFormat(intl, { numeric: "auto" });

    const sizes: Array<[Intl.RelativeTimeFormatUnit, number]> = [
      ["year", 31_536_000],
      ["month", 2_592_000],
      ["week", 604_800],
      ["day", 86_400],
      ["hour", 3_600],
      ["minute", 60],
    ];

    for (const [unit, size] of sizes) {
      if (Math.abs(seconds) >= size) {
        return formatter.format(Math.round(seconds / size), unit);
      }
    }

    return formatter.format(seconds, "second");
  }

  function number(value: number): string {
    return new Intl.NumberFormat(intl).format(value);
  }

  /** "in 4 minutes" style countdown used for token and quota expiry. */
  function duration(seconds: number): string {
    if (seconds <= 0) return units.now;
    if (seconds < 60) return interpolate(units.seconds, { count: number(seconds) });

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return interpolate(units.minutes, { count: number(minutes) });

    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return remainder === 0
      ? interpolate(units.hours, { count: number(hours) })
      : interpolate(units.hoursMinutes, {
          hours: number(hours),
          minutes: number(remainder),
        });
  }

  /**
   * Runtime as a clock: 95 -> "1:35", 3725 -> "1:02:05".
   *
   * Distinct from duration(), which is prose for a countdown ("4 min"). A
   * lesson list wants the compact form people recognise from a video player.
   *
   * Left in Western digits and unlocalised separators on purpose — this is the
   * one figure that has to line up with the numbers a video player draws over
   * its own timeline, and those are never localised.
   */
  function clock(seconds: number): string {
    const safe = Math.max(0, Math.floor(seconds));

    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;

    const pad = (n: number) => String(n).padStart(2, "0");

    return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
  }

  /**
   * Total watch time in words: "3 h 12 min", "45 min", "under a minute".
   * Used where a raw clock would read as a timestamp rather than a quantity.
   */
  function watchTime(seconds: number): string {
    if (seconds < 60) return units.underAMinute;

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0) return interpolate(units.minutes, { count: number(minutes) });
    return minutes === 0
      ? interpolate(units.hours, { count: number(hours) })
      : interpolate(units.hoursMinutes, {
          hours: number(hours),
          minutes: number(minutes),
        });
  }

  return { date, dateTime, relative, number, duration, clock, watchTime };
}
