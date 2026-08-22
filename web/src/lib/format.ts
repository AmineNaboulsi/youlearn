/**
 * Date and number formatting.
 *
 * Everything is rendered on the server, so the locale is pinned rather than
 * taken from the visitor. A server-formatted date that disagrees with what the
 * client would produce is the classic source of hydration mismatches, and
 * pinning it removes the whole category.
 *
 * The API returns MySQL datetimes ("2026-08-21 20:10:56") in UTC and ISO-8601
 * strings from Keycloak. Both are handled.
 */

const LOCALE = "en-GB";
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

export function formatDate(value: string | null | undefined, fallback = "—"): string {
  const date = parse(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: TIME_ZONE,
  }).format(date);
}

export function formatDateTime(value: string | null | undefined, fallback = "—"): string {
  const date = parse(value);
  if (!date) return fallback;

  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(date);
}

/**
 * "3 days ago" / "in 2 hours".
 *
 * Computed against the render time, which is honest for a server-rendered page
 * that is never cached — every request recomputes it.
 */
export function formatRelative(value: string | null | undefined, fallback = "—"): string {
  const date = parse(value);
  if (!date) return fallback;

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return formatter.format(Math.round(seconds / size), unit);
    }
  }

  return formatter.format(seconds, "second");
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** "in 4 minutes" style countdown used for token and quota expiry. */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "now";
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours} h` : `${hours} h ${remainder} min`;
}

/**
 * Runtime as a clock: 95 -> "1:35", 3725 -> "1:02:05".
 *
 * Distinct from formatDuration(), which is prose for a countdown ("4 min").
 * A lesson list wants the compact form people recognise from a video player.
 */
export function formatClock(seconds: number): string {
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
export function formatWatchTime(seconds: number): string {
  if (seconds < 60) return "under a minute";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}
